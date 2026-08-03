# TeamAlum Product Streams

TeamAlum should evolve as two connected workspaces backed by the same multi-tenant Supabase database.

## 1. TeamAlum HQ

Internal workspace for TeamAlum operators.

- Manage client records, domains, status, plans, and support notes.
- Control which features each client can use.
- Seed or reset template content for a client.
- View client health across contacts, campaigns, payments, and publishing.
- Support client onboarding when automated setup needs help.

Current entry point: `/hq`

## 2. TeamAlum Studio

Client-facing workspace for organizations.

- Create an account and organization.
- Build a site from the TeamAlum template.
- Edit homepage title, header copy, section text, sponsors, events, spotlights, and campaign blocks.
- Upload logos, photos, and sponsor assets.
- Connect Stripe through Stripe Connect.
- Choose enabled site features within the plan allowed by HQ.
- Publish to a TeamAlum subdomain or custom domain.

Current entry point: `/studio`

## Suggested Schema Direction

- `clients`: organization identity, public site variant, domain, lifecycle status, plan.
- `client_users`: user membership and role for each client.
- `client_features`: feature flags per client, managed by HQ.
- `crm_settings`: operational settings for membership, email sender, join page, and other defaults.
- `site_content`: structured editable content per client and section.
- `media_assets`: uploaded logos, photos, sponsor images, and generated assets.
- `client_integrations`: Stripe Connect account status, email provider status, and domain verification state.

## Build Order

1. Keep `/hq` focused on internal client administration.
2. Add `/studio` as the client builder shell using the current tenant data.
3. Run `supabase/platform-expansion.sql` on the shared Supabase database.
4. Add Supabase Auth and `client_users`.
5. Move site content editing from `/admin/settings/site-content` into Studio.
6. Add HQ-managed feature flags.
7. Add media uploads through Supabase Storage.
8. Add Stripe Connect onboarding.
9. Add publish/domain workflows.
