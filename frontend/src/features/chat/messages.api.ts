import fetchJson, {
  extractErrorMessage,
  handleUnauthorizedResponse,
  NETWORK_ERROR_MESSAGE,
} from "../../lib/fetchJson";
import { getToken } from "../../lib/tokenStorage";
import type {
  GetMessagesResponse,
  SendMessageRequest,
  AssistantStreamEvent,
  Citation,
} from "./types";

function isCitation(value: unknown): value is Citation {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return ["chunkId", "documentId", "documentName", "chunkText"].every(
    (citationField) => typeof candidate[citationField] === "string",
  );
}

function parseAssistantStreamEvent(
  rawPayload: string,
): AssistantStreamEvent | null {
  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(rawPayload);
  } catch {
    return null;
  }

  if (typeof parsedPayload !== "object" || parsedPayload === null) {
    return null;
  }

  const candidateEvent = parsedPayload as Record<string, unknown>;

  if (
    candidateEvent.type === "token" &&
    typeof candidateEvent.text === "string"
  ) {
    return { type: "token", text: candidateEvent.text };
  }
  if (
    candidateEvent.type === "done" &&
    typeof candidateEvent.messageId === "string" &&
    typeof candidateEvent.sentAt === "string"
  ) {
    return {
      type: "done",
      messageId: candidateEvent.messageId,
      sentAt: candidateEvent.sentAt,
    };
  }
  if (
    candidateEvent.type === "error" &&
    typeof candidateEvent.message === "string"
  ) {
    return { type: "error", message: candidateEvent.message };
  }
  if (
    candidateEvent.type === "citations" &&
    Array.isArray(candidateEvent.citations) &&
    candidateEvent.citations.every(isCitation)
  ) {
    return { type: "citations", citations: candidateEvent.citations };
  }
  return null;
}

export function getMessages(
  conversationId: string,
  cursor?: string,
  abortSignal?: AbortSignal,
): Promise<GetMessagesResponse> {
  const cursorQueryString = cursor
    ? `?cursor=${encodeURIComponent(cursor)}`
    : "";
  const requestInit: RequestInit = {
    method: "GET",
  };
  if (abortSignal) {
    requestInit.signal = abortSignal;
  }
  return fetchJson<GetMessagesResponse>(
    `/api/conversations/${conversationId}/messages${cursorQueryString}`,
    requestInit,
  );
}

export type AssistantStreamHandlers = {
  onToken: (tokenText: string) => void;
  onCitations: (citations: Citation[]) => void;
  onDone: (completedMessage: { messageId: string; sentAt: string }) => void;
  onError?: (errorMessage: string) => void;
};

export async function streamAssistantMessage(
  conversationId: string,
  sendMessageRequest: SendMessageRequest,
  streamHandlers: AssistantStreamHandlers,
  abortSignal?: AbortSignal,
): Promise<void> {
  const requestHeaders = new Headers({ "Content-Type": "application/json" });
  const authToken = getToken();
  if (authToken) {
    requestHeaders.set("Authorization", `Bearer ${authToken}`);
  }

  const requestInit: RequestInit = {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(sendMessageRequest),
  };
  if (abortSignal) {
    requestInit.signal = abortSignal;
  }

  let httpResponse: Response;
  try {
    httpResponse = await fetch(
      `/api/conversations/${conversationId}/messages`,
      requestInit,
    );
  } catch {
    streamHandlers.onError?.(NETWORK_ERROR_MESSAGE);
    return;
  }

  handleUnauthorizedResponse(httpResponse, Boolean(authToken));

  if (!httpResponse.ok || !httpResponse.body) {
    streamHandlers.onError?.(await extractErrorMessage(httpResponse));
    return;
  }

  const responseBodyReader = httpResponse.body.getReader();
  const textDecoder = new TextDecoder();
  let serverSentEventBuffer = "";

  for (;;) {
    const { value: chunkBytes, done: streamFinished } =
      await responseBodyReader.read();
    if (streamFinished) {
      break;
    }
    serverSentEventBuffer += textDecoder.decode(chunkBytes, { stream: true });

    let frameBoundaryIndex = serverSentEventBuffer.indexOf("\n\n");
    while (frameBoundaryIndex !== -1) {
      const serverSentEventFrame = serverSentEventBuffer.slice(
        0,
        frameBoundaryIndex,
      );
      serverSentEventBuffer = serverSentEventBuffer.slice(
        frameBoundaryIndex + 2,
      );
      parseAndDispatchServerSentEventFrame(serverSentEventFrame, streamHandlers);
      frameBoundaryIndex = serverSentEventBuffer.indexOf("\n\n");
    }
  }
}

function parseAndDispatchServerSentEventFrame(
  serverSentEventFrame: string,
  streamHandlers: AssistantStreamHandlers,
): void {
  const dataFieldLine = serverSentEventFrame
    .split("\n")
    .find((frameLine) => frameLine.startsWith("data:"));
  if (!dataFieldLine) {
    return;
  }

  const eventPayloadJson = dataFieldLine.slice("data:".length).trim();
  if (!eventPayloadJson) {
    return;
  }

  const streamEvent = parseAssistantStreamEvent(eventPayloadJson);
  if (!streamEvent) {
    return;
  }

  if (streamEvent.type === "token") {
    streamHandlers.onToken(streamEvent.text);
  } else if (streamEvent.type === "citations") {
    streamHandlers.onCitations(streamEvent.citations);
  } else if (streamEvent.type === "done") {
    streamHandlers.onDone({
      messageId: streamEvent.messageId,
      sentAt: streamEvent.sentAt,
    });
  } else if (streamEvent.type === "error") {
    streamHandlers.onError?.(streamEvent.message);
  }
}
