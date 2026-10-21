import { NextResponse } from "next/server";
import { resolveClientSlug } from "@/lib/client-slugs";
import { getPlatformClientByStudioSlug } from "@/lib/platform-data";
import { validateClientSubdomain } from "@/lib/client-address";
export const dynamic="force-dynamic";
export async function GET(request: Request) {
  const host=new URL(request.url).hostname;
  const root=process.env.TEAMALUM_ROOT_DOMAIN??"teamalum.com";
  if(!host.endsWith(`.${root}`))return NextResponse.json({error:"Client hostname required"},{status:404});
  const slug=host.slice(0,-root.length-1);
  if(validateClientSubdomain(slug))return NextResponse.json({error:"Invalid client hostname"},{status:404});
  const client=await getPlatformClientByStudioSlug(resolveClientSlug(slug));
  if(!client)return NextResponse.json({error:"Unknown client"},{status:404});
  return NextResponse.json({clientId:client.id,hostname:host},{headers:{"Cache-Control":"no-store"}});
}
