# Legends: shared client and mailer design

Legends replaces the Unity-only pilot and the older shared/standalone client layouts. There is one client design, without a style selector. This change is implemented locally; deployment is separate.

## Pages covered

- Client homepage, Join, and membership confirmation on HQ-hosted tenant sites.
- Studio homepage and Join previews, using the same component as public pages.
- Standalone client deployments' root homepage, Join, success aliases and membership confirmation.
- Membership management, mock-checkout, unsubscribe, and pending-launch screens.
- Admin contacts, campaign lists, campaign/blast editor, sending controls, settings, import, and login through a scoped workspace skin and compact navigation.
- Outgoing email frame: white background, black type, small gold accent, open spacing and an editorial footer. The authored body is inserted unchanged, with sender/preheader/unsubscribe metadata escaped as before. Existing saved message colours remain authored content and are not rewritten.

## Identity and content

Each site retains its saved name, primary/accent colours, logo, hero photo/crop, custom headline/body, pricing, membership availability, optional content and section order. Logo-less sites get initials derived from their own identity. The supplied Rams black mark is used on light surfaces and its white mark over the hero image. Unity retains its approved Warriors wording; other clients receive neutral program wording rather than Unity copy.

Generic clients with partial/missing content fall back to their own program's starter content rather than another club's branding. Known legacy variants retain their existing defaults. Sparse sites remain complete with an evergreen introduction and membership invitation. Empty optional sections and exact recognized starter examples are suppressed; their saved data is not deleted. Saved events remain visible regardless of their date until the editor hides the Events section or removes the event. Event images, dates, notes and links are preserved. Saved hero titles and body text render as entered, including starter wording. Feature and section switches still control visibility.

## Functionality

Database schema and payment/email delivery implementations are unchanged. Public launch gates remain enforced; previews continue to support unapproved sites. Checkouts retain preview/production organization scoping. Existing standalone membership management links and confirmation sharing controls remain available. Forms, filters, editor tools, uploads, confirmation steps, send actions and permissions retain their handlers. Workspace styles exclude the authored email editor subtree, so application typography does not overwrite email styles.

## Main files

- `src/components/site/legends/legends-site.tsx` and its CSS module: reusable client presentation.
- `src/lib/legends.ts`: identity, content visibility, link and contrast helpers, including saved RGB colours.
- `src/components/site/client-site-public.tsx`: common tenant data loading and launch gating.
- Client/preview/root route entry points and `client-home.tsx`: common rendering path; old duplicate page markup removed.
- `src/components/legends-workspace.*`, `admin-header.tsx`, Admin/utility layouts: professional workspace styling scoped away from authored messages.
- `src/components/email-editor.tsx`: presentation markers only; editing handlers unchanged.
- `src/lib/email-provider.ts`: email frame only; sending transports unchanged.
- `src/lib/site-content.ts`: tenant-specific generic fallback, without modifying saved data.
- `tests/legends*.test.cjs` and `tests/email-frame.test.cjs`: tenant isolation, gating, sparse content, branding, checkout links, and preservation of email content.

## Rollout

No new environment variables or database migration are needed. Deploy the updated application normally. All tenants served by that deployment receive Legends; separately hosted legacy Vercel projects must also deploy this repository revision to receive the new standalone rendering.

After deployment, review `/preview/<client-id>` and `/preview/<client-id>/join` for representative clients before using existing launch approval controls. Confirm supplied logos/crops and colours, optional sections, membership availability, and the mailer editor. This change does not approve any pending client for launch, send campaigns, or modify live payment accounts.

Browser checks used local fixtures and covered Rams/Colts branding, narrow-screen layouts, the actual blast editor and a generated email frame. These checks do not claim inbox compatibility across every email provider or a live payment/email send. The email frame uses presentation tables and inline styles without remote fonts or scripts.

## Validation completed

All 60 regression tests passed, along with lint, TypeScript, the webpack production build, and whitespace checks. Browser checks verified the actual email editor's text/formatting controls and preserved a custom 26px blue heading, previewed Rams and Colts identities, confirmed the Rams light/dark logo variants, and checked client/mailer/email layouts at 390px without horizontal document overflow. Existing build notices about metadataBase and Node module registration remain unrelated to this presentation change.

## Editable wording

Studio → Site Content now includes **Legends section wording**. Clients can open a group to personalize section eyebrows, main/italic headings, introductions, support buttons, navigation, closing invitation, support-page introduction, thank-you page, hero image text and footer. The same fields are available in legacy Admin → Settings → Site Content. Defaults are prefilled and a cleared field restores its default on save. The separate Studio **Support form wording** fields edit the existing signup form heading/body; saving other content preserves them.

Current shared defaults are **Support the Team** for primary support buttons, **Support Now** for the former Membership menu entry, and **Alumni Spotlight** for the alumni section eyebrow. Link destinations and checkout behavior remain unchanged. Individual campaign button text continues to use its campaign fields.

Copy is stored as an optional `legends` object within the existing `crm_settings.site_content` JSON. Older records receive defaults automatically; no SQL migration or environment setting is needed. Only plain text is supported. Layout, typography, membership price and renewal disclosures are unaffected by section wording edits. Existing custom hero copy and event/alumni/campaign content remain in their established fields.

## Editor controls — November 5, 2026

- All Legends wording categories are nested inside a closed **Editable sections** disclosure, shared by Studio and the legacy content editor. Collapsing it does not remove fields from the save form.
- Studio exposes every saved event and sponsor, with **Add Another Event** / **Add Another Sponsor** controls. Clear a title/name to remove that entry on save. Indexed fields, existing upload/crop handling and the existing JSON arrays remain in use; older open forms still preserve entries beyond their original two/three slots.
- Studio's **Supporter fee & form wording** block now includes **Annual supporter fee (CAD)**. It writes validated integer cents to the existing client-scoped `crm_settings.annual_membership_amount_cents` setting with the content save. Older forms omit this update. This sets the price for new checkouts; existing Stripe subscriptions are not repriced. No live fee was changed as part of implementation.
- Legends sponsors stay on a horizontal row. When content overflows, it advances one sponsor every three seconds, wraps to the beginning, and offers previous/next and pause/play controls. Hover and keyboard focus pause rotation, touch stops autoplay for swiping, and reduced-motion users get manual controls without autoplay. Fitting rows have no controls or rotation.
- No schema migration or environment configuration is required. Local browser fixtures verified adding rows, the nested disclosure, autoplay, manual navigation, and a 390px viewport without page overflow. All 101 tests, lint and the platform webpack build passed. No real payments, emails or production settings were changed.
