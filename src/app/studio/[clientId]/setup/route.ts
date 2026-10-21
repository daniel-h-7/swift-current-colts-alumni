import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { canAccessStudioClient, isHqStudioAccess, getStudioClientOwner } from "@/lib/studio-auth";
import { getPlatformClient } from "@/lib/platform-data";
import { getSiteContentForClient } from "@/lib/site-content";
import { updateSetupState } from "@/lib/setup-state";
import { clientHostname } from "@/lib/client-address";

export async function POST(request: Request,{params}:{params:Promise<{clientId:string}>}) {
  const {clientId}=await params;
  const path=`/studio/${encodeURIComponent(clientId)}`;
  if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Submit from Studio."},{status:403});
  if(!(await canAccessStudioClient(clientId)))return NextResponse.json({error:"Access denied"},{status:403});
  try{
    const form=await request.formData();
    const intent=String(form.get("intent")??"");
    const client=await getPlatformClient(clientId);if(!client)throw new Error("Organization not found.");
    const now=new Date().toISOString();
    if(intent==="verify_domain"){
      if(!(await isHqStudioAccess())&&!(await getStudioClientOwner(clientId)))throw new Error("The owner or HQ must verify hosting.");
      const hostname=clientHostname(client,process.env.TEAMALUM_ROOT_DOMAIN??"teamalum.com");
      const response=await fetch(`https://${hostname}/.well-known/teamalum-site`,{redirect:"error",cache:"no-store",signal:AbortSignal.timeout(6000)});
      const identity=await response.json() as {clientId?:string;hostname?:string};
      if(!response.ok||identity.clientId!==clientId||identity.hostname!==hostname)throw new Error("This public address is not serving this organization yet. Attach the hostname to the correct Vercel deployment and try again.");
      await updateSetupState(clientId,{domain_verified_at:now,domain_verified_hostname:hostname});
    }else if(intent==="review"){
      const content=await getSiteContentForClient(clientId);
      const patch:Record<string,unknown>={};
      if(form.get("content")==="on"){
        if(!content.brand.siteTitle||!content.brand.heroTitle||!content.brand.heroBody)throw new Error("Fill in the homepage copy first.");
        patch.content_reviewed_at=now;
      }
      if(form.get("visual")==="on"){
        if(!content.brand.logoUrl&&!content.brand.heroImageUrl)throw new Error("Add your logo or hero image first.");
        patch.visual_reviewed_at=now;
      }
      if(form.get("features")==="on")patch.features_reviewed_at=now;
      if(form.get("preview")==="on")patch.preview_reviewed_at=now;
      if(!Object.keys(patch).length)throw new Error("Select the items you have reviewed.");
      await updateSetupState(clientId,patch);
    }else throw new Error("Unknown setup action.");
    revalidatePath(path);revalidatePath(`/hq/clients/${clientId}`);
    return NextResponse.redirect(new URL(`${path}?saved=setup`,request.url),303);
  }catch(error){return NextResponse.redirect(new URL(`${path}?error=${encodeURIComponent(error instanceof Error?error.message:"Setup check failed.")}`,request.url),303);}
}
