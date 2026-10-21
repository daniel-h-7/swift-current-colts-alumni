/** Logout must only run after deliberate document navigation, never an RSC prefetch. */
export function isLogoutHref(href: string) {
  return /^\/(?:studio\/(?:[^/]+\/admin\/)?logout|admin\/logout|hq\/logout)(?:[?#]|$)/.test(
    href,
  );
}
export function isBackgroundAuthRequest(request?: Request) {
  if (!request) return false;
  const h = request.headers;
  return (
    h.get("rsc") === "1" ||
    h.has("next-router-prefetch") ||
    /prefetch/i.test(`${h.get("purpose") || ""} ${h.get("sec-purpose") || ""}`)
  );
}
export function ignoredAuthPrefetch() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "private, no-store" },
  });
}
