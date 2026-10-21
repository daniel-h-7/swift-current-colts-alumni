export const reservedSubdomains = new Set(["app", "www", "teamalum", "api", "hq", "studio", "admin", "mail", "support", "help", "assets", "static"]);

export function normalizeClientId(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function validateClientSubdomain(value: string) {
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(value)) return "Use a site address of 1–63 lowercase letters, numbers, or internal hyphens.";
  if (reservedSubdomains.has(value)) return "That site address is reserved by TeamAlum. Choose a different address.";
  return null;
}

export function clientHostname(client: { id: string; subdomain?: string | null }, rootDomain = "teamalum.com") {
  const slug = client.subdomain || client.id;
  const error = validateClientSubdomain(slug);
  if (error || !/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(rootDomain)) throw new Error(error || "Invalid TeamAlum root domain.");
  return `${slug}.${rootDomain.toLowerCase()}`;
}
