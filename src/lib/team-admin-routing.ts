export const teamAdminPathHeader = "x-teamalum-admin-path";
export const teamAdminHeader = "x-teamalum-admin-client";
export function teamAdminRoute(pathname: string) {
  const match = /^\/studio\/([a-zA-Z0-9_-]+)\/admin(\/.*)?$/.exec(pathname);
  return match
    ? { clientId: match[1], pathname: `/admin${match[2] || ""}` }
    : null;
}
export function teamAdminPath(path: string, clientId?: string | null) {
  if (!clientId) return path;
  const base = `/studio/${encodeURIComponent(clientId)}`;
  if (path === "/admin" || /^\/admin[/?#]/.test(path)) return `${base}${path}`;
  if (path === "/") return `/preview/${encodeURIComponent(clientId)}`;
  if (path === "/join") return `/preview/${encodeURIComponent(clientId)}/join`;
  return path;
}
