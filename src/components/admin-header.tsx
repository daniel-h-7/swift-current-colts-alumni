import Link from "next/link";

type AdminHeaderAction = {
  href: string;
  label: string;
  tone?: "primary" | "danger" | "neutral";
};

export function AdminHeader({
  actions,
  eyebrow,
  subtitle,
  title,
}: {
  actions: AdminHeaderAction[];
  eyebrow: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <header className="relative overflow-hidden border-b border-white/10 bg-zinc-950">
      <div className="absolute inset-0 premium-grid opacity-20" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="program-kicker">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-gray-400">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap border border-white/10 bg-black/30 text-sm font-bold text-gray-200 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          {actions.map((action) => (
            <Link
              className={`border-r border-white/10 px-4 py-3 transition last:border-r-0 ${
                action.tone === "primary"
                  ? "bg-blue-700 text-white hover:bg-blue-600"
                  : action.tone === "danger"
                    ? "bg-red-600 text-white hover:bg-red-500"
                    : "hover:bg-white/10 hover:text-white"
              }`}
              href={action.href}
              key={`${action.href}-${action.label}`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
