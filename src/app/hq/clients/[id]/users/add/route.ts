import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isHqAuthenticated } from "@/lib/hq-auth";
import { getPlatformClient } from "@/lib/platform-data";
import { createServerSupabaseClient,getServerEnvValue } from "@/lib/supabase/server";
import { studioOrigin } from "@/lib/studio-navigation";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  if(!(await isHqAuthenticated()))return NextResponse.redirect(new URL("/hq/login",request.url),303);
  if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Submit account changes from HQ."},{status:403});
  const {id}=await params;const path=`/hq/clients/${encodeURIComponent(id)}`;
  try{
    if(!getServerEnvValue("SUPABASE_SERVICE_ROLE_KEY"))throw new Error("HQ account management needs the server-side Supabase service-role key.");
    if(!(await getPlatformClient(id)))throw new Error("Organization not found.");
    const form=await request.formData();const email=String(form.get("email")??"").trim().toLowerCase();const role=String(form.get("role")??"owner");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw new Error("Enter a valid account email.");
    if(!["owner","admin","editor","viewer"].includes(role))throw new Error("Choose a valid account role.");
    const supabase=createServerSupabaseClient();
    const find=async()=>{
      const {data,error}=await supabase.rpc("teamalum_find_auth_user_by_email",{p_email:email});
      if(error)throw new Error("Apply the setup reliability migration before adding Studio accounts.");
      return data as {id:string;email:string}|null;
    };
    let user=await find();let invited=false;
    if(!user){
      const {data,error}=await supabase.auth.admin.inviteUserByEmail(email,{redirectTo:`${studioOrigin(request.url)}/studio/accept-invite`});
      if(error){user=await find();if(!user)throw new Error("Unable to send the invitation. Check Supabase Auth email delivery and try again.");}
      else if(data.user){user={id:data.user.id,email:data.user.email??email};invited=true;}
    }
    if(!user)throw new Error("Unable to link this account.");
    const {error}=await supabase.from("client_users").insert({client_id:id,auth_user_id:user.id,email:user.email,full_name:String(form.get("full_name")??"").trim()||null,role});
    if(error)throw new Error(error.code==="23505"?"This user is already linked. Use Edit email on their account below.":"The login exists, but its client link could not be saved. Retry adding the same email; do not create another login.");
    revalidatePath("/hq");revalidatePath(path);
    return NextResponse.redirect(new URL(`${path}?account_added=${invited?"invited":"linked"}#account-access`,request.url),303);
  }catch(error){return NextResponse.redirect(new URL(`${path}?account_error=${encodeURIComponent(error instanceof Error?error.message:"Unable to add account.")}#account-access`,request.url),303);}
}
