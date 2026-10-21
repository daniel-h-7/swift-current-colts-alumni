import "server-only";
import { defaultClientFeatures } from "@/lib/platform-shared";
import { createStarterSiteContent } from "@/lib/site-content";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { clientHostname, normalizeClientId, validateClientSubdomain } from "@/lib/client-address";
export { normalizeClientId };

export type CreateClientInput = {
  annualMembershipAmountCents?: number; clientId: string; customDomain?: string | null;
  joinBody?: string; joinHeadline?: string; membershipYearLabel?: string; name: string;
  planKey?: string; siteVariant?: string; status?: string; subdomain?: string | null;
  ownerAuthUserId?: string;
};

export async function createTeamAlumClient(input: CreateClientInput) {
  const subdomain = input.subdomain || input.clientId;
  const error = validateClientSubdomain(subdomain) || validateClientSubdomain(input.clientId);
  if (error) throw new Error(error);
  const amount = input.annualMembershipAmountCents ?? 10000;
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("Enter a valid membership amount.");
  const payload = {
    ...input, subdomain, annualMembershipAmountCents: amount,
    primaryDomain: clientHostname({ id: input.clientId, subdomain }, process.env.TEAMALUM_ROOT_DOMAIN ?? "teamalum.com"),
    siteVariant: input.siteVariant?.trim() || input.clientId,
    planKey: input.planKey?.trim() || "starter", status: input.status?.trim() || "trial",
    joinHeadline: input.joinHeadline?.trim() || "Help build the legacy.",
    joinBody: input.joinBody?.trim() || "Support the student-athletes building the next chapter.",
    membershipYearLabel: input.membershipYearLabel?.trim() || `${input.name} Alumni and Boosters`,
    siteContent: createStarterSiteContent(input.name), features: defaultClientFeatures,
  };
  const { error: rpcError } = await createServerSupabaseClient().rpc("teamalum_provision_client", { p_input: payload });
  if (rpcError) throw new Error(rpcError.message.includes("teamalum_provision_client") ? "Apply the setup reliability database migration before creating a site." : rpcError.message);
}
