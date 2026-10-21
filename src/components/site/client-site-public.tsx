import { notFound } from "next/navigation";
import {
  LegendsSite,
  LegendsSuccess,
} from "@/components/site/legends/legends-site";
import { SiteNotLaunched } from "@/components/site-not-launched";
import { getMembershipSettingsForClient } from "@/lib/membership-settings";
import {
  getClientFeatures,
  getPlatformClient,
  getPlatformClientByStudioSlug,
} from "@/lib/platform-data";
import { getSiteContentForClient } from "@/lib/site-content";
import { getSiteSections } from "@/lib/site-sections";

// Public pages always enforce launch approval; previews retain their existing
// access path and use the exact same presentation as the live client site.
export async function ClientSitePublic({
  clientId,
  showJoin = false,
  preview = false,
  standalone = false,
}: {
  clientId: string;
  showJoin?: boolean;
  preview?: boolean;
  standalone?: boolean;
}) {
  const client = preview
    ? await getPlatformClient(clientId)
    : await getPlatformClientByStudioSlug(clientId);
  if (!client && preview) notFound();
  if (!client || (!preview && !client.launch_approved_at))
    return <SiteNotLaunched siteName={client?.name} />;
  const [content, settings, features, sections] = await Promise.all([
    getSiteContentForClient(client.id),
    getMembershipSettingsForClient(client.id),
    getClientFeatures(client.id),
    getSiteSections(client.id),
  ]);
  return (
    <LegendsSite
      client={client}
      content={content}
      settings={settings}
      features={features}
      sections={sections}
      showJoin={showJoin}
      preview={preview}
      manageHref={standalone ? "/membership/manage" : undefined}
    />
  );
}

export async function ClientSiteSuccess({
  clientId,
  standalone = false,
}: {
  clientId: string;
  standalone?: boolean;
}) {
  const client = await getPlatformClientByStudioSlug(clientId);
  if (!client?.launch_approved_at)
    return <SiteNotLaunched siteName={client?.name} />;
  const content = await getSiteContentForClient(client.id);
  return (
    <LegendsSuccess
      client={client}
      content={content}
      manageHref={standalone ? "/membership/manage" : undefined}
    />
  );
}
