import Link from "next/link";
import { notFound } from "next/navigation";
import { JoinForm } from "@/components/join-form";
import {
  formatMembershipAmount,
  getMembershipSettingsForClient,
} from "@/lib/membership-settings";
import { getPlatformClient } from "@/lib/platform-data";
import { getSiteContentForClient } from "@/lib/site-content";

export const dynamic = "force-dynamic";

type PageParams = {
  clientId: string;
};

export default async function ClientPreviewJoinPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { clientId } = await params;
  const client = await getPlatformClient(clientId);

  if (!client) {
    notFound();
  }

  const [siteContent, settings] = await Promise.all([
    getSiteContentForClient(client.id),
    getMembershipSettingsForClient(client.id),
  ]);
  const brand = siteContent.brand;
  const heroImage = brand.heroImageUrl || "/images/stadium.jpg";
  const heroImagePosition = brand.heroImagePosition || "50% 50%";

  return (
    <main
      className="min-h-screen text-white"
      style={{ backgroundColor: brand.secondaryColor }}
    >
      <div className="border-b border-amber-300/25 bg-amber-950/50 px-6 py-3 text-center text-xs font-black uppercase text-amber-100">
        Preview Mode
      </div>

      <section className="relative min-h-screen overflow-hidden">
        <div
          aria-label="Site hero image"
          className="absolute inset-0 bg-cover bg-center opacity-45 saturate-125"
          role="img"
          style={{
            backgroundImage: `url("${heroImage}")`,
            backgroundPosition: heroImagePosition,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/82 to-black" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: `linear-gradient(115deg, ${brand.primaryColor}22 0%, transparent 34%, ${brand.accentColor}18 72%, transparent 100%)`,
          }}
        />
        <div className="absolute inset-0 premium-grid opacity-25" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link
            className="flex items-center gap-3"
            href={`/preview/${encodeURIComponent(client.id)}`}
          >
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`${brand.siteTitle} logo`}
                className="h-12 w-12 rounded-full border border-white/25 bg-white object-contain p-1"
                src={brand.logoUrl}
              />
            ) : (
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-sm font-black"
                style={{ backgroundColor: brand.primaryColor }}
              >
                {brand.siteTitle
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </span>
            )}
            <span className="font-black">{brand.siteTitle}</span>
          </Link>
          <Link
            className="rounded-full border border-white/15 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
            href={`/preview/${encodeURIComponent(client.id)}`}
          >
            Back Home
          </Link>
        </header>

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-6 pb-12">
          <div className="grid flex-1 gap-10 py-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div className="border-l border-white/10 pl-6 lg:pt-8">
              <p
                className="text-sm font-black uppercase tracking-[0.28em]"
                style={{ color: brand.accentColor }}
              >
                Preview Checkout
              </p>
              <h1 className="mt-4 text-4xl font-black leading-none md:text-6xl">
                Membership Payment
              </h1>
              <p className="mt-5 max-w-xl text-sm font-semibold leading-7 text-gray-300">
                Use this form to test the membership payment flow before the
                site is approved for public launch.
              </p>

              <div className="mt-7 border border-white/10 bg-zinc-950/80 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.36)]">
                <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                  Annual Membership
                </p>
                <p className="mt-2 text-3xl font-black text-white">
                  {formatMembershipAmount(settings)}
                </p>
                <p className="mt-3 text-xs leading-5 text-gray-500">
                  Renews each year on the subscription date until opted out.
                </p>
              </div>
            </div>

            <JoinForm
              checkoutPath={`/preview/${encodeURIComponent(client.id)}/api/membership/checkout`}
              accentColor={brand.accentColor}
              headline={settings.join_headline}
              isOpen={settings.join_is_open}
              primaryColor={brand.primaryColor}
              programName={client.name}
              subtext={settings.join_body}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
