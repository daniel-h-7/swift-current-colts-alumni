/** Accept only local legacy admin destinations; this never grants team access. */
export function safeLegacyAdminPath(value: string | null) {
  if (!value || /[\\\u0000-\u001f]/.test(value) || /%(?:2f|5c)/i.test(value)) return "/admin";
  try {
    const url = new URL(value, "https://teamalum.invalid");
    if (url.origin !== "https://teamalum.invalid" || !/^\/admin(?:\/|$)/.test(url.pathname)) return "/admin";
    if (url.pathname === "/admin/login") return "/admin";
    return url.pathname + url.search;
  } catch { return "/admin"; }
}

export function legacyAdminResource(path: string) {
  const pathname = new URL(path, "https://teamalum.invalid").pathname;
  const match = /^\/admin\/(campaigns|contacts)\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(?:\/|$)/i.exec(pathname);
  return match ? { table: match[1] === "campaigns" ? "campaigns" : "contacts", id: match[2] } : null;
}
