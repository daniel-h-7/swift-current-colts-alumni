export type SiteBrand = {
  alumniSectionCopy: string;
  alumniEyebrow: string;
  crmName: string;
  ctaLabel: string;
  footerLocation: string;
  heroBody: string;
  heroKicker: string;
  heroLineOne: string;
  heroLineTwo: string;
  initials: string;
  isDemo: boolean;
  joinProgramName: string;
  joinHeadline: string;
  joinSubtext: string;
  logoEyebrow: string;
  logoTitle: string;
  metaDescription: string;
  metaTitle: string;
  programName: string;
  shareDescription: string;
  sponsorCopy: string;
  sponsorEyebrow: string;
  sponsorTitle: string;
  successHeading: string;
  successProgramLine: string;
  themeClass: string;
  variant: "colts" | "demo" | "rmrfootball";
};

const coltsBrand: SiteBrand = {
  alumniSectionCopy:
    "A cleaner showcase for the players and supporters carrying the program forward.",
  alumniEyebrow: "Colts Family",
  crmName: "Colts CRM",
  ctaLabel: "Support the Program Today!",
  footerLocation: "Swift Current, Saskatchewan",
  heroBody:
    "Connecting generations of Colts football while supporting the athletes who wear the jersey today.",
  heroKicker: "Colts Football Alumni and Booster Club",
  heroLineOne: "THE LEGACY",
  heroLineTwo: "LIVES ON.",
  initials: "SC",
  isDemo: false,
  joinProgramName: "the Colts",
  joinHeadline: "Support Colts Football",
  joinSubtext:
    "Your gift today helps ensure our student-athletes have the necessary tools to succeed on and off the football field.",
  logoEyebrow: "Swift Current",
  logoTitle: "Colts Football",
  metaDescription:
    "The official alumni and booster club home for Swift Current Colts Football.",
  metaTitle: "Colts Football Alumni and Booster Club",
  programName: "Colts Football",
  shareDescription:
    "I invite you to join me in supporting Swift Current Colts Football. As an alumni or booster, our gift can make a lasting impact on our young student-athletes!",
  sponsorCopy:
    "Thank you to our amazing sponsors for your continued support of Swift Current Colts Football!",
  sponsorEyebrow: "Backed By Community",
  sponsorTitle: "Legacy Sponsors",
  successHeading: "Thank you for your support of Colts Football!",
  successProgramLine:
    "Stay tuned for future updates and events regarding the Colts program and our supporters.",
  themeClass: "",
  variant: "colts",
};

const demoBrand: SiteBrand = {
  alumniSectionCopy:
    "A polished example of how a program can showcase alumni, activate supporters, and keep the next generation connected.",
  alumniEyebrow: "Yeti Legends",
  crmName: "Northwest Yetis CRM",
  ctaLabel: "Try the Support Flow",
  footerLocation: "Fictional Demo Program",
  heroBody:
    "See how one branded site can collect memberships and gifts, spotlight alumni, feature sponsors, manage contacts, and power campaign follow-up.",
  heroKicker: "Live Demo: Alumni + Booster Platform",
  heroLineOne: "TURN SUPPORT",
  heroLineTwo: "INTO MOMENTUM.",
  initials: "NY",
  isDemo: true,
  joinProgramName: "the program",
  joinHeadline: "Support Northwest Yetis",
  joinSubtext:
    "Demo a clean supporter signup flow built for memberships, one-time gifts, alumni engagement, and future campaign follow-up.",
  logoEyebrow: "Northwest",
  logoTitle: "Yetis",
  metaDescription:
    "A polished Northwest Yetis demo site for alumni, booster, sponsor, and membership management.",
  metaTitle: "Northwest Yetis Alumni and Booster Club",
  programName: "Northwest Yetis",
  shareDescription:
    "Preview a polished TeamAlum supporter signup flow for alumni, boosters, sponsors, and football programs.",
  sponsorCopy:
    "Showcase sponsors, partners, and community champions in a polished scrolling sponsor rail.",
  sponsorEyebrow: "Partner Ready",
  sponsorTitle: "Sponsor Showcase",
  successHeading: "Thank you for supporting the Northwest Yetis!",
  successProgramLine:
    "This is where supporters can share the campaign and stay connected with future updates and events.",
  themeClass: "demo-public",
  variant: "demo",
};

const ramsBrand: SiteBrand = {
  alumniSectionCopy:
    "Celebrate Rams alumni, connect supporters, and keep the next wave of student-athletes climbing.",
  alumniEyebrow: "Rams Legacy",
  crmName: "Rams CRM",
  ctaLabel: "Support the Rams Today!",
  footerLocation: "Rocky Mountain Region",
  heroBody:
    "Connecting Rocky Mountain Rams alumni, families, boosters, and sponsors behind the student-athletes building the next chapter.",
  heroKicker: "Rocky Mountain Rams Football Alumni and Booster Club",
  heroLineOne: "CLIMB HIGHER.",
  heroLineTwo: "RAMS TOGETHER.",
  initials: "RM",
  isDemo: false,
  joinProgramName: "the Rams",
  joinHeadline: "Support Rocky Mountain Rams Football",
  joinSubtext:
    "Your support helps provide Rams student-athletes with the tools, opportunities, and community backing they need on and off the field.",
  logoEyebrow: "Rocky Mountain",
  logoTitle: "Rams Football",
  metaDescription:
    "The official alumni and booster club home for Rocky Mountain Rams Football.",
  metaTitle: "Rocky Mountain Rams Football Alumni and Booster Club",
  programName: "Rocky Mountain Rams Football",
  shareDescription:
    "I invite you to join me in supporting Rocky Mountain Rams Football. Alumni, families, and boosters can make a lasting impact on our student-athletes.",
  sponsorCopy:
    "Thank you to the sponsors and community partners helping Rams Football keep climbing.",
  sponsorEyebrow: "Powered By Community",
  sponsorTitle: "Rams Partners",
  successHeading: "Thank you for supporting Rocky Mountain Rams Football!",
  successProgramLine:
    "Stay tuned for future updates and events regarding the Rams program and our supporters.",
  themeClass: "rams-public",
  variant: "rmrfootball",
};

export function getSiteBrand() {
  const variant = process.env.NEXT_PUBLIC_SITE_VARIANT?.trim().toLowerCase();

  if (variant === "demo") {
    return demoBrand;
  }

  if (variant === "rmrfootball" || variant === "rams") {
    return ramsBrand;
  }

  return coltsBrand;
}
