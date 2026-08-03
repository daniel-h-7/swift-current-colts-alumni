import Link from "next/link";

type HqHeaderAction = {
  href: string;
  label: string;
  tone?: "primary" | "danger" | "neutral";
};

export function HqHeader({
  actions,
  eyebrow = "TeamAlum HQ",
  subtitle,
  title,
}: {
  actions: HqHeaderAction[];
  eyebrow?: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-700">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>

        <nav className="flex flex-wrap border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 shadow-sm">
          {actions.map((action) => (
            <Link
              className={`border-r border-slate-200 px-4 py-3 transition last:border-r-0 ${
                action.tone === "primary"
                  ? "bg-blue-700 text-white hover:bg-blue-600"
                  : action.tone === "danger"
                    ? "bg-red-600 text-white hover:bg-red-500"
                    : "hover:bg-white hover:text-slate-950"
              }`}
              href={action.href}
              key={`${action.href}-${action.label}`}
            >
              {action.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
