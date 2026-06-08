export const relationshipTypes = [
  "Alumni",
  "Parent / Guardian",
  "Booster",
  "Coach / Staff",
  "Community Supporter",
  "Student Athlete",
] as const;

export const sports = [
  "Football",
  "Cheer",
  "Band",
  "Athletics Support",
  "Other",
] as const;

export const contactStatuses = [
  "New",
  "Active",
  "Follow Up",
  "Do Not Contact",
] as const;

export const membershipStatuses = [
  "Not Started",
  "Pending Payment",
  "Active Member",
  "Expired",
] as const;

export type RelationshipType = (typeof relationshipTypes)[number];
export type Sport = (typeof sports)[number];
export type ContactStatus = (typeof contactStatuses)[number];
export type MembershipStatus = (typeof membershipStatuses)[number];

export type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  graduation_year: number | null;
  relationship_type: RelationshipType;
  sport: Sport;
  email_opt_in: boolean;
  sms_opt_in: boolean;
  notes: string | null;
  status?: ContactStatus | null;
  membership_status?: MembershipStatus | null;
  tags?: string[] | null;
  admin_notes?: string | null;
  created_at: string;
};

export type ContactInsert = Omit<
  Contact,
  "id" | "created_at" | "status" | "membership_status" | "tags" | "admin_notes"
>;
