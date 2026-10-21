import type { ReactNode } from "react";
import { ClientUtilityFrame } from "@/components/site/client-utility-frame";
export default function Layout({children}: {children: ReactNode}) {
  return <ClientUtilityFrame>{children}</ClientUtilityFrame>;
}
