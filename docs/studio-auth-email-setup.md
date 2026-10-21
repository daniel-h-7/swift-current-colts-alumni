# Studio invitations and password resets

## Reported failure and diagnosis

Live inspection on October 21, 2026 confirmed the cause in **master**: Site URL was `http://localhost:3000` and the redirect allowlist was empty. Both application flows supply Studio callbacks, but Supabase fell back to its localhost Site URL when these callbacks were not allowed.

The Site URL has now been saved as `https://www.teamalum.com`, and both exact callbacks below were added successfully. The saved dashboard displayed both entries and the success message “Successfully added 2 URLs.” Request a fresh reset link after this change; previously sent links can retain the old destination. A real password change/login has not yet been verified.

Custom SMTP is currently **disabled** in master. The dashboard states that default email templates are used and custom SMTP is required to edit their subject/body. Sender and template changes therefore remain pending a verified sending provider and From address. SMTP was left disabled on the server; no incomplete provider configuration was saved.

Subsequent sender setup: the user selected **Resend** with **TeamAlum <accounts@teamalum.com>**. After explicit approval, three records were saved in Vercel DNS (the authoritative nameserver provider): TXT `resend._domainkey` with the Resend public DKIM key, TXT `send` with `v=spf1 include:amazonses.com ~all`, and MX `send` with priority 10 to `feedback-smtp.us-east-1.amazonses.com`. All three resolve publicly, and Resend now displays **Verified** for the domain and each record. Existing website and inbox records were not changed.

The user entered the Resend API key privately and saved SMTP. The dashboard confirmed SMTP enabled and a stored hidden password, with sender name `TeamAlum`, configured sender `accounts@teamalum.com`, host `smtp.resend.com`, port `465`, and username `resend`. No API key was read or stored in this repository.

Both hosted **Invite user** and **Reset password** templates were then saved from the HTML files below, using their listed TeamAlum subjects and retaining `{{ .ConfirmationURL }}`. Dashboard previews confirmed the branding, copy and buttons; the invitation save returned “Successfully updated email template.” The reset save returned to its saved state with the Reset template control available. Real email verification is a separate check; see the latest delivery status below.

The reported live HQ is `https://www.teamalum.com/hq`, using **daniel-h-7's PHM ALUMNI BUILD**. Inspection of live Studio public browser assets confirmed `https://dkzugzinrdbvgbvxmuew.supabase.co` (project reference `dkzugzinrdbvgbvxmuew`). The non-www address currently redirects to www. The local `.env.local` uses a different Supabase project; apply hosted Auth changes to this confirmed live project, not the local or old standalone client project.

## Live configuration

In the Supabase project used by live HQ, open **Authentication → URL Configuration**:

| Setting | Production value |
| --- | --- |
| Site URL | `https://www.teamalum.com` |
| Allowed redirect URL | `https://www.teamalum.com/studio/accept-invite` |
| Allowed redirect URL | `https://www.teamalum.com/studio/reset-password` |

Retain other intentionally used callbacks. Do not add broad production wildcards. Localhost URLs are for development only. In the platform Vercel deployment, set `TEAMALUM_STUDIO_URL=https://www.teamalum.com` and redeploy. Setting `NEXT_PUBLIC_SITE_URL` alone does not configure Supabase Auth. Ensure the public Supabase URL/key and server service-role key belong to the same live project.

The application now uses the configured Studio origin for both invitation and reset links and rejects loopback Studio origins in production. This safeguard does not change Supabase dashboard settings or fix emails already sent.

## TeamAlum sender and email design

In **Authentication → Email → SMTP Settings** (also labelled custom SMTP), configure a production email provider:

- Sender name: `TeamAlum`.
- Sender email: a verified address on `teamalum.com`, for example `accounts@teamalum.com` if configured with your provider.
- SMTP host, port, username and password: use the provider's SMTP settings. Store the credential only in Supabase SMTP settings.
- Verify the sending domain using the provider's required DNS records. Disable click tracking/link rewriting for authentication messages.

If using the same provider as campaigns, configure it independently here; Vercel's campaign `RESEND_API_KEY`, campaign sender settings and HQ client email fields do not configure Supabase Auth delivery. The verified domain/provider must permit this sender. Changing only the template cannot change the From address.

In **Authentication → Email → Templates**, paste these complete HTML files into the corresponding templates:

| Template | Subject | Repository file |
| --- | --- | --- |
| Invite user | `You're invited to TeamAlum Studio` | `supabase/email-templates/invite.html` |
| Reset password | `Reset your TeamAlum Studio password` | `supabase/email-templates/recovery.html` |

Both templates use white, black and gold, with `{{ .ConfirmationURL }}` as the button destination. Keep that variable intact. Do not substitute `{{ .SiteURL }}`, a localhost address or a custom token-hash callback: the application currently verifies Supabase's implicit invitation/recovery fragment. Supabase still securely verifies the one-time link; its verification hostname can remain visible in the link even when the sender and content are TeamAlum branded.

These HTML files are ready to paste; committing/deploying them does not automatically install hosted Supabase email templates. No new database migration is required.

## Recover an account affected by the old link

1. Save the live URL, templates and SMTP settings first, and deploy the canonical Studio URL setting/code.
2. Use `https://www.teamalum.com/studio/forgot-password` to request a **new** link for the email already added to HQ. Existing invitation links can contain the old destination or have been consumed.
3. Open the fresh message, verify the sender is TeamAlum, and confirm it returns to `https://www.teamalum.com/studio/reset-password` with the password form. Set a password and sign in normally. For an existing invited account, this avoids deleting/recreating its user or client links.
4. For a future new client invitation, confirm the email opens `/studio/accept-invite`, sets a password, and the resulting login reaches only the client's authorized site(s).
5. Verify expired/used links offer a new request. If a fresh message still uses localhost, inspect that email's destination and the active project's Auth logs/settings. Do not share token-bearing URLs, SMTP passwords or service-role keys.

Live email sending and password changes require an authorized test recipient; automated tests use mocks and do not send mail.

## References

- [Supabase redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
