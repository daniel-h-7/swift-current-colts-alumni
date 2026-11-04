# Connect your organization's Stripe account

Use your organization's owner login in Studio. Choose the correct organization, then open **Payments**. HQ access and editor/viewer access do not authorize creating or connecting a Stripe account.

1. If an account is already listed, use **Check connection**. Use **Open Stripe Dashboard** to manage the account directly. Use **Continue setup** only when Stripe still needs onboarding details.
2. If no account is listed, choose **Connect an existing Stripe account** or **Create a new Stripe account**. When using an existing login, select the correct organization/business account on Stripe. The same email may have access to several accounts.
3. Complete Stripe's secure screens as the organization's authorized representative. Enter identity and bank information only on Stripe. TeamAlum does not need your bank details or your own Stripe secret key.
4. Return to the same Studio organization. Expired onboarding links can be restarted from Payments; retrying continues the same setup attempt instead of creating another account.
5. Confirm payments, payouts, and submitted details are ready. TeamAlum only labels an account Connected when all three are enabled. Check the listed mode and last-checked time. A production membership site requires a live connection.
6. Review homepage content, branding, features, public hosting, and the preview using the setup checklist. Request HQ review when ready. Sites with memberships disabled do not require Stripe for launch review.

An existing mapping cannot be silently replaced with a different account. Contact HQ to plan any migration involving active memberships. Rebuilding site content does not require replacing Stripe.

## Common issues

- **Authorization is not configured:** HQ must configure the Stripe Connect client ID and exact callback URL. Do not create a duplicate account as a workaround.
- **Asked to sign in again:** Studio sessions belong to their hostname. Use the canonical Studio address and the same browser throughout setup. Login preserves the intended organization; multi-organization users have a site chooser.
- **Complete on Stripe, pending on TeamAlum:** choose Check connection. Check Stripe's outstanding requirements and payout state; never create another account merely to clear the label.
- **Expired setup link:** return to Payments and choose Continue setup. The links expire and should not be bookmarked or forwarded.
- **Unresolved old account-creation attempt:** contact HQ for reconciliation. Setup deliberately stops rather than risk creating a duplicate account.
- **Member paid but membership is unchanged:** confirm the payment in the organization's Stripe Dashboard and contact HQ to inspect notifications. Do not charge the member again to repair their membership record.

The same guidance is available at `/studio/help/stripe`. Operators should complete `docs/setup-reliability-rollout.md` before rollout. This guide describes the implemented workflow, not verified live configuration or tax/legal advice.


## One-time TeamAlum configuration

Set the live `STRIPE_CONNECT_CLIENT_ID` on the production platform and register `https://www.teamalum.com/studio/payments/oauth/callback` in the matching Stripe Connect OAuth application. This is one shared callback for every team, not a record to add for every new client. Each team owner still signs in to Stripe and authorizes their own account through Studio. The callback selects the team from unexpired browser-bound server state and rechecks the signed-in owner before consuming authorization once. Legacy per-team callback URLs remain supported. No database migration is required for this callback change; the existing setup-reliability OAuth-state table is still required.

The production client ID was saved in Vercel on November 4, 2026. A deployment and registration of the shared callback in Stripe are required before this flow is live. The earlier RMR callback may remain registered. No team was connected and no payment or payout was initiated by this configuration change.

### November 4 verification

The owner confirmed both the original RMR-specific URI and the shared URI were added in Stripe. Vercel deployment `DcuyGVgJdmpxXqwYu8TJPMEq5QUT` reached Ready/Production with the saved client ID, redeploying existing source `67bf6ce`; it does not contain the subsequent shared-callback code yet. The new shared callback passed all 90 tests, lint and a platform-mode webpack production build, and is ready for the normal code commit/deployment. Owner authorization and live payments/payouts remain unverified until the team completes Connect and checks its status. No team account was authorized by the agent.
