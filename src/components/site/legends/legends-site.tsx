import { getLegendsCopy } from "@/lib/legends-copy";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { CSSProperties } from "react";
import type { SiteContent } from "@/lib/site-content";
import type { MembershipSettings } from "@/lib/membership-settings";
import type { SiteSection } from "@/lib/site-sections-shared";
import { SupportShareBar } from "@/components/support-share-bar";
import { JoinForm } from "@/components/join-form";
import { teamHubHref } from "@/lib/studio-navigation";
import {
  legendsColors,
  safeLegendsLink,
  legendsPresentation,
  legendsIdentity,
} from "@/lib/legends";
import styles from "./legends-site.module.css";

type Client = { id: string; name: string };
type Props = {
  client: Client;
  content: SiteContent;
  settings: MembershipSettings;
  features: { feature_key: string; is_enabled: boolean }[];
  sections: SiteSection[];
  preview?: boolean;
  showJoin?: boolean;
  manageHref?: string;
};

function theme(content: SiteContent) {
  const colors = legendsColors(
    content.brand.primaryColor,
    content.brand.accentColor,
  );
  return {
    "--legends-brand": colors.brand,
    "--legends-accent": colors.accent,
    "--legends-on-brand": colors.onBrand,
    "--legends-brand-ink": colors.ink,
  } as CSSProperties;
}
function Mark({
  content,
  large = false,
  surface = "light",
}: {
  content: SiteContent;
  large?: boolean;
  surface?: "light" | "dark";
}) {
  // Preserve the existing Rams mark while selecting its supplied light-surface variant.
  const logoUrl =
    surface === "light" &&
    content.brand.logoUrl === "/images/rmr-flat-logo-wht.png"
      ? "/images/rmr-flat-logo-blk.png"
      : content.brand.logoUrl;
  return logoUrl ? (
    <img
      src={logoUrl}
      alt={`${content.brand.siteTitle} logo`}
      className={large ? styles.largeLogo : styles.logo}
    />
  ) : (
    <span
      className={large ? styles.largeMonogram : styles.monogram}
      data-length={legendsIdentity(content.brand.siteTitle).initials.length}
      aria-label={content.brand.siteTitle}
    >
      {legendsIdentity(content.brand.siteTitle).initials}
      <span aria-hidden="true">/</span>
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
  const copy = getLegendsCopy(client.name, content.legends, client.id);
  return (
    <>
      {preview && (
        <div className={styles.preview}>
          Site preview <span>{client.name}</span>
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
            href={teamHubHref(client.id)}
          >
            ADMIN
          </Link>
          {join ? (
            <Link className={styles.button} href={join}>
              {copy.supportButton} <Arrow />
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
  const copy = getLegendsCopy(client.name, content.legends, client.id);
  return (
    <footer className={styles.footer}>
      <Link href={home} className={styles.identity}>
        <Mark content={content} />
        <strong>{client.name}</strong>
      </Link>
      <p style={{ whiteSpace: "pre-line" }}>{copy.footerBody}</p>
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
  content,
  client,
}: {
  content: SiteContent;
  client: Client;
  settings: MembershipSettings;
  join: string;
}) {
  const copy = getLegendsCopy(client.name, content.legends, client.id);
  return (
    <section id="membership" className={styles.invite}>
      <div className={styles.inviteInner}>
        <p className={styles.eyebrow}>{copy.inviteEyebrow}</p>
        <h2>
          {copy.inviteTitle}
          <br />
          <em>{copy.inviteAccent}</em>
        </h2>
        <div className={styles.inviteBottom}>
          <p>{copy.inviteBody}</p>
          <div>
            <span className={styles.price}>
              <Amount settings={settings} />
              <small>/ year</small>
            </span>
            <Link className={styles.button} href={join}>
              {settings.join_is_open ? copy.supportButton : "View membership"}{" "}
              <Arrow />
            </Link>
          </div>
        </div>
      </div>
      <span className={styles.inviteMark} aria-hidden="true">
        {legendsIdentity(content.brand.siteTitle).watermark}
      </span>
    </section>
  );
}

export function LegendsSite({
  client,
  content,
  settings,
  features,
  sections,
  preview = false,
  showJoin = false,
  manageHref,
}: Props) {
  const copy = getLegendsCopy(client.name, content.legends, client.id);
  const view = legendsPresentation(content, features, sections);
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
      <main data-legends-page className={styles.site} style={theme(content)}>
        <Header
          client={client}
          content={content}
          home={home}
          preview={preview}
        />
        <div className={styles.joinLayout}>
          <aside className={styles.joinAside}>
            <Link href={home} className={styles.textLink}>
              ← Back home
            </Link>
            <p className={styles.eyebrow}>{copy.joinEyebrow}</p>
            <h1>
              {copy.joinTitle}
              <br />
              <em>{copy.joinAccent}</em>
            </h1>
            <Mark content={content} large />
            <p>{copy.joinBody}</p>
            <div className={styles.joinPrice}>
              <Amount settings={settings} />
              <small>
                Annual membership · {settings.membership_year_label}
              </small>
            </div>
            {manageHref && (
              <Link className={styles.textLink} href={manageHref}>
                Manage or cancel your membership
              </Link>
            )}
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
                legendsColors(brand.primaryColor, brand.accentColor).brand
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
              <p className={styles.eyebrow}>{copy.sponsorsEyebrow}</p>
              <h2>
                {copy.sponsorsTitle} <em>{copy.sponsorsAccent}</em>
              </h2>
            </div>
            <p>{copy.sponsorsBody}</p>
          </div>
          <div className={styles.sponsorLogos}>
            {view.sponsors.map((s) => {
              const href = safeLegendsLink(s.linkUrl);
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
              <p className={styles.eyebrow}>{copy.alumniEyebrow}</p>
              <h2>
                {copy.alumniTitle} <em>{copy.alumniAccent}</em>
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
                    {s.classYear || "Our community"}
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
              <p className={styles.eyebrow}>{copy.eventsEyebrow}</p>
              <h2>
                {copy.eventsTitle} <em>{copy.eventsAccent}</em>
              </h2>
            </div>
            <p>{copy.eventsBody}</p>
          </div>
          <div className={styles.eventList}>
            {view.events.map((e, i) => {
              const href = safeLegendsLink(e.linkUrl);
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
            const href = safeLegendsLink(c.buttonUrl);
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
      return (
        <MembershipInvite
          key={key}
          settings={settings}
          join={join}
          content={content}
          client={client}
        />
      );
    return null;
  }
  return (
    <main data-legends-page className={styles.site} style={theme(content)}>
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
            {brand.heroKicker || `${client.name} · Alumni & supporters`}
          </p>
          <h1>
            {starterTitle ? (
              <>
                {client.id === "unity-warriors"
                  ? "Once a Warrior."
                  : "Your team."}
                <br />
                <em>
                  {client.id === "unity-warriors"
                    ? "Always a Warrior."
                    : "Your next chapter."}
                </em>
              </>
            ) : (
              brand.heroTitle
            )}
          </h1>
          <p>
            {starterBody
              ? "The game brings us together. Our community keeps us connected. A home for everyone who carries this program with them."
              : brand.heroBody}
          </p>
          <div className={styles.heroActions}>
            {view.memberships ? (
              <Link className={styles.button} href={join}>
                {copy.supportButton} <Arrow />
              </Link>
            ) : (
              <a className={styles.textLink} href="#our-story">
                Meet your community <Arrow />
              </a>
            )}
            <a href="#our-story" className={styles.textLink}>
              {copy.storyMenu} <span aria-hidden="true">↓</span>
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
            {legendsIdentity(brand.siteTitle).photoWord}
          </span>
          <div className={styles.heroEmblem}>
            <Mark content={content} large surface="dark" />
            <span style={{ whiteSpace: "pre-line" }}>{copy.heroBadge}</span>
          </div>
          <span className={styles.photoCaption}>{copy.heroCaption}</span>
        </div>
      </section>
      <nav className={styles.sectionNav} aria-label="Explore this site">
        <a href="#our-story">{copy.storyMenu}</a>
        {view.spotlights.length > 0 && <a href="#alumni">{copy.alumniMenu}</a>}
        {view.events.length > 0 && <a href="#events">{copy.eventsMenu}</a>}
        {view.campaigns.length > 0 && (
          <a href="#support">{copy.campaignsMenu}</a>
        )}
        {view.sponsors.length > 0 && (
          <a href="#sponsors">{copy.sponsorsMenu}</a>
        )}
        {view.memberships && (
          <Link href={join}>
            {copy.supportMenu} <Arrow />
          </Link>
        )}
      </nav>
      <section id="our-story" className={styles.story}>
        <div className={styles.storyIntro}>
          <p className={styles.eyebrow}>{copy.storyEyebrow}</p>
          <h2>
            {copy.storyTitle}
            <br />
            <em>{copy.storyAccent}</em>
          </h2>
        </div>
        <div className={styles.storyBody}>
          <p className={styles.lead}>{copy.storyLead}</p>
          <p>{copy.storyBody}</p>
        </div>
        <span className={styles.storyWatermark} aria-hidden="true">
          {legendsIdentity(content.brand.siteTitle).watermark}
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

export function LegendsSuccess({
  client,
  content,
  manageHref,
}: {
  client: Client;
  content: SiteContent;
  manageHref?: string;
}) {
  const copy = getLegendsCopy(client.name, content.legends, client.id);
  return (
    <main data-legends-page className={styles.site} style={theme(content)}>
      <Header client={client} content={content} home="/" preview={false} />
      <section className={styles.success}>
        <span className={styles.thanksScript} aria-hidden="true">
          Thank you
        </span>
        <Mark content={content} large />
        <p className={styles.eyebrow}>Membership complete</p>
        <h1>
          {copy.successTitle}
          <br />
          <em>{copy.successAccent}</em>
        </h1>
        <p>{copy.successBody}</p>
        <Link href="/" className={styles.button}>
          Back home <Arrow />
        </Link>
        {manageHref && (
          <Link className={styles.textLink} href={manageHref}>
            Manage your membership
          </Link>
        )}
        <div className={styles.share}>
          <SupportShareBar
            shareText={`Join me in supporting ${client.name} and our alumni community.`}
          />
        </div>
      </section>
      <Footer client={client} content={content} home="/" />
    </main>
  );
}
