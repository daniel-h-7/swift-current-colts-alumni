# Membership checkout safeguards — November 6, 2026

The Rams subscription investigation found that the production database lacked `contacts.stripe_account_id`. The existing `supabase/stripe-central-webhook-migration.sql` was applied to master (`dkzugzinrdbvgbvxmuew`), and the column was verified as text. This fixes the missing-column error without redeploying. Applying the schema does not retrospectively reconcile a Stripe charge.

Both standalone and tenant checkout routes now use the same contact preparation and checkout-link persistence helpers:

- Read the client-scoped contact and required Stripe columns before issuing a checkout URL. Missing payment columns stop checkout before Stripe session creation.
- Keep an existing Active Member's status and recorded dues while another checkout is started. A new/unpaid contact remains Pending Payment; only verified payment processing grants paid membership.
- Check and surface checkout-session persistence failures rather than returning a usable checkout URL after an ignored database error.
- Retain the existing contact, team identity, pricing, gift, Stripe metadata and webhook-authoritative completion flow. No new migration is required for this code change beyond the existing Stripe migration.

Validation: 105 tests, lint and the platform webpack production build passed. Tests exercise both public routes, tenant/email scoping, active-member preservation, missing-column failure before Stripe and failure to persist a created session. No payment, refund, cancellation or paid-status correction was performed by these tests.

The reported existing Rams contact had the new fee but remained Pending Payment and had no recorded gift. Stripe payment/event inspection and CRM reconciliation remain separate follow-up work; do not mark the charge reconciled or request another payment based only on the schema repair.
