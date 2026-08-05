import fs from "node:fs/promises";

const base = JSON.parse(await fs.readFile("outputs/montana_hs_football_research/base_teams.json", "utf8"))
  .filter((row) => !/^class-/i.test(row.school));
const strings = (await fs.readFile("outputs/montana_hs_football_research/opi_strings.txt", "utf8")).split(/\r?\n/);

const excludedHosts = [
  "maxpreps.com",
  "hudl.com",
  "facebook.com",
  "montanasports.com",
  "myteamscoop.com",
  "si.com",
  "on3.com",
  "msubobcats.com",
  "nfhsnetwork.com",
  "scorebooklive.com",
  "406mtsports.com",
  "gofan.co",
];

function clean(s = "") {
  return s.replace(/\s+/g, " ").trim();
}

function norm(s = "") {
  return clean(s)
    .toLowerCase()
    .replace(/\b(high|h|school|schl|hs|co|county|public|schools|k-12|k12|catholic|central|academy)\b/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseOpi() {
  const start = strings.findIndex((line) => line === "County Name");
  const records = [];
  for (let i = start + 18; i + 16 < strings.length; i += 17) {
    const chunk = strings.slice(i, i + 17).map(clean);
    if (!chunk[0] || chunk[16] !== "PUBLIC") continue;
    records.push({
      county: chunk[0],
      system: chunk[2],
      district: chunk[4],
      school: chunk[6],
      first: chunk[7],
      last: chunk[8],
      title: chunk[9],
      phone: chunk[10],
      fax: chunk[11],
      email: chunk[12],
      address: chunk[13],
      city: chunk[14],
      state: "MT",
      zip: chunk[15],
      source: "https://apps.opi.mt.gov/OPIReportingCenter/frmCentralDirectory.aspx?GradeType=HS&ProcName=procCentralDirectorySchoolStaffByDistrict&ScreenMsg=Database+of+all+the+high+schools+in+Montana&ScreenTitle=High+School&ShowReport=1",
    });
  }
  return records;
}

const opi = parseOpi();

function bestOpiMatch(team) {
  const n = norm(team.school);
  const city = norm(team.city);
  let best = null;
  let score = 0;
  for (const row of opi) {
    const candidates = [row.school, row.district, row.system].map(norm);
    let s = 0;
    if (city && norm(row.city) === city) s += 3;
    for (const c of candidates) {
      if (!c || !n) continue;
      if (c === n) s += 8;
      else if (c.includes(n) || n.includes(c)) s += 5;
      else {
        const parts = n.match(/[a-z0-9]{4,}/g) || [];
        s += parts.filter((p) => c.includes(p)).length;
      }
    }
    if (s > score) {
      score = s;
      best = row;
    }
  }
  return score >= 4 ? best : null;
}

async function ddg(query) {
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!res.ok) return [];
  const html = await res.text();
  const items = [];
  const anchors = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]+class='result-link'[^>]*>([\s\S]*?)<\/a>/g)];
  for (let i = 0; i < anchors.length; i++) {
    const m = anchors[i];
    const block = html.slice(m.index, anchors[i + 1]?.index ?? html.length);
    const snippet = block.match(/<td[^>]+class='result-snippet'[^>]*>([\s\S]*?)<\/td>/)?.[1] || "";
    const linkText = decodeHtml(block.match(/<span[^>]+class='link-text'[^>]*>([\s\S]*?)<\/span>/)?.[1] || m[1]);
    let href = linkText.startsWith("http") ? linkText : `https://${linkText}`;
    try {
      const u = new URL(href);
      href = u.href;
    } catch {}
    items.push({
      title: decodeHtml(m[2]),
      snippet: decodeHtml(snippet),
      url: href,
    });
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
  return items;
}

function isLikelyOfficial(item) {
  try {
    const host = new URL(item.url).hostname.replace(/^www\./, "");
    if (excludedHosts.some((bad) => host.includes(bad))) return false;
    const combined = `${item.title} ${item.snippet} ${item.url}`.toLowerCase();
    if (!/(football|athletic|activities|sports)/.test(combined)) return false;
    if (/(k12|schools?|district|google\.com\/.*school|activities|athletics|football)/.test(combined)) return true;
    return false;
  } catch {
    return false;
  }
}

