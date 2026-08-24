import { notFound, redirect } from "next/navigation";
import { StudioDashboard } from "@/components/studio/studio-dashboard";
import { getPlatformClient } from "@/lib/platform-data";
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

  if (!(await canAccessStudioClient(clientId))) {
    redirect(`/studio/login?error=${encodeURIComponent("That site is not connected to your login.")}`);
  }

  const client = await getPlatformClient(clientId);

  if (!client) {
    notFound();
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
