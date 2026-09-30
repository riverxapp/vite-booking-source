import { env } from "./env";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions<TBody = unknown> = {
  method?: RequestMethod;
  body?: TBody;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

function buildUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${env.apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> {
  const { method = "GET", body, headers, signal } = options;

  const response = await fetch(buildUrl(path), {
    method,
    headers: {
      "Content-Type": "application/json",
      // Add auth headers here when authentication is introduced.
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      // Server errors are JSON { error, code? }; surface the human message.
      const parsed = JSON.parse(text) as { error?: unknown };
      if (typeof parsed.error === "string") message = parsed.error;
    } catch {
      // Not JSON: keep the raw text.
    }
    throw Object.assign(new Error(message || `Request failed with status ${response.status}`), { status: response.status });
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
