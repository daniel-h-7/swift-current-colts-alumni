# Bringing RMR Football and SC Colts into TeamAlum HQ

## What the repository establishes

- Both clients already have canonical IDs: `rmrfootball` and `colts`.
- A standalone deployment selects its tenant with `TEAMALUM_CLIENT_ID`, falling back to its site variant. A separate Vercel project can still share HQ's database.
- HQ reads the `clients` table in its configured Supabase project. Owner access comes from `client_users`; saved site content and membership settings come from `crm_settings` keyed by `client_id`.
- Shared public pages use `/site/[clientId]`; Studio edits clients by ID. TeamAlum subdomains rewrite the home, join, and success pages. `rmramsfootball` is an alias for `rmrfootball`.
- Existing CRM/admin routes still use deployment-level tenant context. Consolidating all deployments requires a separate audit of admin, membership management, automations, email, and webhook routing; moving a domain alone does not make those routes tenant-aware.
- Custom domains are stored in the schema, but the current middleware only resolves TeamAlum subdomains. Arbitrary custom-domain routing requires implementation before a full hosting consolidation.

## Assess before changing live sites

For HQ, RMR, and Colts, record the Vercel project, public URL, Supabase project URL/reference, effective client ID, and deployed revision. Do not copy secret keys into this document. Determine whether all three deployments share the same database.

For each organization, inventory and back up:
- Client record, settings and site content, sections, enabled features, owner access.
- Contacts, membership and Stripe identifiers, campaign/blast history, activity and automation records.
- Existing image/storage assets and their URLs.
- Stripe platform relationship, connected account ID, test/live mode, webhook endpoints, email sender/domain configuration.

The local code does not establish the deployed database, domain ownership, live Stripe status, or bank/payout configuration.

## If the database is already shared

1. Reuse existing canonical client IDs. Check whether HQ is connected to that same database and has appropriate server credentials.
2. Confirm both rows exist and owner accounts map to the correct client through `client_users`.
3. Ensure the exact live site content is saved for each tenant. Standalone sites may render organization-specific defaults from environment-selected branding; shared rendering must not fall back to the platform's defaults.
4. Record each organization's Stripe account in its own `client_integrations` row. Do not rely on a shared `STRIPE_CONNECTED_ACCOUNT_ID` fallback for multiple clients.
5. Compare public and Studio previews and test owner permissions, membership settings, and payment routing before any domain change.

## If databases differ

1. Back up each source and destination and choose the canonical shared destination.
2. Map legacy rows to the intended client ID explicitly. The old multi-tenant migration assigns existing untagged data to `colts`; that assumption must not be applied blindly to an RMR database.
3. Import relational data preserving IDs and references; reconcile conflicts and compare row counts and totals. Do not overwrite live destination records with seed data.
4. Migrate auth users through a supported Supabase process or invite owners and rebuild their `client_users` links. Merely copying a mapping does not migrate an auth identity.
5. Preserve asset availability and existing Stripe customer/subscription/account relationships. An app/database move does not itself migrate Stripe objects between accounts/platforms.
6. Coordinate writes during cutover and verify no new signups or webhook events are lost or duplicated.

## Recommended rollout

First centralize HQ/Studio management while retaining the existing public deployments and payment endpoints. Verify changes made through Studio appear on each public site. Then decide whether hosting consolidation is useful. If desired, complete tenant-aware routing and test the shared deployment before assigning existing domains to it. Keep the old deployments available for rollback and coordinate cron/webhook ownership to avoid duplicate processing.

Do not rerun `supabase/rmrfootball-shared-client-setup.sql` as an import: it overwrites membership values, feature switches, integration statuses, and domain metadata. No database or domain changes have been applied by this assessment.

## Live assessment: October 20, 2026

User-confirmed hostnames: `rmrfootball.teamalum.com` and `sccoltsfootball.teamalum.com`.

Observed through the browser:
- RMR's public hostname renders Rams branding, the “CLIMB HIGHER. RAMS TOGETHER.” headline, and Eagle Homes / Exact Tax / Cranbrook Flooring sponsors, with Studio ADMIN access.
- SC Colts' public hostname renders a pending-launch page with the fallback name “Colts Football.” The protected canonical `/site/colts` route on that host redirects to Demo Access, so its underlying record could not be verified there without authentication.
- HQ's platform route `/site/colts` renders pending launch with “Swift Current Colts Football,” indicating that it resolves a client name but is not publicly approved in that environment.
- HQ's platform route `/site/rmrfootball` renders Colts default branding and sponsor/event content, unlike RMR's live hostname. This is evidence of a content/configuration mismatch; it does not establish whether the deployed Supabase projects differ or saved site content is missing.
- HQ redirects to its login screen, so live client records, owner mappings, and Stripe connection details have not been inspected.

Local preparation:
- Added a shared legacy slug resolver with `sccoltsfootball -> colts`, preserving `rmramsfootball -> rmrfootball`, for middleware and platform client lookup. No duplicate tenant is created and no launch approval is granted.
- Added `supabase/legacy-client-audit.sql`, a read-only report of relevant client IDs, domains, launch status, content presence/title, owner counts, membership settings, and Stripe mapping presence. It does not expose account IDs or secrets. Run against the relevant authenticated database projects before planning an import.
- Public route content was inspected only. No form submissions, deployment, account changes, data imports, or DNS changes were made.
