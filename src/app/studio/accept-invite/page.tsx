import { StudioHeader } from "@/components/studio-header";
import { PasswordRecoveryForm } from "@/components/studio/password-recovery-form";
export const metadata={title:"Set your Studio password | TeamAlum",robots:{index:false,follow:false},referrer:"no-referrer" as const};
export default function AcceptInvitePage(){return <main className="min-h-screen bg-[#f5f1e8] text-[#17130d]"><StudioHeader title="Welcome to Studio" subtitle="Choose a password for your new account." actions={[{href:"/studio/login",label:"Log in"}]}/><section className="mx-auto max-w-xl px-6 py-12"><PasswordRecoveryForm mode="invite"/></section></main>;}
