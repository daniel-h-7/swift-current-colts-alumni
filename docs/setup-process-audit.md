# TeamAlum setup audit

Original audit: October 20, 2026. All twelve findings below now have local implementation fixes. Production deployment and configuration remain pending; see `docs/setup-reliability-rollout.md`. The original findings are retained as historical evidence, not a description of the updated code.

## Implementation status

| Finding | Implemented fix |
| --- | --- |
| 1 | Checkout requires a verified per-client account and fresh Stripe readiness; shared fallback removed. |
| 2 | Dashboard, check connection, and continue setup are separate; opening onboarding preserves established state. |
| 3 | Explicit owner role required server-side, independent of simultaneous HQ sessions. |
| 4 | Payments/payouts/details verified separately; current account state and deauthorization webhooks processed. |
| 5 | Existing-account OAuth and new-account paths; durable idempotent attempts and recovery guard. |
| 6 | Canonical Studio origin, validated return paths, same-host callbacks, multi-client chooser. |
| 7 | Shared feature-aware checklist from explicit reviews, verified hosting, and payment readiness. |
| 8 | Explicit empty content arrays persist without returning sample entries. |
| 9 | Transactional, retry-safe database provisioning including owner linkage. |
| 10 | HQ preserves custom domains/unrelated settings; Stripe state cannot be typed into a form. |
| 11 | Shared reserved-name and hostname validation across provisioning, HQ, and routing. |
| 12 | Server launch gate, recorded override reason, and stale-review protection. |

Additional fixes: HQ offers Add account/invitation for clients without users, plus existing Edit email; Studio and HQ menus remain a single horizontally scrollable row. Tenant routing now uses the supported `src/proxy.ts` location.

## Historical findings

## Findings, in recommended order

### 1. P1 — A client without a verified Stripe mapping can use a shared payment account

**Trigger:** a client integration is missing, pending, or invalid while `STRIPE_CONNECTED_ACCOUNT_ID` is configured. `getStripeConnectedAccountId` returns the shared environment value instead of refusing checkout. This can route one organization’s new membership payments into another organization’s connected account.

**Evidence:** `src/lib/stripe.ts:89–113`.

**Recommended change:** require an explicit verified client account for shared-platform checkout. If a legacy single-client fallback is retained, restrict it to that configured tenant and deployment mode. Test client A, unconnected client B, pending client B, and a mismatched mapping. This risk is conditional on the deployment fallback being set; its live value was not inspected.

### 2. P1 — Reviewing a working Stripe connection can interrupt new checkouts

**Trigger:** choose Review Stripe Setup on an already connected client. The connect handler unconditionally writes `status: pending` before requesting an Account Link. Abandoning Stripe, failing to create the link, or returning without a valid Studio session leaves the client pending. Checkout then refuses the client mapping or falls back to issue 1.

**Evidence:** `src/app/studio/[clientId]/payments/page.tsx:141–154`; `src/app/studio/[clientId]/payments/connect/route.ts:62–98`.

**Recommended change:** separate “Open Stripe Dashboard,” “Check connection,” and “Continue setup.” Preserve an established status until Stripe reports otherwise; do not erase metadata just to launch onboarding. Include cancel/failure/retry tests.

### 3. P1 — The “owner” payment action is available to any assigned Studio role

**Trigger:** a user with an editor/viewer client membership calls the connect endpoint. It requires a Studio session and `canAccessStudioClient`, whose membership query does not check the role. The interface/error says owner-only, but the server does not enforce that policy. A simultaneous HQ session also short-circuits the client-membership check while account creation still uses the Studio session email.

**Evidence:** `src/app/studio/[clientId]/payments/connect/route.ts:35–48,68–72`; `src/lib/studio-auth.ts:209–235`.

**Recommended change:** verify the initiating Studio user's explicit owner role for the route client, with a deliberately specified policy for admins. Do not infer the owner from whichever Studio session happens to coexist with HQ. Test viewer/editor denial and mixed sessions.

### 4. P1 — Payment readiness can be overstated and later become stale

**Trigger:** Stripe has `charges_enabled` and `details_submitted` true but payouts disabled. The app labels it connected. Later Stripe requirements or deauthorization are not reflected unless another manual return/status check happens: the webhook handler has no account-update/disconnection handling.

**Evidence:** `src/lib/stripe-connect.ts:128–137`; `src/app/studio/[clientId]/payments/return/route.ts` stores payout metadata; `src/app/api/stripe/webhook/route.ts:389–434` only handles checkout/invoice/subscription events.

