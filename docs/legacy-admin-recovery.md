# Legacy admin recovery on TeamAlum HQ

## Report and verification

On November 6, 2026, the welcome-campaign edit/save flow was reported to land at `https://www.teamalum.com/admin/login`, displaying the standalone Colts shared-password screen. Saving the unchanged Rams campaign settings and welcome-message draft in the signed-in live workspace both returned to the correct Rams campaign; the original loss of team context was not reproduced. No campaign email was sent during these checks.

## Fix

In platform mode, all unscoped `/admin` GET/HEAD requests now enter `/studio/admin/recover` rather than executing legacy client pages. Campaign and contact destinations resolve their owner from the database and require existing team access. Team hints never grant access. Destinations without a resolvable team use an authorized single team or the normal Studio/HQ chooser. Signed-out visitors return through Studio login. Old form submissions are refused with an explicit unsaved message rather than using the deployment-default team. Old logout links enter Studio logout.

Standalone client deployments retain their existing admin authentication. No schema migration, new password, or new environment variable is required. Publish the updated platform build using the existing `TEAMALUM_APP_MODE=platform` and canonical `TEAMALUM_STUDIO_URL` configuration.

## Validation

- All 114 automated tests pass, including ownership, signed-out recovery, denied access, cross-origin hints, unsafe destinations, standalone compatibility and legacy mutation rejection.
- ESLint and the platform webpack production build pass.
- Running the compiled platform locally with the production Studio origin returns HTTP 307 from `/admin/login` to `https://www.teamalum.com/studio/admin/recover?path=%2Fadmin%2Flogin`.
- After publication, verify the old login URL and a bookmarked campaign URL with a team account, then save a draft from its scoped workspace. Do not send the campaign as part of this check.
