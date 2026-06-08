import Link from "next/link";
import { EmailEditor } from "@/components/email-editor";

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

export function BlastEditorForm({
  action,
  backHref,
  blastId,
  campaignId,
  defaultAudience = "",
  defaultHtml,
  defaultPreheader = "",
  defaultSubject = "",
  defaultTitle = "",
  heading,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  backHref: string;
  blastId?: string;
  campaignId: string;
  defaultAudience?: string;
  defaultHtml: string;
  defaultPreheader?: string;
  defaultSubject?: string;
  defaultTitle?: string;
  heading: string;
  submitLabel: string;
}) {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link className="font-bold text-blue-300" href={backHref}>
          Back to campaign
        </Link>

        <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
          <p className="text-sm uppercase tracking-[5px] text-red-500">
            Campaign Blast
          </p>
          <h1 className="mt-3 text-4xl font-black">{heading}</h1>

          <form action={action} className="mt-8 space-y-5">
            <input name="campaign_id" type="hidden" value={campaignId} />
            {blastId ? <input name="blast_id" type="hidden" value={blastId} /> : null}

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-bold text-gray-200">
                Blast title
                <input
                  className={fieldClass}
                  defaultValue={defaultTitle}
                  name="title"
                  placeholder="Launch email"
                  required
                />
              </label>

              <label className="block text-sm font-bold text-gray-200">
                Audience
                <select
                  className={fieldClass}
                  defaultValue={defaultAudience}
                  name="audience_filter"
                >
                  <option className="bg-zinc-950" value="">
                    All CRM contacts
                  </option>
                  <option className="bg-zinc-950" value="email_opt_in">
                    Email opt-ins
                  </option>
                  <option className="bg-zinc-950" value="active_members">
                    Active members
                  </option>
                  <option className="bg-zinc-950" value="pending_payment">
                    Pending payment
                  </option>
                </select>
              </label>
            </div>

            <label className="block text-sm font-bold text-gray-200">
              Email subject
              <input
                className={fieldClass}
                defaultValue={defaultSubject}
                name="subject"
                placeholder="Colts Football update"
                required
              />
            </label>

            <label className="block text-sm font-bold text-gray-200">
              Preheader
              <input
                className={fieldClass}
                defaultValue={defaultPreheader}
                name="preheader"
                placeholder="Short preview text for inboxes"
              />
            </label>

            <div>
              <p className="text-sm font-bold text-gray-200">Email body</p>
              <p className="mt-1 text-sm text-gray-500">
                Keep the preview within the 600px email frame.
              </p>
              <div className="mt-3">
                <EmailEditor defaultValue={defaultHtml} name="html_content" />
              </div>
            </div>

            <button
              className="w-full rounded-full bg-blue-700 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-blue-600"
              type="submit"
            >
              {submitLabel}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
