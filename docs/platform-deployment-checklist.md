# TeamAlum Platform Deployment Checklist

Use this when creating the new Vercel project for `teamalum.com`.

## Start Here

Create the platform project first. This is the foundation for HQ, Studio, signup, billing, and future site publishing.

Recommended project:

- Vercel project name: `teamalum-platform`
- Git repo: this repo
- App mode: `TEAMALUM_APP_MODE=platform`
- Production domains: `teamalum.com`, `www.teamalum.com`

## Vercel Environment Variables

Set these in the new Vercel project:

- `TEAMALUM_APP_MODE=platform`
- `NEXT_PUBLIC_SITE_URL=https://teamalum.com`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TEAMALUM_HQ_PASSWORD`
- `TEAMALUM_HQ_SESSION_SECRET`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `UNSUBSCRIBE_SECRET`
- `CRON_SECRET`
- `RESEND_API_KEY`

Leave these blank on the platform project unless you intentionally want the platform root to behave like a client site:

- `TEAMALUM_CLIENT_ID`
- `NEXT_PUBLIC_SITE_VARIANT`

## Namecheap DNS

Add `teamalum.com` and `www.teamalum.com` in the Vercel project's Domains settings first. Vercel will show the exact DNS records to add.

Typical setup at Namecheap:

- Root domain `teamalum.com`: `A` record pointing to Vercel's recommended IP.
- `www.teamalum.com`: `CNAME` record pointing to Vercel's recommended CNAME target.

After DNS is saved, return to Vercel and wait for verification and SSL.

## Current Routes

- `/`: TeamAlum platform homepage when `TEAMALUM_APP_MODE=platform`.
- `/hq`: internal TeamAlum client-management console.
- `/studio`: client-facing builder shell.
- `/admin`: existing single-client CRM admin, still useful for current client deployments.
- `/join`: existing client membership join page.

## Next Build Order

1. Create the new Vercel project and verify `teamalum.com`.
2. Run `supabase/platform-expansion.sql` on the shared Supabase project.
3. Add real Supabase Auth for Studio users.
4. Connect Studio users to organizations through `client_users`.
5. Use `client_features` so HQ can enable/disable site modules.
6. Move site content editing from `/admin/settings/site-content` into `/studio`.
7. Add Supabase Storage for logos, sponsor graphics, and photos.
8. Add Stripe Connect onboarding for client-owned payment accounts.
9. Add hostname-based tenant resolution for published client sites.
