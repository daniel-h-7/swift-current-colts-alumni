# Connect your organization’s Stripe account to TeamAlum

Prepared October 20, 2026. This guide describes the current TeamAlum implementation. A shorter version is available inside Studio at `/studio/help/stripe` and is linked from Payments after deployment.

## Choose the right path first

**If the organization has no Stripe account:** its authorized representative can create a client-owned Standard account through Studio → Payments → Connect Stripe.

**If it already uses Stripe:** ask TeamAlum to verify the existing account and platform connection first. Today’s Connect Stripe action creates a new Standard account whenever no account ID is saved for the client. There is no separate “connect my existing account” authorization flow in the application. A matching email does not prove it is the same Stripe business account. Do not replace the account used for active memberships just to clear a pending status.

**For RMR Football and SC Colts:** reusing the existing client record and rebuilding site content does not require a new Stripe account. Preserve the existing account, customers, and subscriptions, and verify the mapping before changing anything.

Stripe describes Standard accounts as client-controlled accounts with their own Dashboard. TeamAlum uses direct charges so payments are created in the connected account; TeamAlum can also collect an application fee if configured. [Standard accounts](https://docs.stripe.com/connect/standard-accounts), [direct charges](https://docs.stripe.com/connect/direct-charges).

## Before you begin

Have the organization’s authorized representative available, along with its legal/business details, representative information, and payout bank details. Stripe may request supporting documents; requirements vary. Confirm the organization name and annual membership amount in Studio.

Use the organization’s Studio login. HQ and Studio are separate sessions. Open the same TeamAlum hostname for the entire process. Enter sensitive banking and identity information only on Stripe’s secure pages. You do not need to email TeamAlum your bank details or your organization’s Stripe secret API key.

## Step by step: a new account

1. **Log in to Studio.** Use the organization owner’s email and password. If you arrive at a different organization, stop and navigate to the correct client before connecting payments. The current login defaults to the first site linked to your account.
2. **Open Payments.** Confirm the organization name and annual membership amount. If an account is already listed, verify that connection before starting anything new.
3. **Choose Connect Stripe.** For an unlinked client, TeamAlum creates a Standard connected account and opens Stripe-hosted onboarding. Complete the organization, representative, verification, and bank sections that Stripe requests.
4. **Finish and return to TeamAlum.** Let Stripe return you to the Payments page. Closing the window before returning can leave the saved status out of date. Returning is a status check; it does not guarantee every verification requirement has been satisfied.
5. **Check Stripe itself.** Sign in to the organization’s [Stripe Dashboard](https://dashboard.stripe.com/). Confirm the expected organization/account, resolve outstanding requirements, check payment availability, and confirm payouts and bank setup. TeamAlum’s current Connected label checks charges and submitted details, but does not check that payouts are enabled.
6. **Have TeamAlum verify launch readiness.** The platform administrator should confirm the organization’s saved account mapping, production configuration, payment notifications, and membership updates. Test payments belong in a separate test environment. Submit the site for HQ review once the content and payment checks are complete.

Stripe onboarding links expire and are single-use. Resume from Studio rather than forwarding or bookmarking a setup link. [Account Link documentation](https://docs.stripe.com/api/account_links/create).

## Troubleshooting

| What you see | What to do |
| --- | --- |
| “Onboarding must be started by the client owner” | Use the organization’s Studio login. An HQ-only session cannot start the flow. |
| You return to a different TeamAlum domain and must log in again | Ask TeamAlum to correct the configured callback origin. Start and finish on the same hostname. |
| Pending after completing Stripe | Check Stripe for requirements. Ask TeamAlum to retrieve the account’s current status; do not create another account. |
| Connected, but no payout | Check payout availability and bank details in Stripe. The current TeamAlum label is not a complete payout-readiness check. |
| You only wanted to review an existing connection | Open Stripe Dashboard. The current Review Stripe Setup button reopens onboarding and changes the stored status to pending. |
| A member paid but is not active in TeamAlum | Verify the payment in the organization’s own Stripe Dashboard, then ask TeamAlum to inspect webhook delivery and account/client mapping. Do not charge the member again merely to update the CRM. |
| “Not connected” for an organization with active memberships | Have TeamAlum reconcile its existing connection and Stripe platform access before creating or replacing an account. |

## Platform administrator checklist

### One-time platform configuration

- Configure the TeamAlum platform’s own `STRIPE_SECRET_KEY` server-side on the intended Vercel project. Keep test and live environments separate. Do not substitute a client’s secret key on a shared platform deployment.
- Activate/configure Stripe Connect for the platform and set the onboarding branding in Stripe’s Connect settings. The existing code uses Standard account creation and hosted onboarding; this guide does not recommend changing account models as part of ordinary client setup.
- Set `NEXT_PUBLIC_SITE_URL` to the canonical origin used for the owner’s Studio session. The code uses it for both the Stripe return URL and expired-link refresh URL. HTTPS is required for live onboarding.
- Configure a webhook destination for **Connected accounts** events at the intended deployment’s `/api/stripe/webhook`. For example, use `https://www.teamalum.com/api/stripe/webhook` if that is the canonical production deployment. Do not assume an endpoint for “Your account” receives direct-charge activity from clients.
- Save that endpoint’s own signing secret as `STRIPE_WEBHOOK_SECRET` on the receiving deployment. Redeploy after changing deployment environment variables.
- The current handler processes `checkout.session.completed`, `invoice.paid`, `invoice.payment_succeeded`, `customer.subscription.updated`, and `customer.subscription.deleted`. It does **not** currently refresh connection status from `account.updated` or handle disconnection events; those are improvements identified in the setup audit.
- Avoid sending the same production payment events to multiple old/new deployments sharing the same database without coordinating processing ownership.
- Leave `STRIPE_APPLICATION_FEE_PERCENT` unset if TeamAlum should collect no percentage of memberships. This is separate from the TeamAlum subscription business arrangement.

Stripe documents the distinction between platform and connected-account events and the separate signing secrets/endpoints used for their delivery. [Connect webhooks](https://docs.stripe.com/connect/webhooks).

### Per-client setup

1. Confirm the existing client record and owner login in HQ. Reuse them for organizations already operating on TeamAlum.
2. Determine whether this is a new Stripe account, an account already connected to TeamAlum, or an account controlled through another Stripe platform. An `acct_…` ID alone does not authorize TeamAlum to use an account; TeamAlum’s platform must have access. Verify the existing relationship before editing HQ’s connection fields. Stripe documents [OAuth authorization for Standard accounts](https://docs.stripe.com/connect/oauth-reference); that flow is not currently implemented in TeamAlum, and account/platform eligibility must be checked before adding it.
3. For a genuinely new account, have the organization owner follow the Studio steps above. Do not complete their banking/identity questions yourself.
4. Confirm `client_integrations` has the correct `stripe_connect` account ID for this exact client. Match it against Stripe’s connected account and the intended live/test environment. Do not manually label it connected just because an ID was pasted.
5. Read the current Stripe account status. The existing authorized return endpoint `/studio/<client-id>/payments/return` retrieves the saved account and updates TeamAlum’s status without starting new-account creation. Use it on the same hostname as the session. It still uses the incomplete payout-readiness rule described above.
6. Do not rely on `STRIPE_CONNECTED_ACCOUNT_ID` as a shared fallback for clients. The current code can use that environment account when a client-specific connection is absent or not marked connected. Verify/remove shared fallback configuration as part of a reviewed fix before opening a new client’s checkout; do not repoint it to another organization as a workaround.
7. Verify separate test checkout creates the charge on the intended connected account and updates the intended membership. Confirm annual recurrence, the configured CAD membership amount, and any one-time gift. Do not run test subscriptions against live client contacts or a live production database.
8. Check production webhook delivery, owner access to Stripe Dashboard, and live account payment/payout availability before approving launch. A browser success page alone does not demonstrate that the payment notification was processed or that bank payouts work.

## Scope of this guide

This review did not inspect live Stripe balances, identity documents, bank details, Vercel secrets, or production webhook deliveries. No Stripe account was created, linked, modified, charged, or paid out. Known implementation gaps are listed in [the setup audit](setup-process-audit.md); they require separate code changes rather than instructions alone.
