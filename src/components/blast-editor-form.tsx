import Link from "next/link";
import { ReactNode } from "react";
import { EmailEditor } from "@/components/email-editor";
import {
  contactStatuses,
  membershipStatuses,
  relationshipTypes,
  sports,
} from "@/lib/contact-options";
import { parseAudienceFilter } from "@/lib/campaign-options";

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

export function BlastEditorForm({
  action,
  backHref,
  blastId,
  campaignId,
  children,
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
  children?: ReactNode;
  defaultAudience?: string;
  defaultHtml: string;
  defaultPreheader?: string;
  defaultSubject?: string;
  defaultTitle?: string;
  heading: string;
  submitLabel: string;
}) {
  const audience = parseAudienceFilter(defaultAudience);

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
            </div>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-xl font-black">Send Categories</h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Build the audience from CRM fields. Sending will use these same
                rules when the email provider is connected.
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-3">
                <label className="block text-sm font-bold text-gray-200">
                  Graduation year
                  <input
                    className={fieldClass}
                    defaultValue={audience.graduation_year ?? ""}
                    inputMode="numeric"
                    name="audience_graduation_year"
                    placeholder="All"
                    type="number"
                  />
                </label>

                <label className="block text-sm font-bold text-gray-200">
                  Relationship
                  <select
                    className={fieldClass}
                    defaultValue={audience.relationship_type ?? ""}
                    name="audience_relationship_type"
                  >
                    <option className="bg-zinc-950" value="">
                      All
                    </option>
                    {relationshipTypes.map((type) => (
                      <option className="bg-zinc-950" key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-bold text-gray-200">
                  Sport / program
                  <select
                    className={fieldClass}
                    defaultValue={audience.sport ?? ""}
                    name="audience_sport"
                  >
                    <option className="bg-zinc-950" value="">
                      All
                    </option>
                    {sports.map((sport) => (
                      <option className="bg-zinc-950" key={sport} value={sport}>
                        {sport}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-bold text-gray-200">
                  CRM status
                  <select
                    className={fieldClass}
                    defaultValue={audience.status ?? ""}
                    name="audience_status"
                  >
                    <option className="bg-zinc-950" value="">
                      All
                    </option>
                    {contactStatuses.map((status) => (
                      <option className="bg-zinc-950" key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-bold text-gray-200">
                  Membership
                  <select
                    className={fieldClass}
                    defaultValue={audience.membership_status ?? ""}
                    name="audience_membership_status"
                  >
                    <option className="bg-zinc-950" value="">
                      All
                    </option>
                    {membershipStatuses.map((status) => (
                      <option className="bg-zinc-950" key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-bold text-gray-200">
                  Paid through
                  <select
                    className={fieldClass}
                    defaultValue={audience.paid_status ?? ""}
                    name="audience_paid_status"
                  >
                    <option className="bg-zinc-950" value="">
                      All
                    </option>
                    <option className="bg-zinc-950" value="current">
                      Current
                    </option>
                    <option className="bg-zinc-950" value="expired">
                      Expired
                    </option>
                    <option className="bg-zinc-950" value="missing">
                      Missing
                    </option>
                  </select>
                </label>

                <label className="block text-sm font-bold text-gray-200">
                  Email opt-in
                  <select
                    className={fieldClass}
                    defaultValue={
                      audience.email_opt_in === undefined
                        ? ""
                        : String(audience.email_opt_in)
                    }
                    name="audience_email_opt_in"
                  >
                    <option className="bg-zinc-950" value="">
                      All
                    </option>
                    <option className="bg-zinc-950" value="true">
                      Yes
                    </option>
                    <option className="bg-zinc-950" value="false">
                      No
                    </option>
                  </select>
                </label>

                <label className="block text-sm font-bold text-gray-200">
                  SMS opt-in
                  <select
                    className={fieldClass}
                    defaultValue={
                      audience.sms_opt_in === undefined
                        ? ""
                        : String(audience.sms_opt_in)
                    }
                    name="audience_sms_opt_in"
                  >
                    <option className="bg-zinc-950" value="">
                      All
                    </option>
                    <option className="bg-zinc-950" value="true">
                      Yes
                    </option>
                    <option className="bg-zinc-950" value="false">
                      No
                    </option>
                  </select>
                </label>

                <label className="block text-sm font-bold text-gray-200">
                  Tag contains
                  <input
                    className={fieldClass}
                    defaultValue={audience.tag ?? ""}
                    name="audience_tag"
                    placeholder="Volunteer"
                  />
                </label>
              </div>
            </section>

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

        {children ? <div className="mt-6 space-y-6">{children}</div> : null}
      </div>
    </main>
  );
}
