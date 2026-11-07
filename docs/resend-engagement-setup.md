# Campaign delivery and engagement reporting

The platform endpoint is `https://www.teamalum.com/api/resend/webhook`. It verifies raw-body Svix signatures and their timestamp before touching the database. Configure `RESEND_WEBHOOK_SECRET` in the platform Production environment with the signing secret from that exact Resend endpoint. Keep it server-only; do not commit it. Publish the code and redeploy after saving the secret.

Run `supabase/resend-engagement-migration.sql` once in the shared database. It is rerunnable and backfills totals from recorded welcome/manual campaign sends without sending any mail. Its reporting functions are restricted to the service role. Existing schema, contact IDs and team boundaries are preserved. No new recipient or contact records are created by tracking.

Subscribe the Resend webhook to `email.sent`, `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`, `email.failed`, `email.delivery_delayed`, and `email.suppressed`. The endpoint bypasses demo gating but requires a valid Resend signature. Persistence errors return 503 for provider retry. Unrelated auth, management-link and test emails are ignored.

Enable open and click tracking for the sending domain in Resend. Its new domain flow can require a branded tracking subdomain and DNS verification. Preserve existing DNS and certificate-authority records. This integration uses one shared connection for teams sending through the configured Resend account; a separate provider/account requires separate configuration.

Actual campaigns and automatic welcome emails now carry team/blast tags, covering webhook events arriving before the local send record. Previously sent untagged messages can be correlated using their saved provider ID. Resend retry IDs are unique in the database. Opens and clicks count unique message IDs rather than repeated pixel loads or link clicks. Transactional database refreshes serialize per blast. Sent counts mean accepted sends, not guaranteed inbox delivery; delivery/failure details appear in the blast event history. Test sends do not affect campaign totals.

Historical sends are backfilled. Historical opens/clicks are not invented: they require recorded provider events and cannot be recovered if tracking was off when the message was sent. Resend retries or replays of actual events are safe. Open rates remain estimates because mail privacy features and image blocking affect them.

Validation: real Svix signature/timestamp tests, database migration/backfill and idempotency tests using PostgreSQL, team-isolation and unrelated/test-message exclusion, early-event correlation, provider tags, full app suite, lint, and platform webpack build. No real email is sent by these tests.
