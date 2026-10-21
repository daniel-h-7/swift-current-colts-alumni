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
  theme?: "default" | "paper";
}) {
  return (
    <header className="border-b border-[#dedfd7] bg-white text-[#171917]">
      <div className="mx-auto flex max-w-7xl flex-col gap-7 px-6 py-9 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 flex-1">
          <p className="border-l-2 border-[#c5a45b] pl-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#785d25]">
            {eyebrow}
          </p>
          <h1 className="mt-5 text-4xl font-black leading-none tracking-tight md:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#62675e]">
              {subtitle}
            </p>
          )}
        </div>
        <nav
          aria-label="Admin navigation"
          className="flex max-w-full shrink-0 gap-1 overflow-x-auto border-b border-[#dedfd7] text-xs font-bold md:max-w-[58%]"
        >
          {actions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={`shrink-0 whitespace-nowrap px-4 py-3 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#785d25] ${action.tone === "primary" ? "border-b-2 border-[#c5a45b] text-[#171917]" : action.tone === "danger" ? "text-[#a32a24]" : "text-[#62675e] hover:text-[#171917]"}`}
            >
              {action.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
