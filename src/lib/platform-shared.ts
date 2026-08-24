export type ClientFeatureKey =
  | "memberships"
  | "sponsors"
  | "events"
  | "spotlights"
  | "fundraising_campaigns"
  | "broadcasts"
  | "custom_domain"
  | "stripe_connect";

export type ClientFeature = {
  feature_key: ClientFeatureKey;
  is_enabled: boolean;
  updated_at?: string;
};

export const defaultClientFeatures: ClientFeature[] = [
  { feature_key: "memberships", is_enabled: true },
  { feature_key: "sponsors", is_enabled: true },
  { feature_key: "events", is_enabled: true },
  { feature_key: "spotlights", is_enabled: true },
  { feature_key: "fundraising_campaigns", is_enabled: false },
  { feature_key: "broadcasts", is_enabled: false },
  { feature_key: "custom_domain", is_enabled: false },
  { feature_key: "stripe_connect", is_enabled: false },
];

const featureLabels: Record<ClientFeatureKey, string> = {
  broadcasts: "Campaigns",
  custom_domain: "Custom Domain",
  events: "Events",
  fundraising_campaigns: "Fundraising Campaigns",
  memberships: "Memberships",
  sponsors: "Sponsors",
  spotlights: "Spotlights",
  stripe_connect: "Client Stripe",
};

const featureDescriptions: Record<ClientFeatureKey, string> = {
  broadcasts: "Email and SMS campaigns with audience segments from the CRM.",
  custom_domain:
    "Publishing to the client's own domain. Planned for a later setup step.",
  events: "Upcoming dates, event links, and homepage calendar highlights.",
  fundraising_campaigns:
    "Campaign pages, target totals, progress, and calls to action.",
  memberships: "Membership signup, renewal status, checkout, and supporter records.",
  sponsors: "Sponsor logos, links, and partner placement on the public site.",
  spotlights: "Alumni profiles, photos, class years, and spotlight copy.",
  stripe_connect:
    "Client-owned Stripe account status. TeamAlum tracks setup without holding client funds.",
};

export function isClientToggleableFeature(featureKey: ClientFeatureKey) {
  return featureKey !== "custom_domain" && featureKey !== "stripe_connect";
}

export function getFeatureManagementLabel(featureKey: ClientFeatureKey) {
  if (featureKey === "custom_domain") {
    return "Planned";
  }

  if (featureKey === "stripe_connect") {
    return "Client Owned";
  }

  return "Client Toggle";
}

export function getFeatureLabel(featureKey: ClientFeatureKey) {
  return featureLabels[featureKey];
}

export function getFeatureDescription(featureKey: ClientFeatureKey) {
  return featureDescriptions[featureKey];
}
