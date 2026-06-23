import Link from "next/link";
import { logContactActivity } from "@/lib/contact-activity";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

type UnsubscribeSearchParams = {
  contact?: string;
  token?: string;
};

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<UnsubscribeSearchParams>;
}) {
  const params = await searchParams;
  const contactId = params.contact ?? "";
  const token = params.token ?? "";
  const isValid = verifyUnsubscribeToken(contactId, token);
  let title = "Unable to unsubscribe";
  let message =
    "This unsubscribe link is invalid or expired. Please contact the club to update your email preferences.";

  if (isValid) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("contacts")
      .update({ email_opt_in: false })
      .eq("id", contactId)
      .select("id, email, first_name, last_name")
      .maybeSingle();

    if (error || !data) {
      message =
        error?.message ??
        "We could not find this contact record. Please contact the club to update your email preferences.";
    } else {
      title = "You are unsubscribed";
      message =
        "Your email opt-in has been turned off. You will no longer receive Colts Football blast emails.";

      await logContactActivity({
        body: "Email opt-in was turned off from an unsubscribe link.",
        contactId: data.id,
        metadata: {
          email: data.email,
          source: "unsubscribe_link",
        },
        title: "Email unsubscribed",
        type: "email_unsubscribed",
      }).catch(() => undefined);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 py-12 text-white">
      <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-zinc-950 p-8 shadow-2xl">
        <p className="text-sm font-black uppercase tracking-[5px] text-red-500">
          Email Preferences
        </p>
        <h1 className="mt-3 text-4xl font-black">{title}</h1>
        <p className="mt-4 text-lg leading-8 text-gray-300">{message}</p>
        <Link
          className="mt-8 inline-flex rounded-md bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-600"
          href="/"
        >
          Return Home
        </Link>
      </section>
    </main>
  );
}
