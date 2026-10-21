import { AuthNavigationLink as Link } from "@/components/auth-navigation-link";

type StudioHeaderAction = {
  href: string;
  label: string;
  tone?: "primary" | "neutral";
};

export function StudioHeader({
  actions,
  subtitle,
  title,
  theme = "gold",
}: {
  actions: StudioHeaderAction[];
  subtitle?: string;
  title: string;
  theme?: "default" | "gold";
}) {
  return (
    <header className={`border-b border-slate-200 bg-white ${theme === "gold" ? "studio-gold-header" : ""}`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-7 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#785d25]">
            TeamAlum Studio
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

        <nav className="flex max-w-full shrink-0 flex-nowrap overflow-x-auto rounded-full md:max-w-[58%] border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 shadow-sm">
          {actions.map((action) => (
            <Link
              className={`shrink-0 whitespace-nowrap border-r border-slate-200 px-4 py-3 transition last:border-r-0 ${
                action.tone === "primary"
                  ? "bg-[#17130d] text-[#f8f1df] hover:bg-[#362b19]"
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
