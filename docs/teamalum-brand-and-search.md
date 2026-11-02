# TeamAlum brand and search

## Assets

Generated with the built-in imagegen tool. The Apple Valley screenshot was used as a style reference for an original interlocking varsity TA monogram. No helmet, mascot or school-specific ornament is included.

Final prompt:

> Use case: logo-brand. Generate one clean original TeamAlum varsity monogram. The provided screenshot is a STYLE REFERENCE ONLY: look at the small interlocking school-letter logo at the upper left of the Apple Valley team header. Use that classic high-school athletic interlocking-letter feel, but create our own mark using ONLY capital "T" and "A". No helmet, no mascot, no horns, no tail, no circle, no shield, no words. Just two bold custom varsity slab-serif letters, physically interlocking/overlapping as one compact balanced emblem: T slightly upper-left, A slightly lower-right, both letters fully readable with clearly intentional over-under crossings. Gold (#c5a45b) letter faces, narrow cream keyline, thick black outer outline. Flat solid ink colors, crisp clean edges, retro high-school baseball-cap/football helmet decal style. No gradient, texture, shadows, 3D, bevel, distressing or mockup. Centered isolated mark on actual transparent background. Nearly square compact composition with safe clear margin. This is intended to be legible in a small website header and browser favicon. Exact letters: TA.

Source retained in the generated-images library; optimized project assets are `public/images/teamalum-monogram.png`, `teamalum-icon-96.png`, and `teamalum-apple-icon.png`. Multi-size browser fallback is `src/app/favicon.ico` (16, 32 and 48 pixels).

The homepage header and platform social preview use the monogram. Platform metadata includes a 96-pixel browser icon and Apple touch icon. Client site content/logos are preserved; the shared favicon fallback carries TeamAlum branding.

## Search configuration

The marketing homepage has a descriptive title, description, canonical URL, Open Graph/Twitter metadata, Organization and WebSite structured data with Team Alum as an alternate name, and natural visible brand wording. Canonical origin is `https://www.teamalum.com`. Structured data makes no invented review/rating or customer claims.

`/robots.txt` permits the public site and excludes private/utility paths. Studio and HQ layouts add noindex metadata. These directives are indexing hints, not access controls. The marketing `/sitemap.xml` lists only the public homepage; private beta creation and authenticated workspaces are excluded. Tenant and standalone responses do not advertise the marketing sitemap or assign its homepage canonical.

## After deployment

1. Verify the domain property `teamalum.com` in Google Search Console using its provided DNS TXT record. Keep existing DNS records; add Google's exact record.
2. Submit `https://www.teamalum.com/sitemap.xml` in Search Console.
3. Inspect `https://www.teamalum.com/` and request indexing; check Google's selected canonical and indexing status.
4. Watch searches for TeamAlum, Team Alum, alumni websites, alumni CRM and team fundraising. Publish useful real product/customer content as it becomes available and earn relevant links.

No Search Console account, DNS verification token or submission was configured in this change. Google controls indexing, search-result titles, favicon display and ranking; deployment does not guarantee placement or immediate updates. Favicons can also remain in browser caches until refreshed.

## Verification

86 automated tests and lint pass. Client-mode and final platform-mode webpack production builds passed. The final platform build was checked locally: homepage logo loaded; title, canonical, both brand names in structured data, PNG/ICO/touch icon links, robots rules and marketing sitemap were correct. Tenant sitemap omitted the marketing URL. Studio login emitted noindex/nofollow. The social preview returned HTTP 200 and was visually checked with the approved monogram. No live deployment or Search Console submission was performed.
