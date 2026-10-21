/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { CSSProperties } from "react";
import type { SiteContent } from "@/lib/site-content";
import type { MembershipSettings } from "@/lib/membership-settings";
import type { SiteSection } from "@/lib/site-sections-shared";
import { JoinForm } from "@/components/join-form";
import { studioLoginPath } from "@/lib/studio-navigation";
import {
  pilotColors,
  safePilotLink,
  unityPresentation,
} from "@/lib/unity-pilot";
import styles from "./unity-site.module.css";

type Client = { id: string; name: string };
type Props = {
  client: Client;
  content: SiteContent;
  settings: MembershipSettings;
  features: { feature_key: string; is_enabled: boolean }[];
  sections: SiteSection[];
  preview?: boolean;
  showJoin?: boolean;
};

function theme(content: SiteContent) {
  const colors = pilotColors(
    content.brand.primaryColor,
    content.brand.accentColor,
  );
  return {
    "--unity-brand": colors.brand,
    "--unity-accent": colors.accent,
    "--unity-on-brand": colors.onBrand,
    "--unity-brand-ink": colors.ink,
  } as CSSProperties;
}
function Mark({
  content,
  large = false,
}: {
  content: SiteContent;
  large?: boolean;
}) {
  return content.brand.logoUrl ? (
    <img
      src={content.brand.logoUrl}
      alt={`${content.brand.siteTitle} logo`}
      className={large ? styles.largeLogo : styles.logo}
    />
  ) : (
    <span
      className={large ? styles.largeMonogram : styles.monogram}
      aria-label="Unity Warriors"
    >
      UW<span aria-hidden="true">/</span>
    </span>
  );
}
function Arrow() {
  return <span aria-hidden="true">↗</span>;
}
function Header({
  client,
  content,
  home,
  preview,
  join,
}: {
  client: Client;
  content: SiteContent;
  home: string;
  preview: boolean;
  join?: string;
}) {
  return (
    <>
      {preview && (
        <div className={styles.preview}>
          Design preview <span>Unity Warriors only</span>
          <Link href={`/studio/${encodeURIComponent(client.id)}/content`}>
            Back to editor ↗
          </Link>
        </div>
      )}
      <header className={styles.header}>
        <Link href={home} className={styles.identity}>
          <Mark content={content} />
          <span>
            <strong>{client.name}</strong>
            <small>Alumni &amp; supporters</small>
          </span>
        </Link>
        <nav className={styles.headerNav} aria-label="Main navigation">
          <Link
            href={studioLoginPath(`/studio/${encodeURIComponent(client.id)}`)}
          >
            ADMIN
          </Link>
          {join ? (
            <Link className={styles.button} href={join}>
              Join the Warriors <Arrow />
            </Link>
          ) : (
            <Link href={home}>
              Home <Arrow />
            </Link>
          )}
        </nav>
      </header>
    </>
  );
}
function Footer({
  client,
  content,
  home,
}: {
  client: Client;
  content: SiteContent;
  home: string;
}) {
  return (
    <footer className={styles.footer}>
      <Link href={home} className={styles.identity}>
        <Mark content={content} />
        <strong>{client.name}</strong>
      </Link>
      <p>
        Alumni. Families. Community.
        <br />
        Always part of the team.
      </p>
      <span>
        Powered by <a href="https://www.teamalum.com">TeamAlum ↗</a>
      </span>
    </footer>
  );
}
function Amount({ settings }: { settings: MembershipSettings }) {
  return (
    <>
      {new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
        maximumFractionDigits:
          settings.annual_membership_amount_cents % 100 ? 2 : 0,
      }).format(settings.annual_membership_amount_cents / 100)}
    </>
  );
}
function MembershipInvite({
  settings,
  join,
}: {
  settings: MembershipSettings;
  join: string;
}) {
  return (
    <section id="membership" className={styles.invite}>
      <div className={styles.inviteInner}>
        <p className={styles.eyebrow}>Your next chapter</p>
        <h2>
          Still a Warrior.
          <br />
          <em>Always welcome.</em>
        </h2>
        <div className={styles.inviteBottom}>
          <p>
            Whether you played, cheered from the stands, or simply believe in
            this program, there’s a place for you here.
          </p>
          <div>
            <span className={styles.price}>
              <Amount settings={settings} />
              <small>/ year</small>
            </span>
            <Link className={styles.button} href={join}>
              {settings.join_is_open ? "Become a member" : "View membership"}{" "}
              <Arrow />
            </Link>
          </div>
        </div>
      </div>
      <span className={styles.inviteMark} aria-hidden="true">
        W
      </span>
    </section>
  );
}

