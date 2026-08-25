import { redirect } from "next/navigation";
import { StudioDashboard } from "@/components/studio/studio-dashboard";
import { getPlatformClientByStudioSlug } from "@/lib/platform-data";
import { canAccessStudioClient, getStudioSession } from "@/lib/studio-auth";

export const dynamic = "force-dynamic";

type PageParams = {
  clientId: string;
};

type PageSearchParams = {
  created?: string;
  error?: string;
  review_submitted?: string;
};

export default async function ClientStudioPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<PageSearchParams>;
}) {
  const [{ clientId }, query] = await Promise.all([params, searchParams]);
  const session = await getStudioSession();

  if (!session) {
    redirect(`/studio/login?error=${encodeURIComponent("Log in to manage your site.")}`);
  }

  const client = await getPlatformClientByStudioSlug(clientId);

  if (!client) {
    redirect(
      `/studio/login?error=${encodeURIComponent("We could not find that TeamAlum site yet. Try logging in again or check the site URL.")}`,
    );
  }

  if (!(await canAccessStudioClient(client.id))) {
    redirect(`/studio/login?error=${encodeURIComponent("That site is not connected to your login.")}`);
  }

  if (client.id !== clientId) {
    redirect(
      `/studio/${encodeURIComponent(client.id)}${
        query.created ? "?created=1" : ""
      }`,
    );
  }

  return (
    <StudioDashboard
      client={client}
      errorMessage={query.error}
      isCreated={query.created === "1"}
      isReviewSubmitted={query.review_submitted === "1"}
    />
  );
}
