import Link from "next/link";
import type { ComponentProps } from "react";
import { isLogoutHref } from "@/lib/auth-navigation";
export function AuthNavigationLink(props: ComponentProps<typeof Link>) {
  if (typeof props.href === "string" && isLogoutHref(props.href)) {
    return (
      <a
        href={props.href}
        className={props.className}
        title={props.title}
        id={props.id}
        aria-label={props["aria-label"]}
      >
        {props.children}
      </a>
    );
  }
  return <Link {...props} />;
}
