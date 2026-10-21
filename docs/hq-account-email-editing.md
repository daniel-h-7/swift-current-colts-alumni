# Edit Studio account emails from HQ

Open **HQ → Clients → Edit account** under an owner's email, or open a client and find **Account access**. Each linked user has an **Edit email** button. Enter the new address and choose **Save email**. This form saves independently of the main client settings.

The edit updates the existing Supabase Auth user and all `client_users` rows for the same auth-user ID, so the login email, password-recovery email, HQ list, and other linked client listings stay synchronized. It preserves the existing password, user ID, roles, and client associations. If an address is already assigned to another account, it is rejected rather than merging accounts.

The endpoint requires an authenticated HQ session, a same-origin form submission, and `SUPABASE_SERVICE_ROLE_KEY` configured server-side. This key is already required for other HQ account administration and must never be exposed in a public environment variable. No schema migration is needed.

If account-list synchronization fails after the authentication update, the handler attempts to restore the original authentication email. If restoration also fails, the UI reports the incomplete change and requests support reconciliation. Stale forms are rejected when the displayed email no longer matches the selected membership.

Existing Studio sessions retain their current signed session data; future logins and password resets use the new address. Campaign sender and reply-to addresses are separate settings and are not changed by an account-email edit.

Validation uses synthetic accounts. No real user email or credential was changed during implementation.
