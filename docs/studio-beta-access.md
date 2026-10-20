# Studio beta access

The private beta form at `/studio/start` is controlled by `src/lib/studio-start-gate.ts`.

Set `TEAMALUM_STUDIO_START_PASSWORD` in the deployment project's server environment (for Vercel: Project Settings → Environment Variables), select the intended Production/Preview environment, and redeploy. For local development, set it in this repository's `.env.local` and restart the development server. Do not use a `NEXT_PUBLIC_` prefix.

The password lookup order is:
1. `TEAMALUM_STUDIO_START_PASSWORD`
2. `TEAMALUM_HQ_PASSWORD`
3. `ADMIN_PASSWORD`

Set the dedicated Studio-start variable to change beta access independently of HQ/admin access. If none is configured, the unlock form is disabled. This is an environment setting, not a database or Studio editor field.

The signed access cookie lasts 12 hours. Its signing-key lookup order is `TEAMALUM_STUDIO_START_SECRET`, `TEAMALUM_STUDIO_SESSION_SECRET`, `TEAMALUM_HQ_SESSION_SECRET`, then the selected password. Set or rotate the dedicated `TEAMALUM_STUDIO_START_SECRET` alongside a password change if existing unlocked sessions must be invalidated. No secret values are included here.

Client-facing Site Admin links use the existing `/studio/login` email/password flow; older standalone sites retain `/admin`. No schema migration is required. Success pages reuse `brand.logoUrl` from the existing site content; upload a primary logo in the existing site editor if none is configured. `/success` is an alias; checkout continues to use `/membership/success`.

## Files changed in the October 20 update

- `src/app/studio/start/page.tsx`, `src/components/studio-header.tsx`, `src/app/globals.css`: homepage black, gold, and cream palette; scoped Studio header theme; script font styling.
- `src/app/join/page.tsx`, `src/components/site/client-site-public.tsx`, `src/app/preview/[clientId]/join/page.tsx`, `src/components/join-form.tsx`: membership layout, typography, and form styling.
- `src/components/public-nav.tsx`, `src/components/site-admin-link.tsx`: visible desktop/mobile login entry points.
- `src/components/membership-thanks.tsx`, `src/app/membership/success/page.tsx`, `src/app/site/[clientId]/membership/success/page.tsx`: organization logo and decorative script thank-you at 30% opacity. Script appearance uses the device's installed cursive fonts.
- `src/app/success/page.tsx`, `middleware.ts`: success alias for standalone and client subdomain routes.
- `docs/studio-beta-access.md`: configuration and handoff notes.

Validation: TypeScript and targeted ESLint passed; production build passed with `next build --webpack`; built Studio start route returned HTTP 200 with expected gold theme and unlock form markup. Default Turbopack build stalled and was stopped. Browser visual verification was blocked by local preview connectivity; checkout and authenticated login were not exercised end-to-end. Changes are local and have not been deployed.
