import type { PlatformClient, ClientFeature, ClientIntegration } from "@/lib/platform-data";
import type { SiteContent } from "@/lib/site-content";
import { clientHostname, validateClientSubdomain } from "@/lib/client-address";

export type LaunchChecklistItem = { key: string; href?: string; isComplete: boolean; label: string; note: string };
export function buildLaunchReadiness({client,features,content,stripe,rootDomain="teamalum.com",mode="live"}: {client: PlatformClient; features: ClientFeature[]; content: SiteContent; stripe?: ClientIntegration; rootDomain?: string; mode?: string}) {
  const state = client.setup_state ?? {};
  const base = `/studio/${encodeURIComponent(client.id)}`;
  const payments = features.find(f=>f.feature_key==="memberships")?.is_enabled !== false;
  const meta = stripe?.metadata;
  const paymentReady = Boolean(mode==="live" && stripe?.status==="connected" && meta?.verification_mode==="live" && meta?.verified_client_id===client.id && meta?.verified_account_id===stripe.external_account_id && meta?.charges_enabled && meta?.payouts_enabled && meta?.details_submitted && !meta?.disabled_reason);
  const validAddress = !validateClientSubdomain(client.subdomain || client.id);
  let hostname="";try{hostname=clientHostname(client,rootDomain);}catch{}
  const items: LaunchChecklistItem[] = [
    {key:"content",href:`${base}/content`,isComplete:Boolean(state.content_reviewed_at&&content.brand.siteTitle&&content.brand.heroTitle&&content.brand.heroBody),label:"Homepage reviewed",note:"Confirm the copy is ready; template text does not count automatically."},
    {key:"visual",href:`${base}/content`,isComplete:Boolean(state.visual_reviewed_at&&(content.brand.logoUrl||content.brand.heroImageUrl)),label:"Logo and imagery reviewed",note:"Review the organization’s images and confirm them below."},
    {key:"features",href:base,isComplete:Boolean(state.features_reviewed_at&&features.some(f=>f.is_enabled)),label:"Features selected",note:"Save or confirm the features this organization will use."},
    ...(payments?[{key:"payments",href:`${base}/payments`,isComplete:paymentReady,label:"Live payments and payouts",note:"Verify this organization’s live Stripe account. Test-mode setup does not enable live launch."}]:[]),
    {key:"address",isComplete:validAddress,label:"Site address assigned",note:validAddress?`${hostname} is assigned; hosting is checked separately.`:"Choose a valid, available site address."},
    {key:"domain",isComplete:Boolean(state.domain_verified_at&&state.domain_verified_hostname===hostname),label:"Hosting verified",note:"Check that the assigned public address serves this organization."},
    {key:"preview",href:`/preview/${encodeURIComponent(client.id)}`,isComplete:Boolean(state.preview_reviewed_at),label:"Preview reviewed",note:"Open the preview and explicitly confirm it after your latest changes."},
  ];
  const blockers=items.filter(i=>!i.isComplete);
  return {items,blockers,isReady:blockers.length===0,completed:items.length-blockers.length,nextAction:blockers[0]??null};
}
