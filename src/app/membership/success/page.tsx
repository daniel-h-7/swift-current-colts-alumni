import Image from "next/image";
import Link from "next/link";
import { SupportShareBar } from "@/components/support-share-bar";

export default function MembershipSuccessPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const shareUrl = siteUrl ? `${siteUrl}/join` : undefined;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
        <Image
          src="/images/stadium.jpg"
          alt="Football stadium under Friday night lights"
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/80 via-black/85 to-black" />

        <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950/90 p-8 text-center shadow-2xl">
          <p className="text-sm uppercase tracking-[5px] text-red-500">
            Success!
          </p>
          <h1 className="mt-3 text-4xl font-black">
            Thank you for your support of Colts Football!
          </h1>
          <p className="mt-4 text-gray-400">
            Stay tuned for future updates and events regarding the Colts
            program and our supporters.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              className="rounded-md bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-600"
              href="/"
            >
              Home
            </Link>
            <Link
              className="rounded-md border border-white/15 bg-black/25 px-6 py-3 font-bold text-gray-200 hover:border-blue-500 hover:text-white"
              href="/admin"
            >
              Admin
            </Link>
          </div>

          <SupportShareBar shareUrl={shareUrl} />
        </div>
      </section>
    </main>
  );
}
