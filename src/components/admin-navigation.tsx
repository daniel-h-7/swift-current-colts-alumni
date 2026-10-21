"use client";
import Link from "next/link";
import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
} from "react";
import { teamAdminPath } from "@/lib/team-admin-routing";
export const AdminClientContext = createContext<string | null>(null);
export function AdminNavigationProvider({
  clientId,
  children,
}: {
  clientId: string | null;
  children: ReactNode;
}) {
  return (
    <AdminClientContext.Provider value={clientId}>
      {children}
    </AdminClientContext.Provider>
  );
}
export function useAdminPath() {
  const clientId = useContext(AdminClientContext);
  return (path: string) => teamAdminPath(path, clientId);
}
export function AdminLink(props: ComponentProps<typeof Link>) {
  const path = useAdminPath();
  return (
    <Link
      {...props}
      href={typeof props.href === "string" ? path(props.href) : props.href}
    />
  );
}
export function AdminForm(props: ComponentProps<"form">) {
  const path = useAdminPath();
  return (
    <form
      {...props}
      action={
        typeof props.action === "string" ? path(props.action) : props.action
      }
    />
  );
}
