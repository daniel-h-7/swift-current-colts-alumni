# Team hub and connected operations

## Client experience

Public **ADMIN** remains a regular menu item. It enters `/studio/<client-id>/hub` at the canonical Studio host (production defaults to `https://www.teamalum.com`). Signed-out users log in with their existing Studio email/password; signed-in users enter the hub directly. Normal Studio login opens a single organization's hub, or an organization picker when several sites are assigned.

The hub has three main tools:

- **Edit Site** → the existing Studio content editor.
- **CRM & Donors** → the existing contacts dashboard with membership status, recorded dues/gifts, contact history, filters and CSV tools.
- **Campaign Mailer** → the existing campaigns, blast editor, audiences, previews, test sends and sending controls.

The CRM and mailer have team navigation linking back to the hub, site editing and setup. **Site Setup** retains feature settings, Stripe setup and launch review.

## Scope and access

`/studio/<client-id>/admin/...` uses small route adapters to the existing `/admin/...` implementations. Proxy removes any browser-supplied tenant header and sets the scope from the actual namespaced URL. These are real routes rather than an internal rewrite, so a second proxy pass cannot discard or replace the request scope.

The existing Studio cookie is already limited to `/studio` and is host-only. It is not widened to the root path or shared across subdomains. Owners and admins assigned to the selected client can use CRM and mailer operations; editor/viewer accounts see those tools as restricted. HQ's existing access is retained. Every namespaced operation rechecks membership; a shared legacy admin cookie cannot bypass this check. Non-GET team requests require the same origin.

Contacts, imports/exports, campaigns, blast events, audiences, settings, welcome automation and unsubscribe signatures use the explicit authorized client ID. Namespaced links, forms, redirects and revalidation retain that client. There is no mutable active-team cookie, so different teams can remain open in separate tabs.

The standalone `/admin` shared-password flow remains available for existing dedicated deployments, using their existing deployment client ID. Logging out of the team workspace explicitly expires its `/studio` cookie and clears any HQ session on the same host, so privileged HQ access cannot remain behind an apparent team logout.

## Deployment

- Deploy the platform application with all new route adapters and shared components. Set `TEAMALUM_STUDIO_URL=https://www.teamalum.com` (or the actual canonical Studio origin) and retain the existing Studio signing secret and Supabase keys.
- Deploy client sites that still use separate Vercel projects to update their ADMIN link. The new production link enters the central hub even if the client site is hosted separately.
- No SQL migration or new account/password is required. Keep each account linked to its correct client in HQ; CRM/mailer users require owner or admin role.
- The central hub reads that client's data in the platform Supabase database. This change does not copy contacts, campaigns or donations from an older standalone Supabase project. Confirm the live CRM's expected records after deployment; any missing legacy data needs a separate migration, not reassignment of another team's records.
- Existing campaign sender settings and campaign Resend configuration remain separate from Supabase Auth's SMTP configuration.

## Validation

Automated tests cover header spoofing, same-origin writes, per-team owner/admin checks, revoked/restricted access, standalone compatibility, scoped forms/links, actual settings writes, campaign audiences, client-bound unsubscribe tokens, hub choices and canonical ADMIN entry links. Local browser checks verified the desktop/mobile layout and unauthenticated CRM redirect back to Studio with the correct team hub destination. The local-only layout fixture was removed before the production build.

After deployment, verify with an assigned account: ADMIN → hub → CRM/contact edit → campaign audience/composer → Edit Site → hub → logout. Compare contact counts and recorded amounts with expected HQ data. Do not send a campaign or change a real supporter's record merely as a smoke test.

## Session persistence and tool return addresses

The reported live loop was reproduced after login: the hub rendered, but visiting a tool (or reloading the hub) returned to login. The hub's Log Out navigation used Next.js Link, which may fetch its target in the background in production. The logout GET handler cleared authentication unconditionally, including during those background requests. Development mode does not automatically prefetch, so a development-only browser check did not catch this.

All Studio/HQ/admin logout links now use ordinary document navigation. Their handlers ignore RSC and prefetch requests without reading or clearing session cookies and return a non-cacheable 204. Explicit logout still expires the intended sessions. CRM and mailer login redirects now preserve the exact requested tool path and filters, rather than always returning to the hub; Proxy strips incoming client/path headers before setting its own values.

The three hub choices now use lightweight gold outline SVG icons for the website, contact list and email. No new image or icon dependency was added.

A local production build was exercised with a synthetic session: it survived hub loading and a full reload, and an explicit Log Out click cleared it. Automated regression tests exercise background logout requests across all three auth areas and the selected-tool return path. The temporary synthetic-session routes were removed before the final production build. Against that final build, twelve real HTTP prefetch/RSC requests across Studio, HQ, legacy admin and team admin logout routes returned 204 without Set-Cookie; a CRM request preserved its exact campaign path and filters through the login redirect. The fix still requires deployment to verify the real client's authenticated CRM/editor/mailer screens end to end.
