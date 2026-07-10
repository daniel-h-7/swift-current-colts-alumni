export type SiteBrand = {
  alumniSectionCopy: string;
  ctaLabel: string;
  footerLocation: string;
  heroBody: string;
  heroKicker: string;
  heroLineOne: string;
  heroLineTwo: string;
  initials: string;
  isDemo: boolean;
  joinHeadline: string;
  joinSubtext: string;
  logoEyebrow: string;
  logoTitle: string;
  metaDescription: string;
  metaTitle: string;
  programName: string;
  sponsorCopy: string;
  sponsorEyebrow: string;
  sponsorTitle: string;
  successHeading: string;
  successProgramLine: string;
};

const coltsBrand: SiteBrand = {
  alumniSectionCopy:
    "A cleaner showcase for the players and supporters carrying the program forward.",
  ctaLabel: "Support the Program Today!",
  footerLocation: "Swift Current, Saskatchewan",
  heroBody:
    "Connecting generations of Colts football while supporting the athletes who wear the jersey today.",
  heroKicker: "Colts Football Alumni and Booster Club",
  heroLineOne: "THE LEGACY",
  heroLineTwo: "LIVES ON.",
  initials: "SC",
  isDemo: false,
  joinHeadline: "Support Colts Football",
  joinSubtext:
    "Your gift today helps ensure our student-athletes have the necessary tools to succeed on and off the football field.",
  logoEyebrow: "Swift Current",
  logoTitle: "Colts Football",
  metaDescription:
    "The official alumni and booster club home for Swift Current Colts Football.",
  metaTitle: "Colts Football Alumni and Booster Club",
  programName: "Colts Football",
  sponsorCopy:
    "Thank you to our amazing sponsors for your continued support of Swift Current Colts Football!",
  sponsorEyebrow: "Backed By Community",
  sponsorTitle: "Legacy Sponsors",
  successHeading: "Thank you for your support of Colts Football!",
  successProgramLine:
    "Stay tuned for future updates and events regarding the Colts program and our supporters.",
};

const demoBrand: SiteBrand = {
  alumniSectionCopy:
    "A polished example of how a program can showcase alumni, activate supporters, and keep the next generation connected.",
  ctaLabel: "Try the Support Flow",
  footerLocation: "Fictional Demo Program",
  heroBody:
    "See how one branded site can collect memberships and gifts, spotlight alumni, feature sponsors, manage contacts, and power campaign follow-up.",
  heroKicker: "Live Demo: Alumni + Booster Platform",
  heroLineOne: "TURN SUPPORT",
  heroLineTwo: "INTO MOMENTUM.",
  initials: "NY",
  isDemo: true,
  joinHeadline: "Support Northwest Yetis",
  joinSubtext:
    "Demo a clean supporter signup flow built for memberships, one-time gifts, alumni engagement, and future campaign follow-up.",
  logoEyebrow: "Northwest",
  logoTitle: "Yetis",
  metaDescription:
    "A polished Northwest Yetis demo site for alumni, booster, sponsor, and membership management.",
  metaTitle: "Northwest Yetis Alumni and Booster Club",
  programName: "Northwest Yetis",
  sponsorCopy:
    "Showcase sponsors, partners, and community champions in a polished scrolling sponsor rail.",
  sponsorEyebrow: "Partner Ready",
  sponsorTitle: "Sponsor Showcase",
  successHeading: "Thank you for supporting the Northwest Yetis!",
  successProgramLine:
    "This is where supporters can share the campaign and stay connected with future updates and events.",
};

export function getSiteBrand() {
  const variant = process.env.NEXT_PUBLIC_SITE_VARIANT?.trim().toLowerCase();

  return variant === "demo" ? demoBrand : coltsBrand;
}
