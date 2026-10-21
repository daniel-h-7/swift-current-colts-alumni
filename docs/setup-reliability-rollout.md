# Setup reliability rollout

Implemented locally October 20, 2026. Deployment, production SQL, Stripe configuration, and real invitations have not been performed by this change.

## Apply before deploying

1. Back up the target Supabase database and confirm its project matches this deployment. Apply `supabase/setup-reliability.sql` after the existing schema/platform expansion migrations. It adds setup state, transactional provisioning, Stripe attempt/OAuth state storage, and service-only functions; it does not reset client data. Rehearse on staging first.
2. Confirm the server has `SUPABASE_SERVICE_ROLE_KEY`. Account lookup, account invitations, atomic provisioning, launch approval, and Stripe linking use service-only operations. Never expose this key in public variables.
3. Set `TEAMALUM_STUDIO_URL` to the exact HTTPS origin that serves Studio without a hostname redirect (for example `https://teamalum.com`, if that is the actual canonical host). Existing cookies on other hosts do not transfer: users sign in once on the chosen host. This setting is optional; when absent, callbacks use the request origin. `TEAMALUM_ROOT_DOMAIN` defaults to `teamalum.com` and must match the deployed tenant domain.
4. Verify the Stripe platform secret key and webhook signing secret belong to the intended mode. Configure `STRIPE_CONNECT_CLIENT_ID` for existing-account OAuth. Register each exact callback URL used by clients: `<Studio origin>/studio/<client-id>/payments/oauth/callback`. Match the live/test Connect configuration. Existing-account authorization reports a clear error if the client ID is missing; it never silently creates a replacement account.
5. Configure the connected-account webhook destination at `/api/stripe/webhook` to send `account.updated` and `account.application.deauthorized`, in addition to the existing checkout, subscription, and invoice events. Keep the expected live/test mode consistent. The endpoint verifies signatures and rejects mismatched account snapshots.
6. Before enabling checkout after rollout, use **Check connection** on each existing client's Payments page. Legacy mappings need fresh client/account/mode verification metadata and payments, payouts, and submitted details must all be ready. The shared `STRIPE_CONNECTED_ACCOUNT_ID` fallback has been removed. An unverified client cannot take a payment through another organization's account.
7. In Supabase Auth, allow the canonical Studio `/studio/accept-invite` redirect. Invitation email templates should use Supabase's `ConfirmationURL` so the Auth verification redirects to that route with the invite session. Preserve the existing password-reset redirect allowlist and template. Check SMTP delivery with an authorized test recipient before onboarding real clients. No invitations were sent during implementation.
8. Attach tenant hostnames to the correct Vercel deployment. **Verify hosting** checks the public `/.well-known/teamalum-site` response against the expected client and hostname; a configured slug alone does not complete this step. Confirm the generated tenant URL, client preview, join, and success pages before launch approval.

## Recovery and safeguards

- New Stripe account requests store frozen parameters and a stable attempt ID before contacting Stripe. Retrying resumes the account already saved or uses the same idempotency key. An unresolved request older than 23 hours stops for operator reconciliation rather than risking another account after Stripe's idempotency retention window. Inspect the durable `stripe_setup_attempts` row and corresponding Stripe request logs; reconcile the original account before retrying. Do not delete attempt rows to force a new account.
- Existing Stripe accounts cannot be silently replaced or linked to a second client. Account migrations, mode changes, and active subscription transfers need a separate reviewed plan.
- OAuth state is browser-, owner-, organization-, origin-, and mode-bound, expires after ten minutes, and is consumed once. If setup expires, restart from the same organization's Payments page.
- An Auth user may remain after failed database provisioning, but all site rows roll back together. Retry with the same login and site address; existing owned sites are returned without resetting their data.
- HQ can approve incomplete setup only with an explicit reason. The stored approval records the blockers and actor. A stale review must reload before approval.
- Editing content/features or the site address invalidates the affected review/hosting checks. Confirm the new saved state before requesting launch review.

## Local verification

The regression suite includes actual PostgreSQL-compatible migration/function tests via PGlite, synthetic Stripe/OAuth/webhook tests, account invitation/linking mocks, routing, content normalization, and launch gating. These checks do not establish production Stripe readiness. See `docs/setup-process-audit.md` for the twelve fixes and `docs/stripe-account-setup-guide.md` for the client workflow.
