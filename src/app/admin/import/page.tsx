import Link from "next/link";
import { redirect } from "next/navigation";
import { relationshipTypes, sports } from "@/lib/contact-options";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { requiredImportColumns } from "@/lib/contact-import";
import { ContactImportForm } from "@/components/contact-import-form";

type ImportSearchParams = {
  error?: string;
  imported?: string;
};

export default async function ContactImportPage({
  searchParams,
}: {
  searchParams: Promise<ImportSearchParams>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const params = await searchParams;

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[5px] text-red-500">
              CRM Import
            </p>
            <h1 className="mt-3 text-4xl font-black">Import Contacts</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-md border border-white/15 bg-black/25 px-5 py-3 text-sm font-bold text-gray-200 transition hover:border-blue-500 hover:bg-blue-950/35 hover:text-white"
              href="/admin"
            >
              Dashboard
            </Link>
            <Link
              className="rounded-md bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(29,78,216,0.22)] transition hover:bg-blue-600"
              href="/admin/import/sample"
            >
              Download Sample CSV
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {params.imported ? (
          <section className="rounded-3xl border border-blue-500/30 bg-blue-950/40 p-6 font-bold text-blue-200">
            Imported {params.imported} contact{params.imported === "1" ? "" : "s"}.
          </section>
        ) : null}

        {params.error ? (
          <section className="rounded-3xl border border-red-500/30 bg-red-950/40 p-6 font-bold text-red-200">
            {params.error}
          </section>
        ) : null}

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <ContactImportForm />

          <aside className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <h2 className="text-2xl font-black">Required Columns</h2>
            <ul className="mt-4 space-y-2 text-sm font-bold text-gray-300">
              {requiredImportColumns.map((column) => (
                <li key={column}>{column}</li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-6 text-gray-400">
              Valid relationship types: {relationshipTypes.join(", ")}.
            </p>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Valid sport/program values: {sports.join(", ")}.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}
