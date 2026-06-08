import { Contact } from "@/lib/contact-options";

export function formatContactName(contact: Contact) {
  return `${contact.first_name} ${contact.last_name}`.trim();
}

export function getContactStatus(contact: Contact) {
  return contact.status ?? "New";
}

export function getMembershipStatus(contact: Contact) {
  return contact.membership_status ?? "Not Started";
}

export function getContactTags(contact: Contact) {
  return Array.isArray(contact.tags) ? contact.tags.filter(Boolean) : [];
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatOptionalDate(value: string | null | undefined) {
  return value ? formatDate(value) : "-";
}

export function formatCurrencyFromCents(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-";
  }

  return new Intl.NumberFormat("en-CA", {
    currency: "CAD",
    style: "currency",
  }).format(value / 100);
}
