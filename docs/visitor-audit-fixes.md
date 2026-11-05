# Public visitor audit fixes — November 4, 2026

Approved scope: findings 1–5 from the RMR visitor review. No schema migration or new environment variable is required. Changes use existing team records, client integrations, content, email settings, and Stripe Connect flow.

## Membership management

Public hostname requests for `/membership/manage` and `/api/membership/portal` resolve to explicit `/site/<client-id>/...` routes. The page loads that team's content and displays the Legends layout, with links from the homepage footer, join page and membership-status page. The endpoint resolves the canonical client from its URL, requires same-origin POSTs, scopes the contact lookup by client and email, uses team-specific sender settings and activity records, and passes an explicit client to Stripe's portal request. A stored payment-account mismatch is refused. Unknown members retain the generic success response; no member existence or portal URL is disclosed to the browser. Only the contact's stored address receives the management email. Standalone routes delegate to the same implementation with their existing deployment client.

## Membership status

The success page reads Stripe's Checkout Session under the team's verified connected account and checks the returned session ID, team metadata, mode, subscription mode, completion and payment status. Only completed paid/no-payment-required sessions show the configured success copy and sharing controls. Missing, invalid or inaccessible sessions display a neutral status; incomplete sessions show processing. The check is read-only and never marks a contact paid. Existing Stripe webhooks remain responsible for payment records.

## Sponsor mismatch

The known saved “Sussex Insurance”/Cranbrook Flooring URL pairing no longer renders a link. The sponsor remains visible using its saved name/artwork or text fallback. No replacement URL/logo is fabricated, and no live content row is overwritten. A corrected destination saved in the editor automatically restores the link. Other sponsor URLs are unchanged.

## Team metadata

Public team home/join/manage/status routes now derive titles, descriptions, canonical URLs and sharing metadata from the resolved client and saved content. Management/status metadata is noindex. Standalone home/join pages also use resolved client metadata. TeamAlum's marketing metadata is preserved.

## Additional gifts

The join form shows today's membership-plus-gift amount in CAD and the separate annual renewal amount. Gift controls expose aria-pressed state and an explicit No extra gift reset. Custom gifts update the summary and require a positive amount when selected. Stripe checkout remains authoritative for the actual transaction; no charging logic or recurring interval was changed.

## Validation

96 tests, lint and a platform-mode webpack production build passed. Tests cover tenant routing, scoped contact/email/activity/portal requests, payment-account mismatches, paid/pending/missing/wrong-team/wrong-mode session checks, client metadata, sponsor link handling and confirmed-only success copy/sharing. Browser checks at desktop and 390-pixel mobile widths verified $100 base, $200 today with a $100 gift, $125 with a custom $25 gift, reset to $100, required-field validation, accessible selection states, RMR management branding, and neutral unverified status. Temporary browser fixtures were removed before the final production build. No real membership emails or payments were sent in testing.
