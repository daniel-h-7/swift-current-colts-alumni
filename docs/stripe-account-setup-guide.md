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
