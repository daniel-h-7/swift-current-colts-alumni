import Link from "next/link";

export function SiteAdminLink({
  href = "/studio/login",
  className = "inline-flex shrink-0 items-center text-sm font-black uppercase text-gray-300 transition hover:text-white",
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${className} focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white`}
    >
      ADMIN
    </Link>
  );
}
