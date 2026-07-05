import { getToken, clearToken } from "./tokenStorage";
import { notifyUnauthorized } from "./authEvents";

export const NETWORK_ERROR_MESSAGE =
  "Unable to reach the server. Please check your connection and try again.";
export const SERVER_ERROR_MESSAGE =
  "The server is temporarily unavailable. Please try again in a moment.";
export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function readMessage(body: unknown): string | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  if ("message" in body) {
    const { message } = body as { message: unknown };
    if (typeof message === "string") {
      return message;
    }
    if (
      Array.isArray(message) &&
      message.every((m): m is string => typeof m === "string")
    ) {
      return message.join(", ");
    }
  }

  if (
    "error" in body &&
    typeof body.error === "object" &&
    body.error !== null &&
    "message" in body.error &&
    typeof (body.error as { message: unknown }).message === "string"
  ) {
    return (body.error as { message: string }).message;
  }

  return null;
}

export async function extractErrorMessage(response: Response): Promise<string> {
  const fallbackMessage =
    response.status >= 500 ? SERVER_ERROR_MESSAGE : GENERIC_ERROR_MESSAGE;
  try {
    return readMessage((await response.json()) as unknown) ?? fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export function handleUnauthorizedResponse(
  response: Response,
  requestHadToken: boolean,
): void {
  if (response.status === 401 && requestHadToken) {
    clearToken();
    notifyUnauthorized();
  }
}

async function fetchJson<T>(url: string, options: RequestInit): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  const bodyNeedsJsonContentType =
    options.body !== undefined && !(options.body instanceof FormData);
  if (bodyNeedsJsonContentType && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
  }

  handleUnauthorizedResponse(response, Boolean(token));

  if (!response.ok) {
    throw new ApiError(await extractErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export default fetchJson;