**Recommended change:** show separate “Payments enabled,” “Payouts enabled,” and verification state, with last-checked time. Refresh safely on demand and process verified account-status/disconnection events. Do not conflate charge readiness with bank-payout readiness. [Stripe account-status guidance](https://docs.stripe.com/connect/standard-accounts).

### 5. P2 — Existing-account and new-account paths are not distinguished

**Trigger:** an organization already uses Stripe but has no saved TeamAlum mapping. Connect Stripe creates a new Standard account. There is no explicit existing-account authorization path or confirmation that active subscriptions belong to the chosen account. The same email can be used for multiple Stripe accounts.

**Evidence:** `src/app/studio/[clientId]/payments/connect/route.ts:62–80`; `src/lib/stripe-connect.ts:80–101`.

**Recommended change:** ask “New account or existing account?” first. Explain/verify existing platform access and preserve active customer/subscription relationships. Design an authorized existing-account flow supported by this platform, rather than treating a pasted account ID as authorization. Add Stripe-request idempotency and recover an account created just before a database write fails, to avoid duplicate accounts on retry.

### 6. P2 — Callbacks and login redirects lose the organization/context

**Trigger:** the owner starts on a client subdomain while `NEXT_PUBLIC_SITE_URL` points to a different hostname. Stripe returns to that configured host, where the host-only Studio cookie may not exist. Login then redirects to the first client attached to the user; neither login nor `/studio` offers a site selector or preserves the intended return path.

**Evidence:** `src/app/studio/[clientId]/payments/connect/route.ts:17–24,93–98`; `src/lib/studio-auth.ts` sets a host-only cookie; `src/app/studio/login/submit/route.ts:25–37`; `src/app/studio/page.tsx`.

**Recommended change:** choose a canonical Studio origin and route entry points consistently, preserve only validated local return paths, and offer a client chooser when an account has several clients. Check the www/apex redirect as well as client subdomains.

### 7. P2 — Setup progress and readiness are not reliable measures of client work

**Trigger:** a fresh site inherits template copy and a default stadium image, so homepage and visual checks appear complete immediately. `completedSetup` is hardcoded to 3 plus Stripe/review flags, while six setup steps are displayed; it can reach only five. Stripe is required in the checklist even if memberships are disabled. URL readiness only checks a slug or ID, not whether the domain actually serves that site.

**Evidence:** `src/components/studio/studio-dashboard.tsx:20–27,61–113`; `src/lib/client-create.ts:87–97` seeds starter content.

**Recommended change:** derive one checklist from saved, client-reviewed state; make steps feature-dependent and expose the next incomplete action. Distinguish “preview exists” from “reviewed.” Show URL assignment separately from live domain verification.

### 8. P2 — Deleting all content in a section brings sample entries back

**Trigger:** remove every sponsor, event, spotlight, campaign, or impact stat and save an empty array. Normalization substitutes default content whenever the normalized array is empty. Clients cannot clearly distinguish an intentional empty section from missing/uninitialized data.

**Evidence:** `src/lib/site-content.ts`, `normalizeSiteContent`, returns defaults for empty lists.

**Recommended change:** use defaults only for absent/uninitialized fields; preserve explicitly saved empty arrays. Test remove-all → save → reload, including public preview. Do not reintroduce sample sponsors or fundraising campaigns after deliberate deletion.

### 9. P2 — A failed setup can leave an account or site half-created

**Trigger:** Auth creation succeeds but one of the subsequent client/settings/features/integration/owner-link writes fails. These operations are separate, with no transaction or completed-setup marker. If the client exists but the owner link failed, retrying sees the URL as taken and cannot recover ownership through the existing-user branch.

**Evidence:** `src/app/studio/create-site/route.ts`, sequential user/client/owner creation; `src/lib/client-create.ts:59–138`.

**Recommended change:** make database provisioning transactional/idempotent and add explicit recovery for incomplete setup. Preserve a request/provisioning ID and clean up only resources known to have been created by that attempt. Avoid telling users to try a different organization or account as a workaround.

### 10. P2 — Saving HQ settings can erase unrelated configuration or make Stripe look verified

**Trigger:** save a client after a custom domain was previously stored: `custom_domain` is always written as null. Integration statuses and IDs can be saved manually without fetching Stripe, so Connected can mean “selected by an HQ user” rather than “verified with Stripe.”

**Evidence:** `src/app/hq/clients/[id]/save/route.ts:124–130,208–220`.

**Recommended change:** preserve fields that are not part of an edit. Separate manual connection mapping from verified status, add a check-connection action, and show who/what last verified it. Stripe authorization and payout state should never be inferred from a typed `acct_…` value.

### 11. P2 — Reserved/inaccessible site addresses are accepted during creation

**Trigger:** choose a subdomain such as `www`, `app`, or `teamalum`. Creation normalizes the string but does not reject middleware's reserved names, and it does not check the public domain before marking the URL assigned.

**Evidence:** `src/lib/client-create.ts`, `normalizeClientId`; `src/app/studio/create-site/route.ts` validation; `middleware.ts`, `reservedSubdomains`.

**Recommended change:** share a reserved-name policy and slug length/format checks between creation, HQ editing, and routing. Explain which URL is assigned and whether hosting is verified.

### 12. P2 — Launch approval has no server-enforced readiness gate

**Trigger:** an HQ user approves a client that has no verified payment setup or unfinished content. The approval endpoint writes timestamps without consulting the checklist. That may be useful as an administrative override, but the UI does not distinguish an intentional override from a normal ready-to-launch decision.

**Evidence:** `src/app/hq/clients/[id]/approve-launch/route.ts:25–34`; the approve intent in `src/app/hq/clients/[id]/save/route.ts`.

**Recommended change:** present the same feature-aware checklist to HQ, distinguish blockers from warnings, and require an explicit recorded reason for any override. Keep non-membership sites launchable without Stripe.

## Recommended simpler setup sequence

1. Pick an existing organization or create a new one; assign the owner.
2. Confirm branding and content, with placeholder sections clearly marked.
3. Choose features. Only request Stripe setup if payments are enabled.
4. Choose new versus existing Stripe account, finish owner onboarding, and verify payments/payouts separately.
5. Verify the public address and preview the complete join/confirmation experience.
6. Submit for HQ review; review the same checklist and launch.

Keep one visible next action per stage. “Pending,” “not configured,” and “not verified” should explain what the user needs to do next rather than just display a raw status string.

## Validation and limits

The regression suite exercises the SQL migration/functions against PGlite, interrupted/duplicate provisioning and Stripe setup, role isolation, OAuth replay and account replacement, webhook status refresh/disconnection, empty sections, HQ account linking, and launch approval. Synthetic tests send no live Stripe requests or invitations. All 47 tests passed. TypeScript, lint, and the webpack production build passed. Browser checks confirmed Add account opens its fields and the long menu remains one row at desktop and 390-pixel widths. The build retains the existing metadataBase warning.

No production database migration, environment configuration, deployment, real invitation, or live Stripe mutation was performed. Local tests do not establish live account or hosting readiness. Apply the rollout guide and check existing mappings before enabling payments.

## Delivered

- Updated in-product guide: `/studio/help/stripe`.
- Client instructions: `docs/stripe-account-setup-guide.md`.
- Operator rollout and recovery: `docs/setup-reliability-rollout.md`.
- Implementation, additive SQL migration, and regression tests for all twelve findings.

## Main files changed

| Area | Files |
| --- | --- |
| HQ account access | `src/components/hq-add-client-user.tsx`, `src/app/hq/clients/[id]/users/add/route.ts`, `src/app/hq/clients/[id]/page.tsx`, invitation page/form/parser |
| Compact menus | `src/components/studio-header.tsx`, `src/components/hq-header.tsx` |
| Stripe ownership, retries, authorization | `src/lib/stripe-connect.ts`, `stripe-connection.ts`, `stripe-onboarding.ts`, `stripe-oauth.ts`, `stripe.ts`, Studio payment routes and webhook route |
| Setup and launch | `src/lib/launch-readiness.ts`, `launch-review.ts`, `setup-state.ts`, Studio setup/dashboard/review routes, HQ approval/save routes |
| Provisioning and address policy | `src/lib/client-create.ts`, `client-address.ts`, Studio/HQ creation routes |
| Routing and login | `src/proxy.ts` (replaces root middleware), `src/lib/studio-navigation.ts`, Studio login/chooser and client ADMIN links |
| Data and content | `src/lib/platform-data.ts`, `site-content.ts`, feature/content save routes, `supabase/setup-reliability.sql` |
| Guide and regression coverage | Stripe guide page/data, these docs, `tests/*setup*.test.cjs`, `stripe-state.test.cjs`, `hq-settings.test.cjs`, routing tests, test helper and development dependency |