export function UnitySite({
  client,
  content,
  settings,
  features,
  sections,
  preview = false,
  showJoin = false,
}: Props) {
  const view = unityPresentation(content, features, sections);
  const home = preview ? `/preview/${encodeURIComponent(client.id)}` : "/";
  const join = preview ? `${home}/join` : "/join";
  const brand = content.brand;
  const starterTitle = brand.heroTitle === `Support ${client.name}`;
  const starterBody =
    brand.heroBody ===
    `${client.name} now has one home for alumni, families, sponsors, and supporters to reconnect, stay informed, and help keep the program moving forward.`;
  const photo = brand.heroImageUrl || "/images/stadium.jpg";

  if (showJoin)
    return (
      <main className={styles.site} style={theme(content)}>
        <Header
          client={client}
          content={content}
          home={home}
          preview={preview}
        />
        <div className={styles.joinLayout}>
          <aside className={styles.joinAside}>
            <Link href={home} className={styles.textLink}>
              ← Back to the Warriors
            </Link>
            <p className={styles.eyebrow}>A connection that lasts</p>
            <h1>
              Be part of
              <br />
              <em>what’s next.</em>
            </h1>
            <Mark content={content} large />
            <p>
              Stay connected to your program and the people who make it matter.
            </p>
            <div className={styles.joinPrice}>
              <Amount settings={settings} />
              <small>
                Annual membership · {settings.membership_year_label}
              </small>
            </div>
            <p className={styles.finePrint}>
              Renews annually until canceled. An optional one-time gift is added
              to your first checkout.
            </p>
          </aside>
          <div className={styles.joinForm}>
            <JoinForm
              checkoutPath={
                preview
                  ? `${home}/api/membership/checkout`
                  : `/site/${encodeURIComponent(client.id)}/api/membership/checkout`
              }
              headline={settings.join_headline}
              subtext={settings.join_body}
              isOpen={settings.join_is_open && view.memberships}
              primaryColor={
                pilotColors(brand.primaryColor, brand.accentColor).brand
              }
              accentColor={brand.accentColor}
              programName={client.name}
            />
          </div>
        </div>
        <Footer client={client} content={content} home={home} />
      </main>
    );

  function renderSection(key: string) {
    if (key === "sponsors" && view.sponsors.length)
      return (
        <section id="sponsors" className={styles.sponsors} key={key}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>The people behind the program</p>
              <h2>
                Community, <em>in our corner.</em>
              </h2>
            </div>
            <p>Thank you to the partners who stand with the Warriors.</p>
          </div>
          <div className={styles.sponsorLogos}>
            {view.sponsors.map((s) => {
              const href = safePilotLink(s.linkUrl);
              const inner = s.imageUrl ? (
                <img src={s.imageUrl} alt={s.name} loading="lazy" />
              ) : (
                <span>{s.name}</span>
              );
              return href ? (
                <a href={href} key={s.name}>
                  {inner}
                </a>
              ) : (
                <div key={s.name}>{inner}</div>
              );
            })}
          </div>
        </section>
      );
    if (key === "spotlights" && view.spotlights.length)
      return (
        <section id="alumni" className={styles.alumni} key={key}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Part of our story</p>
              <h2>
                Warriors, <em>wherever life leads.</em>
              </h2>
            </div>
          </div>
          <div className={styles.alumniStories}>
            {view.spotlights.map((s, i) => (
              <article key={`${s.name}-${i}`} className={styles.alumniStory}>
                {s.imageUrl ? (
                  <div className={styles.portrait}>
                    <img
                      src={s.imageUrl}
                      alt={s.name}
                      loading="lazy"
                      className={s.imageClass}
                    />
                  </div>
                ) : (
                  <div className={styles.portraitMark} aria-hidden="true">
                    {s.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")}
                  </div>
                )}
                <div>
                  <p className={styles.eyebrow}>
                    {s.classYear || "Warriors community"}
                  </p>
                  <h3>{s.name}</h3>
                  <p>{s.descriptor}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      );
    if (key === "events" && view.events.length)
      return (
        <section id="events" className={styles.events} key={key}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Back together</p>
              <h2>
                Make time <em>for your team.</em>
              </h2>
            </div>
            <p>A reason to reconnect. A familiar face in the crowd.</p>
          </div>
          <div className={styles.eventList}>
            {view.events.map((e, i) => {
              const href = safePilotLink(e.linkUrl);
              return (
                <article key={`${e.title}-${i}`} className={styles.event}>
                  <div className={styles.eventDate}>
                    {e.date || "Details to come"}
                  </div>
                  <div>
                    <h3>{e.title}</h3>
                    {e.notes && <p>{e.notes}</p>}
                  </div>
                  {href && (
                    <a className={styles.textLink} href={href}>
                      {e.linkLabel || "Event details"} <Arrow />
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      );
    if (key === "fundraising_campaigns" && view.campaigns.length)
      return (
        <section id="support" className={styles.campaigns} key={key}>
          {view.campaigns.map((c, i) => {
            const href = safePilotLink(c.buttonUrl);
            return (
              <article className={styles.campaign} key={`${c.title}-${i}`}>
                <div>
                  <p className={styles.eyebrow}>
                    {c.eyebrow || "Moving the program forward"}
                  </p>
                  <h2>{c.title}</h2>
                  {c.description && <p>{c.description}</p>}
                </div>
                <div className={styles.campaignProgress}>
                  <strong>{c.raisedLabel}</strong>
                  <span>{c.goalLabel}</span>
                  <div
                    className={styles.progress}
                    role="progressbar"
                    aria-label={`${c.title} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.max(
                      0,
                      Math.min(100, c.progressPercent),
                    )}
                  >
                    <span
                      style={{
                        width: `${Math.max(0, Math.min(100, c.progressPercent))}%`,
                      }}
                    />
                  </div>
                  <small>{c.progressPercent}% of goal</small>
                  {href && (
                    <a
                      className={styles.textLink}
                      href={preview && href === "/join" ? join : href}
                    >
                      {c.buttonLabel || "Learn more"} <Arrow />
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      );
    if (key === "memberships" && view.memberships)
      return <MembershipInvite key={key} settings={settings} join={join} />;
    return null;
  }
  return (
    <main className={styles.site} style={theme(content)}>
      <Header
        client={client}
        content={content}
        home={home}
        preview={preview}
        join={view.memberships ? join : undefined}
      />
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            {brand.heroKicker || "Unity Warriors · Alumni & supporters"}
          </p>
          <h1>
            {starterTitle ? (
              <>
                Once a Warrior.
                <br />
                <em>Always a Warrior.</em>
              </>
            ) : (
              brand.heroTitle
            )}
          </h1>
          <p>
            {starterBody
              ? "The game brings us together. Being a Warrior keeps us connected. A home for everyone who carries this program with them."
              : brand.heroBody}
          </p>
          <div className={styles.heroActions}>
            {view.memberships ? (
              <Link className={styles.button} href={join}>
                Join the Warriors <Arrow />
              </Link>
            ) : (
              <a className={styles.textLink} href="#our-story">
                Meet your community <Arrow />
              </a>
            )}
            <a href="#our-story" className={styles.textLink}>
              Our story <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <img
            src={photo}
            alt=""
            fetchPriority="high"
            style={{ objectPosition: brand.heroImagePosition || "50% 50%" }}
          />
          <div className={styles.photoShade} />
          <span className={styles.photoWord} aria-hidden="true">
            UNITY
          </span>
          <div className={styles.heroEmblem}>
            <Mark content={content} large />
            <span>
              One program.
              <br />A lifetime of belonging.
            </span>
          </div>
          <span className={styles.photoCaption}>Warriors / Together</span>
        </div>
      </section>
      <nav className={styles.sectionNav} aria-label="Explore this site">
        <a href="#our-story">Our story</a>
        {view.spotlights.length > 0 && <a href="#alumni">Alumni</a>}
        {view.events.length > 0 && <a href="#events">Events</a>}
        {view.campaigns.length > 0 && <a href="#support">Support</a>}
        {view.sponsors.length > 0 && <a href="#sponsors">Our partners</a>}
        {view.memberships && (
          <Link href={join}>
            Membership <Arrow />
          </Link>
        )}
      </nav>
      <section id="our-story" className={styles.story}>
        <div className={styles.storyIntro}>
          <p className={styles.eyebrow}>Roots here. Reach everywhere.</p>
          <h2>
            More than
            <br />
            <em>a season.</em>
          </h2>
        </div>
        <div className={styles.storyBody}>
          <p className={styles.lead}>
            You don’t stop being a Warrior when the final whistle blows.
          </p>
          <p>
            Former players. Proud families. Coaches, volunteers, and fans. This
            is a place to keep that connection alive—and help the next
            generation find theirs.
          </p>
        </div>
        <span className={styles.storyWatermark} aria-hidden="true">
          W
        </span>
      </section>
      {content.impactStats.length > 0 && (
        <div className={styles.stats}>
          {content.impactStats
            .filter((s) => s.value && s.label)
            .map((s) => (
              <div key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
        </div>
      )}
      {sections.map((s) => renderSection(s.section_key))}
      <Footer client={client} content={content} home={home} />
    </main>
  );
}

export function UnitySuccess({
  client,
  content,
}: {
  client: Client;
  content: SiteContent;
}) {
  return (
    <main className={styles.site} style={theme(content)}>
      <Header client={client} content={content} home="/" preview={false} />
      <section className={styles.success}>
        <span className={styles.thanksScript} aria-hidden="true">
          Thank you
        </span>
        <Mark content={content} large />
        <p className={styles.eyebrow}>Membership complete</p>
        <h1>
          You’re part of
          <br />
          <em>what comes next.</em>
        </h1>
        <p>
          Thank you for supporting {client.name} and keeping this community
          connected.
        </p>
        <Link href="/" className={styles.button}>
          Back to the Warriors <Arrow />
        </Link>
      </section>
      <Footer client={client} content={content} home="/" />
    </main>
  );
}
