export function safeStudioNext(value: unknown) {
  if (typeof value !== "string" || /[\\\r\n\u0000]/.test(value)) return "/studio";
  try {
    const url = new URL(value, "https://teamalum.invalid");
    if (url.origin !== "https://teamalum.invalid" || !/^\/studio(?:\/|$)/.test(url.pathname)) return "/studio";
    if (/^\/studio\/(login|logout|create-site)(?:\/|$)/.test(url.pathname)) return "/studio";
    if (/%(?:2f|5c|0[ad])/i.test(url.pathname)) return "/studio";
    return `${url.pathname}${url.search}`;
  } catch { return "/studio"; }
}

export function studioLoginPath(next: string, error?: string) {
  const query = new URLSearchParams({ next: safeStudioNext(next) });
  if (error) query.set("error", error);
  return `/studio/login?${query}`;
}

export function studioOrigin(requestUrl: string) {
  const origin = new URL(process.env.TEAMALUM_STUDIO_URL || requestUrl);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
  if (process.env.NODE_ENV === "production" && loopback) throw new Error("TEAMALUM_STUDIO_URL must use the live Studio address, not localhost.");
  if (origin.username || origin.password || (origin.protocol !== "https:" && !(origin.protocol === "http:" && loopback))) throw new Error("Studio requires a secure canonical URL.");
  return origin.origin;
}

/** Public ADMIN links always enter the assigned team's central workspace. */
export function teamHubHref(clientId: string) {
  const path = `/studio/${encodeURIComponent(clientId)}/hub`;
  const canonical = process.env.TEAMALUM_STUDIO_URL || (process.env.NODE_ENV === "production" ? "https://www.teamalum.com" : "");
  return canonical ? `${studioOrigin(canonical)}${path}` : path;
}
