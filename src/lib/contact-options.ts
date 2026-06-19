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
  annual_dues_amount_cents?: number | null;
  gift_donation_amount_cents?: number | null;
  paid_through?: string | null;
  last_payment_at?: string | null;
  stripe_customer_id?: string | null;
  stripe_checkout_session_id?: string | null;
  created_at: string;
};

export type ContactActivity = {
  id: string;
  contact_id: string;
  activity_type: string;
  title: string;
  body: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

export type ContactInsert = Omit<
  Contact,
  "id" | "created_at" | "status" | "membership_status" | "tags" | "admin_notes"
>;