function extractPersonEmail(text, labels) {
  const cleaned = clean(text);
  const email = cleaned.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  let person = "";
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*:?\\s*[-–]?\\s*([A-Z][A-Za-z.'-]+(?:\\s+[A-Z][A-Za-z.'-]+){0,3})`, "i");
    const match = cleaned.match(re);
    if (match) {
      person = clean(match[1].replace(/\bEmail\b.*$/i, ""));
      break;
    }
  }
  const phone = cleaned.match(/(?:\+?1[-.\s]?)?\(?406\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0] || "";
  return { person, email, phone };
}

async function fetchPageText(url) {
  try {
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" }, redirect: "follow" });
    if (!res.ok) return "";
    const ct = res.headers.get("content-type") || "";
    if (!/text|html|json/.test(ct)) return "";
    const html = await res.text();
    return decodeHtml(html).slice(0, 50000);
  } catch {
    return "";
  }
}

const enriched = [];
for (let idx = 0; idx < base.length; idx++) {
  const team = { ...base[idx] };
  const opiMatch = bestOpiMatch(team);
  if (opiMatch) {
    team.city ||= opiMatch.city;
    team.state ||= "MT";
    team.sourceUrls = [team.sourceUrls, opiMatch.source].filter(Boolean).join(" | ");
    team.notes = clean(`${team.notes} OPI match: ${opiMatch.school}; main school phone/email: ${opiMatch.phone} ${opiMatch.email}`.trim());
  }

  const city = team.city ? `${team.city} ` : "";
  const footballResults = await ddg(`${team.school} High School ${city}Montana football athletics`);
  const official = footballResults.find(isLikelyOfficial);
  for (const result of footballResults.slice(0, 8)) {
    const info = extractPersonEmail(`${result.title} ${result.snippet}`, ["Football Head Coach", "Head Coach", "Coach"]);
    if (info.person || info.email || info.phone) {
      team.coach ||= info.person;
      team.coachEmail ||= info.email;
      team.coachPhone ||= info.phone;
      team.sourceUrls = [team.sourceUrls, result.url].filter(Boolean).join(" | ");
      break;
    }
  }

  if (official) {
    team.schoolTeamSite = official.url;
    team.sourceUrls = [team.sourceUrls, official.url].filter(Boolean).join(" | ");
    const pageText = await fetchPageText(official.url);
    if (pageText) {
      const pageCoach = extractPersonEmail(pageText, ["Football Head Coach", "Head Coach", "Coach"]);
      team.coach ||= pageCoach.person;
      team.coachEmail ||= pageCoach.email;
      team.coachPhone ||= pageCoach.phone;
      const pageAd = extractPersonEmail(pageText, ["Athletic Director", "Activities Director", "Activities/Athletic Director"]);
      team.athleticsDirector ||= pageAd.person;
      team.athleticsDirectorEmail ||= pageAd.email;
      team.athleticsDirectorPhone ||= pageAd.phone;
    }
  }

  const adResults = await ddg(`${team.school} High School ${city}Montana athletic director email`);
  for (const result of adResults.slice(0, 4)) {
    const ad = extractPersonEmail(`${result.title} ${result.snippet}`, ["Athletic Director", "Activities Director", "Activities/Athletic Director"]);
    if (ad.person || ad.email || ad.phone) {
      team.athleticsDirector ||= ad.person;
      team.athleticsDirectorEmail ||= ad.email;
      team.athleticsDirectorPhone ||= ad.phone;
      team.sourceUrls = [team.sourceUrls, result.url].filter(Boolean).join(" | ");
      break;
    }
  }

  console.error(`${idx + 1}/${base.length} ${team.division} ${team.school}`);
  enriched.push(team);
}

await fs.writeFile("outputs/montana_hs_football_research/enriched_teams.json", JSON.stringify(enriched, null, 2));
console.log(JSON.stringify(enriched, null, 2));
