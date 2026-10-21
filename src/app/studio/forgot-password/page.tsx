import { studioOrigin } from "@/lib/studio-navigation";
import { StudioHeader } from "@/components/studio-header";
import { PasswordRecoveryForm } from "@/components/studio/password-recovery-form";

export const metadata = { title: "Reset your password | TeamAlum", robots: { index: false, follow: false }, referrer: "no-referrer" as const };

export default function PasswordPage() {
  const resetRedirectTo = process.env.TEAMALUM_STUDIO_URL
    ? `${studioOrigin(process.env.TEAMALUM_STUDIO_URL)}/studio/reset-password`
    : undefined;
  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#17130d]">
      <StudioHeader title="Reset your password" subtitle="Your next chapter starts here." actions={[{ href: "/studio/login", label: "Log In" }]} />
      <section className="mx-auto max-w-xl px-6 py-12"><PasswordRecoveryForm mode="request" resetRedirectTo={resetRedirectTo} /></section>
    </main>
  );
}
