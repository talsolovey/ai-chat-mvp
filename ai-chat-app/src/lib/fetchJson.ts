async function extractErrorMessage(
  response: Response,
  url: string,
): Promise<string> {
  const fallback = `HTTP ${response.status} on ${url}`;
  try {
    const body = (await response.json()) as unknown;
    if (
      typeof body === "object" &&
      body !== null &&
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

  return fetch(url, { ...options, headers }).then(async (response) => {
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, url));
    }
    return await response.json();
  });
}

export default fetchJson;
