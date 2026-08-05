import fs from "node:fs/promises";

const baseRows = JSON.parse(await fs.readFile("outputs/montana_hs_football_research/base_teams.json", "utf8"))
  .filter((row) => !/^class-/i.test(row.school));

const fullNameOverrides = {
  Bozeman: "Bozeman High School",
  Glacier: "Glacier High School",
  Skyview: "Billings Skyview High School",
  "Billings West": "Billings West High School",
  Gallatin: "Gallatin High School",
  "Big Sky": "Missoula Big Sky High School",
  Sentinel: "Missoula Sentinel High School",
  Russell: "C.M. Russell High School",
  Helena: "Helena High School",
  "Great Falls": "Great Falls High School",
  Butte: "Butte High School",
  Hellgate: "Missoula Hellgate High School",
  Flathead: "Flathead High School",
  Capital: "Helena Capital High School",
  "Billings Senior": "Billings Senior High School",
  Belgrade: "Belgrade High School",
  "East Helena": "East Helena High School",
  Frenchtown: "Frenchtown High School",
  "Custer County": "Custer County District High School",
  Laurel: "Laurel High School",
  "Columbia Falls": "Columbia Falls High School",
  "Billings Central Catholic": "Billings Central Catholic High School",
  Hamilton: "Hamilton High School",
  Whitefish: "Whitefish High School",
  Fergus: "Fergus High School",
  Sidney: "Sidney High School",
  Bigfork: "Bigfork High School",
  "Butte Central Catholic": "Butte Central Catholic High School",
  Libby: "Libby High School",
  "Dawson County": "Dawson County High School",
  Havre: "Havre High School",
  Polson: "Polson High School",
  Lockwood: "Lockwood High School",
  Hardin: "Hardin High School",
  "Beaverhead County": "Beaverhead County High School",
  Corvallis: "Corvallis High School",
  Browning: "Browning High School",
  Stevensville: "Stevensville High School",
  Park: "Park High School",
  Ronan: "Ronan High School",
  Jefferson: "Jefferson High School",
  "Lincoln County": "Lincoln County High School",
  "Sweet Grass County": "Sweet Grass County High School",
  "Loyola-Sacred Heart": "Loyola Sacred Heart High School",
  "St. Ignatius": "St. Ignatius High School",
  "St. Regis": "St. Regis High School",
  "Manhattan Christian": "Manhattan Christian High School",
  "Valley Christian": "Valley Christian School",
  "St. Patrick's Academy": "St. Patrick's Academy",
  "Powder River County": "Powder River County District High School",
  "Plenty Coups": "Plenty Coups High School",
  "Hays-Lodge Pole": "Hays-Lodge Pole High School",
};

const cityOverrides = {
  "Billings West": "Billings",
  "Billings Senior": "Billings",
  "Billings Central Catholic": "Billings",
  "Big Sky": "Missoula",
  Sentinel: "Missoula",
  Hellgate: "Missoula",
  Russell: "Great Falls",
  Capital: "Helena",
  Glacier: "Kalispell",
  Flathead: "Kalispell",
  Gallatin: "Bozeman",
  Skyview: "Billings",
};

const disallowedHosts = [
  "maxpreps.com", "hudl.com", "facebook.com", "instagram.com", "x.com", "twitter.com",
  "montanasports.com", "406mtsports.com", "scorebooklive.com", "si.com", "on3.com",
  "nfhsnetwork.com", "gofan.co", "myteamscoop.com", "ncsasports.org", "usatodayhss.com",
  "athletic.net", "milesplit.com", "wikipedia.org", "youtube.com", "espn.com",
];

function clean(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function decodeHtml(s = "") {
  return clean(s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " "));
}

function fullSchoolName(shortName) {
  if (fullNameOverrides[shortName]) return fullNameOverrides[shortName];
  if (shortName.includes("/")) return `${shortName} High School Football Co-op`;
  if (/school|academy/i.test(shortName)) return shortName;
  return `${shortName} High School`;
}

function isOfficialUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (disallowedHosts.some((bad) => host.includes(bad))) return false;
    const full = `${host}${u.pathname}`.toLowerCase();
    return (
      /\.k12\.mt\.us$/.test(host) ||
      host.includes("k12") ||
      host.includes("school") ||
      host.includes("district") ||
      host.includes("bsd7.org") ||
      host.includes("billingsschools.org") ||
      host.includes("sd5.k12.mt.us") ||
      host.includes("sites.google.com") ||
      full.includes("activities") ||
      full.includes("athletics")
    );
  } catch {
    return false;
  }
}

async function ddg(query) {
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!res.ok) return [];
  const html = await res.text();
  const anchors = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]+class='result-link'[^>]*>([\s\S]*?)<\/a>/g)];
  const items = [];
  for (let i = 0; i < anchors.length; i++) {
    const m = anchors[i];
    const block = html.slice(m.index, anchors[i + 1]?.index ?? html.length);
    const linkText = decodeHtml(block.match(/<span[^>]+class='link-text'[^>]*>([\s\S]*?)<\/span>/)?.[1] || m[1]);
    const snippet = decodeHtml(block.match(/<td[^>]+class='result-snippet'[^>]*>([\s\S]*?)<\/td>/)?.[1] || "");
    const url = linkText.startsWith("http") ? linkText : `https://${linkText}`;
    items.push({ title: decodeHtml(m[2]), snippet, url });
  }
  await new Promise((resolve) => setTimeout(resolve, 175));
  return items;
}

async function fetchText(url) {
  try {
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" }, redirect: "follow" });
    if (!res.ok) return "";
    const contentType = res.headers.get("content-type") || "";
    if (!/html|text|json/i.test(contentType)) return "";
    return decodeHtml((await res.text()).slice(0, 250000));
  } catch {
    return "";
  }
}

