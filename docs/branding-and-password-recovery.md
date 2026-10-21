# Branding and Studio password recovery

## Changes

- Studio and HQ share the homepage black/gold palette, including login, editing tools, uploads, status messages, and navigation. Organization-specific saved colors remain editable.
- Campaign list/detail/composer screens and the rich text editor use white backgrounds, warm gold accents, pill controls, and softer panels. Existing saved email body content is preserved.
- Outgoing emails use a white/gold frame and the configured sender in the footer, replacing the hardcoded Colts identity. Unsubscribe links remain intact.
- HQ's main client table displays the earliest assigned owner's email from the existing `client_users` records, or “Not assigned.” No schema migration.
- Studio login links to `/studio/forgot-password`; recovery links return to `/studio/reset-password`. A verified Supabase recovery session is required to update a password. Recovery credentials are held in memory rather than persisted, and removed from the address bar. After saving, the user logs in normally with the new password.

## Supabase configuration before using recovery

1. Configure the canonical Studio origin and exact Supabase callbacks as described in [Studio auth email setup](studio-auth-email-setup.md). Live HQ uses `https://www.teamalum.com`; allow `/studio/reset-password` and `/studio/accept-invite` on that origin. With `TEAMALUM_STUDIO_URL` set, client-domain Studio requests redirect to the canonical host. Add other callback origins only if intentionally serving Studio there. Keep localhost callbacks limited to development.
2. Keep the Reset Password email template's link pointed at `{{ .ConfirmationURL }}`. The implemented flow uses Supabase's default implicit recovery redirect; a custom `token_hash`/PKCE callback template requires a different handler.
3. Configure production email delivery in Supabase Auth (custom SMTP as appropriate). Supabase's default mail service has recipient and rate limitations. The campaign mail provider configuration does not configure Supabase Auth mail.
4. Deploy with the existing `NEXT_PUBLIC_SUPABASE_URL` and public anon/publishable key. Never use a service-role key in browser configuration.
5. Test a real account: request reset, open the email link, choose matching passwords, then log in using the new password. Expired links should offer a new request. No live reset emails or credential changes were performed during development.

This flow resets Studio user passwords only. It does not change the beta gate or shared HQ/admin environment passwords, and does not revoke existing custom Studio session cookies.

## Checks

Run `node --test tests/*.test.cjs` for recovery-fragment validation, password matching, email metadata escaping, and sender/unsubscribe preservation. Run TypeScript, lint on changed files, and `npm run build -- --webpack` before deployment.
