# Membership checkout safeguards — November 6, 2026

The Rams subscription investigation found that the production database lacked `contacts.stripe_account_id`. The existing `supabase/stripe-central-webhook-migration.sql` was applied to master (`dkzugzinrdbvgbvxmuew`), and the column was verified as text. This fixes the missing-column error without redeploying. Applying the schema does not retrospectively reconcile a Stripe charge.

Both standalone and tenant checkout routes now use the same contact preparation and checkout-link persistence helpers:

- Read the client-scoped contact and required Stripe columns before issuing a checkout URL. Missing payment columns stop checkout before Stripe session creation.
- Keep an existing Active Member's status and recorded dues while another checkout is started. A new/unpaid contact remains Pending Payment; only verified payment processing grants paid membership.
- Check and surface checkout-session persistence failures rather than returning a usable checkout URL after an ignored database error.
- Retain the existing contact, team identity, pricing, gift, Stripe metadata and webhook-authoritative completion flow. No new migration is required for this code change beyond the existing Stripe migration.

Validation: 105 tests, lint and the platform webpack production build passed. Tests exercise both public routes, tenant/email scoping, active-member preservation, missing-column failure before Stripe and failure to persist a created session. No payment, refund, cancellation or paid-status correction was performed by these tests.

The reported existing Rams contact had the new fee but remained Pending Payment and had no recorded gift. Stripe payment/event inspection and CRM reconciliation remain separate follow-up work; do not mark the charge reconciled or request another payment based only on the schema repair.

## Live recovery confirmed

Stripe inspection confirmed the reported CAD 6.00 payment succeeded directly on the Rams connected account: CAD 5.00 membership plus CAD 1.00 gift. The matching checkout metadata identifies the existing Rams contact. The actual webhook delivery blocker was HTTP 308 from the non-www endpoint, not payment routing. Updated the existing TeamAlum connected-account destination to `https://www.teamalum.com/api/stripe/webhook`, preserving its signing secret, API version, account source and five subscribed event types. Replayed the original checkout completion once; Stripe returned HTTP 200.

The live CRM record was then verified as Active Member, annual dues 500 cents, gift 100 cents, paid through 2027-11-06, with the correct Rams account and Stripe customer. No new payment, refund, subscription cancellation or fund transfer was performed. The source's earlier schema failure also required its existing additive migration, now applied.

The checkout completion handler now checks team-, contact-, account- and session-scoped completed activity before processing a later replay. This prevents scheduled retries of an already recorded checkout from adding its gift or running signup automation again. This uses existing activity records and adds no schema. The change protects already recorded completions; it is not an atomic ledger for simultaneous first deliveries. A read error stops processing instead of assuming the session is new. Tests cover successful completion followed by replay and history lookup failure. All 107 tests, lint and the production webpack build passed.

Deploy this code together with the checkout safeguards before the scheduled automatic replay. Stripe's manual resend does not cancel its automatic retry schedule: https://docs.stripe.com/webhooks#manual-retries . The destination URL repair and the recovered membership are already live; the replay guard requires application deployment.

## Transactional sender correction

Rams had a saved `crm_settings.email_from_address` of `onboarding@resend.dev`, overriding the configured production `RESEND_FROM_EMAIL`. Corrected that team's saved address to `accounts@teamalum.com` and sending domain to `teamalum.com`, preserving its sender name and reply-to. Membership management and signup automation share `getEmailSettingsForClient`, so this live settings correction applies to both without deployment.

The settings resolver now uses the configured sender when a saved address is blank/null or is a stale `@resend.dev` test address. Custom team sender domains remain unchanged; this does not infer that any domain is verified or invent a production sender when none is configured. This resolver safeguard requires deployment. All 110 tests, lint and the production webpack build passed.

The user explicitly authorized one management-link test to their specified membership email. The live public form returned success after submission with the corrected sender. This confirms acceptance of the request, not inbox placement. No failed welcome email was resent and no subscription was changed.