function firstEmailNear(text, name) {
  if (!name) return "";
  const compact = clean(text);
  const idx = compact.toLowerCase().indexOf(name.toLowerCase());
  const window = idx >= 0 ? compact.slice(Math.max(0, idx - 500), idx + 1200) : compact;
  return window.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
}

function extractNameAfter(text, labels) {
  const compact = clean(text);
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*:?\\s*(?:-|–)?\\s*([A-Z][A-Za-z.'-]+(?:\\s+[A-Z][A-Za-z.'-]+){1,3})`, "i");
    const match = compact.match(re);
    if (match) {
      return clean(match[1].replace(/\b(Email|Phone|Ext|Important|Football)\b.*$/i, ""));
    }
  }
  return "";
}

function extractPhoneNear(text, name) {
  const compact = clean(text);
  const idx = name ? compact.toLowerCase().indexOf(name.toLowerCase()) : -1;
  const window = idx >= 0 ? compact.slice(Math.max(0, idx - 500), idx + 1200) : compact;
  return window.match(/(?:\+?1[-.\s]?)?\(?406\)?[-.\s]?\d{3}[-.\s]?\d{4}(?:\s*(?:x|ext\.?)\s*\d{2,6})?/i)?.[0] || "";
}

function pickOfficialResults(results) {
  return results.filter((item) => isOfficialUrl(item.url)).slice(0, 5);
}

async function resolveFor(row) {
  const fullName = fullSchoolName(row.school);
  const city = row.city || cityOverrides[row.school] || "";
  const out = {
    school: fullName,
    team: row.team || "",
    city,
    state: "MT",
    region: "Montana",
    division: row.division,
    coach_name: "",
    coach_email: "",
    coach_phone: "",
    athletics_director_name: "",
    athletics_director_email: "",
    athletics_director_phone: "",
    school_website: "",
    source_urls: "",
    notes: "",
  };

  const queries = [
    `${fullName} ${city} Montana football head coach email`,
    `${fullName} ${city} Montana athletics football`,
    `${fullName} ${city} Montana athletic director email`,
    `${fullName} ${city} Montana staff directory football coach`,
  ];

  const official = [];
  const seen = new Set();
  for (const query of queries) {
    const results = pickOfficialResults(await ddg(query));
    for (const result of results) {
      if (!seen.has(result.url)) {
        seen.add(result.url);
        official.push(result);
      }
    }
  }

  for (const result of official) {
    const combined = `${result.title} ${result.snippet}`;
    const lower = combined.toLowerCase();
    if (!out.school_website && /(school|high|activities|athletics|football)/i.test(combined)) out.school_website = result.url;
    if (!out.coach_name && /football|head coach|coach/i.test(combined)) {
      out.coach_name = extractNameAfter(combined, ["Football Head Coach", "Head Coach", "Football Coach", "Coach"]);
    }
    if (!out.athletics_director_name && /athletic|activities director|activities coordinator/i.test(combined)) {
      out.athletics_director_name = extractNameAfter(combined, ["Athletic Director", "Activities Director", "Activities Coordinator", "Athletics Director"]);
    }
    if (!out.coach_email && /football|coach/i.test(lower)) out.coach_email = firstEmailNear(combined, out.coach_name) || combined.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
    if (!out.athletics_director_email && /athletic|activities/i.test(lower)) out.athletics_director_email = firstEmailNear(combined, out.athletics_director_name) || combined.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  }

  for (const result of official.slice(0, 4)) {
    if (out.coach_email && out.athletics_director_email) break;
    const text = await fetchText(result.url);
    if (!text) continue;
    if (!out.coach_name) out.coach_name = extractNameAfter(text, ["Football Head Coach", "Head Coach", "Football Coach"]);
    if (!out.coach_email) out.coach_email = firstEmailNear(text, out.coach_name || "football");
    if (!out.coach_phone) out.coach_phone = extractPhoneNear(text, out.coach_name);
    if (!out.athletics_director_name) out.athletics_director_name = extractNameAfter(text, ["Athletic Director", "Activities Director", "Activities Coordinator", "Athletics Director"]);
    if (!out.athletics_director_email) out.athletics_director_email = firstEmailNear(text, out.athletics_director_name || "athletic director");
    if (!out.athletics_director_phone) out.athletics_director_phone = extractPhoneNear(text, out.athletics_director_name);
  }

  out.source_urls = official.map((item) => item.url).slice(0, 6).join(" | ");
  return out;
}

const rows = [];
for (let i = 0; i < baseRows.length; i++) {
  const resolved = await resolveFor(baseRows[i]);
  rows.push(resolved);
  console.error(`${i + 1}/${baseRows.length} ${resolved.school}`);
}

const headers = [
  "school", "team", "city", "state", "region", "division",
  "coach_name", "coach_email", "coach_phone",
  "athletics_director_name", "athletics_director_email", "athletics_director_phone",
  "school_website", "source_urls", "notes",
];

function csvCell(v = "") {
  const s = clean(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const csv = [headers.join(","), ...rows.map((row) => headers.map((h) => csvCell(row[h])).join(","))].join("\n") + "\n";
await fs.writeFile("outputs/montana_hs_football_research/montana_hs_football_official_crm_seed.csv", csv);
await fs.writeFile("outputs/montana_hs_football_research/official_school_search_rows.json", JSON.stringify(rows, null, 2));

const counts = Object.fromEntries(headers.map((h) => [h, rows.filter((r) => r[h]).length]));
console.log(JSON.stringify({ rows: rows.length, counts }, null, 2));
