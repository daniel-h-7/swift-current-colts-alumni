import type { ReactNode } from "react";
import { LegendsWorkspace } from "@/components/legends-workspace";
import { getCurrentClientId } from "@/lib/client-context";
import { getSiteContentForClient } from "@/lib/site-content";
import { legendsColors } from "@/lib/legends";
export async function ClientUtilityFrame({
  children,
}: {
  children: ReactNode;
}) {
  const { brand } = await getSiteContentForClient(getCurrentClientId());
  return (
    <LegendsWorkspace
      colors={legendsColors(brand.primaryColor, brand.accentColor)}
    >
      {children}
    </LegendsWorkspace>
  );
}
