# Team Settings cleanup

The CRM / campaign mailer Settings page now contains the annual supporter fee and email sender settings, using the shared white, black and gold design. Site Content links, join-page wording controls, renewal fields and the duplicate setup summary are removed from this page. The Studio content editor remains the place to edit the site.

The price control uses the existing `crm_settings.annual_membership_amount_cents` field, shared with the builder and checkout. Its handler writes only the selected team's price and edit timestamp, preserving content, join availability, renewal and email settings. Fee changes apply to new checkouts; existing Stripe subscriptions are not changed. Invalid prices and unauthenticated requests cannot write.

Shared sender, join and share placeholders, membership defaults and contact-export filenames no longer assume the Colts. Unknown or unconfigured brand variants use Your Team starter content rather than another team's sponsors or copy. Explicitly selected Colts, Rams, Badgers and demo identities, plus saved client content, remain intact.

Validation: all 120 tests, ESLint and platform webpack production build passed. Added checks cover settings controls, strict price validation, authentication, team scope, preservation of unrelated fields and neutral fallback branding. Local previews rendered the actual page/components with fixture settings and compiled CSS at desktop and mobile widths; mobile had no horizontal overflow. No live prices or sender settings were changed. Publish the code to activate; no schema or environment updates are required.
