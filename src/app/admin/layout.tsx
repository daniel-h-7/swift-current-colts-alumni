import type { ReactNode } from "react";
import { LegendsWorkspace } from "@/components/legends-workspace";
export default function AdminLayout({children}: {children: ReactNode}) {
  return <LegendsWorkspace>{children}</LegendsWorkspace>;
}
