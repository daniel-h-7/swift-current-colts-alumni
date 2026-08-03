export function getTeamAlumAppMode() {
  return (
    process.env.TEAMALUM_APP_MODE ??
    process.env.NEXT_PUBLIC_TEAMALUM_APP_MODE ??
    "client"
  )
    .trim()
    .toLowerCase();
}

export function isPlatformApp() {
  return getTeamAlumAppMode() === "platform";
}
