import type { ReactNode } from "react";
import Link from "next/link";
import { LegendsWorkspace } from "@/components/legends-workspace";
import { AdminNavigationProvider } from "@/components/admin-navigation";
import {
  getTeamAdminClientId,
  canManageTeamOperations,
} from "@/lib/team-admin";
import { getPlatformClient } from "@/lib/platform-data";
export const metadata = { title: "Team Dashboard | TeamAlum", robots: { index: false, follow: false } };
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const clientId = await getTeamAdminClientId();
  const client =
    clientId && (await canManageTeamOperations(clientId))
      ? await getPlatformClient(clientId)
      : null;
  const base = `/studio/${encodeURIComponent(clientId || "")}`;
  return (
    <AdminNavigationProvider clientId={clientId}>
      <LegendsWorkspace>
        {client ? (
          <nav
            aria-label="Team workspace"
            className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-[#e9e1d1] bg-[#faf7ef] px-6 py-4 text-sm font-bold text-[#17130d]"
          >
            <Link href={`${base}/hub`}>{client.name} · Team Hub</Link>
            <Link href={`${base}/admin`}>CRM &amp; Donors</Link>
            <Link href={`${base}/admin/campaigns`}>Campaign Mailer</Link>
            <Link href={`${base}/content`}>Edit Site</Link>
            <Link href={`${base}`}>Site Setup</Link>
            <Link href="/studio/logout">Log Out</Link>
          </nav>
        ) : null}
        {children}
      </LegendsWorkspace>
    </AdminNavigationProvider>
  );
}
