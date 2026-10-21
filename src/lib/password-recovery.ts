/** Parse only Supabase's password-recovery fragment, never a normal login link. */
export function parsePasswordRecoveryFragment(hash: string, expectedType: "recovery" | "invite" = "recovery") {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (params.get("error") || params.get("error_code")) {
    throw new Error("This reset link has expired or is invalid. Request a new one.");
  }
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (params.get("type") !== expectedType || !accessToken || !refreshToken) {
    throw new Error("Open the password reset link from your email to continue.");
  }
  return { access_token: accessToken, refresh_token: refreshToken };
}

export function validateNewPassword(password: string, confirmation: string) {
  if (password.length < 8) return "Use at least 8 characters for your password.";
  if (password !== confirmation) return "The passwords do not match.";
  return null;
}
