export function defaultLegendsCopy(name: string, clientId = "") {
  const warriors =
    clientId === "unity-warriors" || name === "Unity Warriors Football";
  return {
    supportButton: "Support the Team",
    supportMenu: "Support Now",
    storyMenu: "Our story",
    alumniMenu: "Alumni",
    eventsMenu: "Events",
    campaignsMenu: "Support",
    sponsorsMenu: "Our partners",
    heroBadge: "One program.\nA lifetime of belonging.",
    heroCaption: `${name} / Together`,
    storyEyebrow: "Roots here. Reach everywhere.",
    storyTitle: "More than",
    storyAccent: "a season.",
    storyLead: warriors
      ? "You don’t stop being a Warrior when the final whistle blows."
      : `Your connection to ${name} lasts beyond the final whistle.`,
    storyBody:
      "Former players. Proud families. Coaches, volunteers, and fans. This is a place to keep that connection alive—and help the next generation find theirs.",
    sponsorsEyebrow: "The people behind the program",
    sponsorsTitle: "Community,",
    sponsorsAccent: "in our corner.",
    sponsorsBody: `Thank you to the partners who stand with ${name}.`,
    alumniEyebrow: "Alumni Spotlight",
    alumniTitle: "Our alumni,",
    alumniAccent: "wherever life leads.",
    eventsEyebrow: "Back together",
    eventsTitle: "Make time",
    eventsAccent: "for your team.",
    eventsBody: "A reason to reconnect. A familiar face in the crowd.",
    inviteEyebrow: "Your next chapter",
    inviteTitle: warriors ? "Still a Warrior." : "Still part of the team.",
    inviteAccent: "Always welcome.",
    inviteBody:
      "Whether you played, cheered from the stands, or simply believe in this program, there’s a place for you here.",
    joinEyebrow: "A connection that lasts",
    joinTitle: "Be part of",
    joinAccent: "what’s next.",
    joinBody:
      "Stay connected to your program and the people who make it matter.",
    successTitle: "You’re part of",
    successAccent: "what comes next.",
    successBody: `Thank you for supporting ${name} and keeping this community connected.`,
    footerBody: "Alumni. Families. Community.\nAlways part of the team.",
  };
}
export type LegendsCopy = ReturnType<typeof defaultLegendsCopy>;
export type LegendsCopyKey = keyof LegendsCopy;
export function getLegendsCopy(
  name: string,
  value?: unknown,
  clientId = "",
): LegendsCopy {
  const result = defaultLegendsCopy(name, clientId);
  const saved =
    value && typeof value === "object"
      ? (value as Partial<Record<LegendsCopyKey, unknown>>)
      : {};
  for (const key of Object.keys(result) as LegendsCopyKey[]) {
    const text = saved[key];
    if (typeof text === "string" && text.trim())
      result[key] = text.trim().slice(0, 2000);
  }
  return result;
}
export function legendsCopyFromForm(
  form: FormData,
  name: string,
  previous?: unknown,
  clientId = "",
) {
  const saved = getLegendsCopy(name, previous, clientId);
  const defaults = defaultLegendsCopy(name, clientId);
  for (const key of Object.keys(saved) as LegendsCopyKey[]) {
    if (form.has(`legends_${key}`))
      saved[key] =
        String(form.get(`legends_${key}`) ?? "")
          .trim()
          .slice(0, 2000) || defaults[key];
  }
  return saved;
}
type CopyGroup = {
  title: string;
  fields: { key: LegendsCopyKey; label: string; multiline?: boolean }[];
};
export const legendsCopyGroups: CopyGroup[] = [
  {
    title: "Support buttons and navigation",
    fields: [
      { key: "supportButton", label: "Support button text" },
      { key: "supportMenu", label: "Support menu text" },
      { key: "storyMenu", label: "Introduction menu text" },
      { key: "alumniMenu", label: "Alumni menu text" },
      { key: "eventsMenu", label: "Events menu text" },
      { key: "campaignsMenu", label: "Campaign menu text" },
      { key: "sponsorsMenu", label: "Sponsors menu text" },
    ],
  },
  {
    title: "Introduction · More than a season",
    fields: [
      { key: "storyEyebrow", label: "Small heading" },
      { key: "storyTitle", label: "Main heading" },
      { key: "storyAccent", label: "Italic heading" },
      { key: "storyLead", label: "Opening statement", multiline: true },
      { key: "storyBody", label: "Introduction text", multiline: true },
    ],
  },
  {
    title: "Sponsors section",
    fields: [
      { key: "sponsorsEyebrow", label: "Small heading" },
      { key: "sponsorsTitle", label: "Main heading" },
      { key: "sponsorsAccent", label: "Italic heading" },
      { key: "sponsorsBody", label: "Thank-you text", multiline: true },
    ],
  },
  {
    title: "Alumni section",
    fields: [
      { key: "alumniEyebrow", label: "Small heading" },
      { key: "alumniTitle", label: "Main heading" },
      { key: "alumniAccent", label: "Italic heading" },
    ],
  },
  {
    title: "Events section",
    fields: [
      { key: "eventsEyebrow", label: "Small heading" },
      { key: "eventsTitle", label: "Main heading" },
      { key: "eventsAccent", label: "Italic heading" },
      { key: "eventsBody", label: "Section introduction", multiline: true },
    ],
  },
  {
    title: "Closing support invitation",
    fields: [
      { key: "inviteEyebrow", label: "Small heading" },
      { key: "inviteTitle", label: "Main heading" },
      { key: "inviteAccent", label: "Italic heading" },
      { key: "inviteBody", label: "Invitation text", multiline: true },
    ],
  },
  {
    title: "Support page introduction",
    fields: [
      { key: "joinEyebrow", label: "Small heading" },
      { key: "joinTitle", label: "Main heading" },
      { key: "joinAccent", label: "Italic heading" },
      { key: "joinBody", label: "Introduction text", multiline: true },
    ],
  },
  {
    title: "Thank-you page",
    fields: [
      { key: "successTitle", label: "Main heading" },
      { key: "successAccent", label: "Italic heading" },
      { key: "successBody", label: "Thank-you text", multiline: true },
    ],
  },
  {
    title: "Hero details and footer",
    fields: [
      { key: "heroBadge", label: "Text over the hero image", multiline: true },
      { key: "heroCaption", label: "Hero image caption" },
      { key: "footerBody", label: "Footer text", multiline: true },
    ],
  },
];
