/** Legacy public hostnames that refer to existing organizations, not new tenants. */
const clientSlugAliases: Readonly<Record<string, string>> = {
  rmramsfootball: "rmrfootball",
  sccoltsfootball: "colts",
};

export function resolveClientSlug(slug: string) {
  return clientSlugAliases[slug] ?? slug;
}
