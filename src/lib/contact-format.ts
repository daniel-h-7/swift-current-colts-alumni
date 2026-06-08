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
