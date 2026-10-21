import "server-only";
import { getClientFeatures, getPlatformClient } from "@/lib/platform-data";
import { getClientIntegration } from "@/lib/client-integrations";
import { getSiteContentForClient } from "@/lib/site-content";
import { buildLaunchReadiness } from "@/lib/launch-readiness";
import { getStripeMode } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getClientLaunchReadiness(clientId: string) {
  const [client,features,content,stripe] = await Promise.all([getPlatformClient(clientId),getClientFeatures(clientId),getSiteContentForClient(clientId),getClientIntegration(clientId,"stripe_connect")]);
  if(!client)throw new Error("Organization not found.");
  return {...buildLaunchReadiness({client,features,content,stripe,mode:getStripeMode(),rootDomain:process.env.TEAMALUM_ROOT_DOMAIN??"teamalum.com"}),client};
}
export async function approveClientLaunch(clientId: string, overrideReason?: string) {
  const readiness = await getClientLaunchReadiness(clientId);
  const reason = overrideReason?.trim();
  if(!readiness.isReady && (!reason || reason.length<12))throw new Error(`Complete the launch checklist (${readiness.blockers.map(b=>b.label).join(", ")}), or record an HQ override reason of at least 12 characters.`);
  if(reason && reason.length>2000)throw new Error("Keep the override reason under 2,000 characters.");
  const now=new Date().toISOString();
  const {error}=await createServerSupabaseClient().rpc("teamalum_approve_launch",{p_client_id:clientId,p_expected_updated_at:readiness.client.updated_at,p_override:!readiness.isReady?{reason,actor:"hq",recorded_at:now,blockers:readiness.blockers.map(b=>b.key)}:null});
  if(error)throw new Error(error.message);
}
