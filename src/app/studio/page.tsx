import { AuthNavigationLink as Link } from "@/components/auth-navigation-link";
import { redirect } from "next/navigation";
import { StudioHeader } from "@/components/studio-header";
import { getStudioClientIdsForUser, getStudioSession } from "@/lib/studio-auth";
import { getPlatformClient } from "@/lib/platform-data";
export const dynamic = "force-dynamic";
export default async function StudioPage() {
  const session = await getStudioSession();
  if (!session) redirect("/studio/login");
  const ids = await getStudioClientIdsForUser(session.authUserId);
  if (!ids.length) redirect("/studio/login?error=No%20organization%20is%20linked%20to%20this%20login.%20Contact%20HQ.");
  if (ids.length===1) redirect(`/studio/${encodeURIComponent(ids[0])}/hub`);
  const clients = await Promise.all(ids.map(getPlatformClient));
  return <main className="min-h-screen bg-[#f5f1e8] text-[#17130d]"><StudioHeader title="Choose your organization" subtitle="Open the site you want to manage." actions={[{href:"/studio/logout",label:"Log out"}]}/><section className="mx-auto grid max-w-5xl gap-5 px-6 py-12 md:grid-cols-2">{clients.filter(Boolean).map(client=><Link key={client!.id} className="rounded-3xl border border-[#dfcc9a] bg-white p-7 font-bold hover:bg-[#faf7ef]" href={`/studio/${encodeURIComponent(client!.id)}/hub`}><span className="text-xl">{client!.name}</span><span className="mt-3 block text-sm text-[#785d25]">Open Team Hub →</span></Link>)}</section></main>;
}
