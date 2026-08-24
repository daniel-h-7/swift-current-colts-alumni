import Link from "next/link";
import { SiteNotLaunched } from "@/components/site-not-launched";
import { getPlatformClient } from "@/lib/platform-data";
import { getSiteContentForClient } from "@/lib/site-content";

export const dynamic = "force-dynamic";

type PageParams = {
  clientId: string;
};

export default async function ClientMembershipSuccessPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { clientId } = await params;
  const client = await getPlatformClient(clientId);

  if (!client?.launch_approved_at) {
    return <SiteNotLaunched siteName={client?.name} />;
  }

  const siteContent = await getSiteContentForClient(client.id);
  const brand = siteContent.brand;

  return (
    <main
      className="min-h-screen text-white"
      style={{ backgroundColor: brand.secondaryColor }}
    >
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16 text-center">
        <p
          className="text-xs font-black uppercase tracking-[0.28em]"
          style={{ color: brand.accentColor }}
        >
          Membership complete
        </p>
        <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
          Thank you for supporting {client.name}.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-slate-300">
          Your membership is recorded and helps the program keep alumni,
          families, and supporters connected.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            className="rounded-full px-6 py-4 text-sm font-black uppercase text-white"
            href="/"
            style={{ backgroundColor: brand.primaryColor }}
          >
            Back Home
          </Link>
          <Link
            className="rounded-full border border-white/15 px-6 py-4 text-sm font-black uppercase text-white"
            href="/join"
          >
            Join Page
          </Link>
        </div>
      </section>
    </main>
  );
}
