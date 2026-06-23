import {
  ContactInsert,
  relationshipTypes,
  sports,
} from "@/lib/contact-options";

export function isValidContact(value: unknown): value is ContactInsert {
  if (!value || typeof value !== "object") {
    return false;
  }

  const contact = value as Partial<ContactInsert>;

  return (
    typeof contact.first_name === "string" &&
    typeof contact.last_name === "string" &&
    typeof contact.email === "string" &&
    (typeof contact.alternate_email === "string" ||
      contact.alternate_email === null ||
      contact.alternate_email === undefined) &&
    typeof contact.email_opt_in === "boolean" &&
    typeof contact.sms_opt_in === "boolean" &&
    relationshipTypes.includes(contact.relationship_type as never) &&
    sports.includes(contact.sport as never) &&
    (typeof contact.phone === "string" || contact.phone === null) &&
    (typeof contact.graduation_year === "number" ||
      contact.graduation_year === null) &&
    (typeof contact.notes === "string" || contact.notes === null)
  );
}
