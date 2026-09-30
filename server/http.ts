import type { IncomingMessage, ServerResponse } from "node:http";

/** Small HTTP helpers shared by the auth, portal and Data API handlers. */

export type HttpError = Error & { status: number };

export const httpError = (status: number, message: string) => Object.assign(new Error(message), { status }) as HttpError;

export async function readJson(req: IncomingMessage, maxBytes: number): Promise<Record<string, unknown>> {
  if (!String(req.headers["content-type"] ?? "").includes("application/json")) {
    // Also blocks cross-site form posts, which cannot send application/json.
    throw httpError(415, "Expected application/json");
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > maxBytes) throw httpError(413, "Request too large");
    chunks.push(chunk as Buffer);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    return body && typeof body === "object" ? body : {};
  } catch {
    throw httpError(400, "Invalid JSON");
  }
}

export function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string | string[]> = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

/** Sends a thrown error as JSON; unexpected errors are logged and hidden from the client. */
export function sendError(res: ServerResponse, error: unknown, tag: string) {
  const status = (error as HttpError).status ?? 500;
  if (status === 500) console.error(`[${tag}]`, error);
  send(res, status, { error: status === 500 ? "Something went wrong. Try again." : (error as Error).message });
}

export function readCookie(req: IncomingMessage, name: string) {
  const header = req.headers.cookie ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

/** "/api/portal/tickets?x=1" → "tickets" for prefix "/api/portal". */
export function routeAction(req: IncomingMessage, prefix: string) {
  const path = (req.url ?? "").split("?")[0].replace(/\/+$/, "");
  if (!path.startsWith(`${prefix}/`)) return null;
  const action = path.slice(prefix.length + 1);
  return /^[a-z-]+$/.test(action) ? action : null;
}

export function queryParam(req: IncomingMessage, name: string) {
  return new URL(req.url ?? "/", "http://local").searchParams.get(name);
}

export function str(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function validEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Avatar and logo fields accept an http(s) URL or nothing. */
export function optionalUrl(value: unknown, label: string) {
  const url = str(value).trim();
  if (!url) return null;
  if (url.length > 2000 || !/^https?:\/\/\S+$/i.test(url)) throw httpError(400, `${label} must be an http(s) URL.`);
  return url;
}

export const nowSeconds = () => Math.floor(Date.now() / 1000);
