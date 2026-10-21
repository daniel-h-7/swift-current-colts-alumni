export const stripeSetupSteps = [
  {
    title: "Log in as the organization’s account owner",
    body: "Open Studio using the owner’s email and password. Open the correct organization and choose Payments. An HQ-only login cannot start Stripe onboarding.",
  },
  {
    title: "Check whether a connection already exists",
    body: "If an account is already listed, verify it belongs to your organization before continuing. If you already use Stripe but no account is listed, ask TeamAlum to verify and link the existing account first. The current setup creates a new account when no connection is saved.",
  },
  {
    title: "Start or continue setup on Stripe",
    body: "For a new Stripe account, choose Connect Stripe. Stripe will guide the authorized representative through the organization details, identity checks, and bank information. Enter sensitive details only on Stripe’s secure pages.",
  },
  {
    title: "Return to TeamAlum",
    body: "Complete the Stripe flow and let it return you to Payments. If Stripe asks for more information, continue from the same organization’s Payments page. Closing the Stripe window before returning can leave TeamAlum’s status out of date.",
  },
  {
    title: "Confirm payments and payouts",
    body: "Sign in to your organization’s Stripe Dashboard and check for outstanding requirements, payment restrictions, and payout setup. TeamAlum’s current Connected label does not by itself confirm that payouts are enabled.",
  },
  {
    title: "Ask TeamAlum to verify launch readiness",
    body: "TeamAlum should verify the saved account belongs to this organization, production mode is configured, and membership updates arrive from Stripe. Test payments belong in a separate test environment. Once the page and payment checks pass, submit the site for HQ launch review.",
  },
];

export const stripeSetupTroubleshooting = [
  {
    question: "I already have Stripe. Should I create another account?",
    answer: "Ask TeamAlum to check your existing connection first. A Stripe login can contain several business accounts; using the same email does not prove it is the same account. The current TeamAlum flow creates a new Standard account if no account ID is saved. Do not replace an account used by active memberships without a migration plan.",
  },
  {
    question: "Why does setup ask me to log in again?",
    answer: "Studio sessions belong to the hostname where you signed in. Start and finish on the same TeamAlum hostname. If setup returns you to a different domain, ask TeamAlum to correct the return address. HQ and Studio logins are separate.",
  },
  {
    question: "My setup link expired. What should I do?",
    answer: "Return to your organization’s Payments page to continue setup. Stripe setup links expire and are single-use; do not bookmark or forward them. If the account is already connected, ask TeamAlum to check its status rather than reopening onboarding just to review it.",
  },
  {
    question: "Stripe says complete but TeamAlum still says pending.",
    answer: "Confirm you returned to the same organization’s Payments page. Check Stripe for missing requirements and ask TeamAlum to refresh the saved status if needed. Do not create a second account to clear a pending label.",
  },
  {
    question: "A member paid, but their membership did not update.",
    answer: "Confirm the payment in the organization’s own Stripe Dashboard, then contact TeamAlum. TeamAlum needs to check its payment notifications and the client/account mapping. Do not charge the member again just to update the membership record.",
  },
];
