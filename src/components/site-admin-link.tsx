import Link from "next/link";

export function SiteAdminLink({ href = "/studio/login" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex shrink-0 items-center rounded-full border border-white/35 bg-black/40 px-4 py-3 text-xs font-bold text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
      Site Admin
    </Link>
  );
}
