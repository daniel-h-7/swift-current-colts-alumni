import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteContentForm } from "@/components/site-content-form";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

type SiteContentSearchParams = {
  saved?: string;
};

export default async function SiteContentSettingsPage({
  searchParams,
}: {
  searchParams: Promise<SiteContentSearchParams>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const [content, params] = await Promise.all([getSiteContent(), searchParams]);

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[5px] text-red-500">
              Manage Site Content
            </p>
            <h1 className="mt-3 text-4xl font-black">Homepage Content</h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-md border border-white/15 bg-black/25 px-5 py-3 text-sm font-bold text-gray-200 transition hover:border-blue-500 hover:bg-blue-950/35 hover:text-white"
              href="/admin/settings"
            >
              Settings
            </Link>
            <Link
              className="rounded-md border border-white/15 bg-black/25 px-5 py-3 text-sm font-bold text-gray-200 transition hover:border-blue-500 hover:bg-blue-950/35 hover:text-white"
              href="/admin"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <SiteContentForm content={content} saved={params.saved === "1"} />
      </div>
    </main>
  );
}
