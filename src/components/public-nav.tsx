import Link from "next/link";

export function PublicNav({ compact = false }: { compact?: boolean }) {
  return (
    <nav
      className={`relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 ${
        compact ? "py-5" : "py-6"
      }`}
    >
      <Link className="group flex items-center gap-3" href="/">
        <span className="flex h-11 w-11 items-center justify-center border border-red-500/45 bg-red-600 text-sm font-black text-white shadow-[0_12px_34px_rgba(220,38,38,0.24)]">
          SC
        </span>
        <span>
          <span className="block text-[11px] font-black uppercase tracking-[4px] text-red-400">
            Swift Current
          </span>
          <span className="mt-1 block text-lg font-black tracking-wide text-white transition group-hover:text-blue-300">
            Colts Football
          </span>
        </span>
      </Link>

      <div className="hidden items-center border border-white/10 bg-black/45 text-[11px] font-black uppercase tracking-[2px] text-gray-300 shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur md:flex">
        <Link className="border-r border-white/10 px-4 py-3 transition hover:bg-white/10 hover:text-white" href="/#sponsors">
          Sponsors
        </Link>
        <Link className="border-r border-white/10 px-4 py-3 transition hover:bg-white/10 hover:text-white" href="/#alumni">
          Alumni
        </Link>
        <Link className="border-r border-white/10 px-4 py-3 transition hover:bg-white/10 hover:text-white" href="/#events">
          Events
        </Link>
        <Link className="border-r border-white/10 px-4 py-3 transition hover:bg-blue-950/50 hover:text-white" href="/admin">
          Admin
        </Link>
        <Link className="bg-red-600 px-5 py-3 text-white transition hover:bg-red-500" href="/join">
          Support
        </Link>
      </div>
    </nav>
  );
}
