import { getToken, clearToken } from "./tokenStorage";
import { notifyUnauthorized } from "./authEvents";

async function extractErrorMessage(
  response: Response,
  url: string,
): Promise<string> {
  const fallback = `HTTP ${response.status} on ${url}`;
  try {
    const body = (await response.json()) as unknown;
    if (typeof body !== "object" || body === null) {
      return fallback;
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
      typeof body.error.message === "string"
    ) {
      return body.error.message;
    }
  } catch {
    return fallback;
  }
  return fallback;
}

function fetchJson<T>(url: string, options: RequestInit): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers }).then(async (response) => {
    if (response.status === 401 && token) {
      clearToken();
      notifyUnauthorized();
    }
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, url));
    }
    return await response.json();
  });
}

export default fetchJson;
