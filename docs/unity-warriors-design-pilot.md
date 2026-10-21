# Unity Warriors design pilot

The new presentation is enabled only for the exact client ID `unity-warriors` in `src/lib/unity-pilot.ts`. All other clients keep their existing rendering. No schema, stored content, Stripe integration, account access, or launch approval is changed.

## Review after deployment

- Homepage preview: `/preview/unity-warriors`.
- Membership preview: `/preview/unity-warriors/join`.
- Public homepage and join use the same component after the existing HQ launch gate passes. This change does not approve launch.
- The client's existing membership success route uses the matching white confirmation design.
- Edit the current logo, hero image/crop, title/body, colours, membership pricing, optional content and section order through the existing builder. Existing saved custom hero copy is preserved. Only the exact untouched starter title/body receive the pilot's evergreen copy.

## Designed for infrequent maintenance

The logo or an automatic UW wordmark, one photograph, evergreen introduction, and membership invitation form a complete baseline. The typography, cropped watermark, diagonal photograph and subtle texture supply visual identity without requiring an article feed or a photo library. A supplied primary logo replaces the UW fallback automatically.

- Empty optional sections and their navigation links do not appear.
- Exact recognizable starter spotlight, sponsor labels, and example campaign/event signatures are suppressed in this presentation, without deleting their saved records. Replace starter examples with actual details to display them.
- Complete English calendar dates and ISO dates retire past events automatically at the UTC day boundary; seasonal/undated text stays visible. No empty “upcoming” section is left behind.
- Actual sponsors can display as names without uploaded logos. Alumni without a photograph use a compact initials treatment, not an empty portrait panel.
- Actual campaigns retain amounts, progress and configured destination. No sample fundraising totals appear in the sparse baseline.
- Feature and section visibility/order continue to apply. Closed/disabled membership forms remain disabled. Production and preview checkout endpoints retain their existing organization scoping.
- Pale brand colours automatically receive dark button text and a readable heading accent.

## Implementation

- `src/components/site/unity/unity-site.tsx`: shared pilot home, join, and success presentation.
- `src/components/site/unity/unity-site.module.css`: scoped responsive design; no client-wide global styles.
- `src/lib/unity-pilot.ts`: exact-client switch, optional-content rules, link and contrast helpers.
- Existing public/preview route entry points branch only for Unity.
- `tests/unity-pilot.test.cjs`: isolation, sparse baseline, stale events, feature toggles, destination safety, and checkout scoping.

Do not broaden the pilot switch until the Unity design has been reviewed and refined. General rollout should replace Unity-specific words and initials with a tenant-aware identity while retaining the same sparse-content behavior. No new environment variables or database migration are needed for this pilot.
