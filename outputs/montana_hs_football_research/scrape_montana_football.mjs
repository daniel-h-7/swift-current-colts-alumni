import fs from "node:fs/promises";

const divisions = [
  ["Class AA", "https://www.maxpreps.com/mt/football/25-26/class/class-aa/?statedivisionid=a1fa107e-216d-4902-ab91-63c576c9973e"],
  ["Class A", "https://www.maxpreps.com/mt/football/25-26/class/class-a/?statedivisionid=98c9e275-08d1-440e-920a-614a43abf61d"],
  ["Class B", "https://www.maxpreps.com/mt/football/25-26/class/class-b/?statedivisionid=3c948089-c718-424a-95d1-30b2831e2d66"],
  ["Class C 8-Man", "https://www.maxpreps.com/mt/football/25-26/class/class-c-8-man/?statedivisionid=c7d72539-5477-46fc-8122-b3241c0f3fb6"],
  ["Class C 6-Man", "https://www.maxpreps.com/mt/football/25-26/class/class-c-6-man/?statedivisionid=f138340b-b102-4d09-9aa1-c4a87dddc11f&teamsize=8"],
];

const cityOverrides = {
  "Billings West": ["Billings", "MT"],
  "Billings Senior": ["Billings", "MT"],
  "Billings Central Catholic": ["Billings", "MT"],
  "Big Sky": ["Missoula", "MT"],
  "Sentinel": ["Missoula", "MT"],
  "Hellgate": ["Missoula", "MT"],
  "Russell": ["Great Falls", "MT"],
  "Capital": ["Helena", "MT"],
  "Glacier": ["Kalispell", "MT"],
  "Flathead": ["Kalispell", "MT"],
  "Gallatin": ["Bozeman", "MT"],
  "Skyview": ["Billings", "MT"],
  "Beaverhead County": ["Dillon", "MT"],
  "Custer County": ["Miles City", "MT"],
  "Park": ["Livingston", "MT"],
  "Lincoln County": ["Eureka", "MT"],
  "Sweet Grass County": ["Big Timber", "MT"],
  "Huntley Project": ["Worden", "MT"],
  "Loyola-Sacred Heart": ["Missoula", "MT"],
  "Flint Creek co-op [Drummond/Granite]": ["Drummond", "MT"],
  "St. Ignatius": ["St. Ignatius", "MT"],
  "St. Regis": ["St. Regis", "MT"],
  "Chester-Joplin-Inverness": ["Chester", "MT"],
  "Grass Range/Winnett": ["Grass Range", "MT"],
  "Denton/Stanford/Geyser/Geraldine": ["Denton", "MT"],
  "Custer/Hysham/Melstone": ["Custer", "MT"],
  "Power/Dutton-Brady": ["Power", "MT"],
  "Lambert/Richey": ["Lambert", "MT"],
  "North Star": ["Rudyard", "MT"],
  "North Toole County": ["Sunburst", "MT"],
  "Roy/Winifred": ["Roy", "MT"],
  "Broadview/Lavina": ["Broadview", "MT"],
  "Garfield County": ["Jordan", "MT"],
  "Glasgow/Hinsdale/Nashua": ["Glasgow", "MT"],
  "Malta/Whitewater/Saco/Dodson": ["Malta", "MT"],
  "Whitehall/Harrison/Willow Creek": ["Whitehall", "MT"],
  "Wolf Point/Frazer/Lustre Christian": ["Wolf Point", "MT"],
  "Harlowton/Ryegate": ["Harlowton", "MT"],
  "Scobey/Opheim": ["Scobey", "MT"],
};

function htmlDecode(s) {
  return s.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function walk(value, cb, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  cb(value);
  if (Array.isArray(value)) {
    for (const item of value) walk(item, cb, seen);
  } else {
    for (const item of Object.values(value)) walk(item, cb, seen);
  }
}

function normalizeTeam(obj) {
  const schoolName = obj.schoolName || obj.name || obj.teamName;
  if (!schoolName || typeof schoolName !== "string") return null;
  if (schoolName.length > 80) return null;
  const city = obj.city || obj.schoolCity || obj.locationCity || "";
  const state = obj.state || obj.schoolState || obj.stateName || "";
  const mascot = obj.mascot || obj.schoolMascot || "";
  const url = obj.url || obj.teamUrl || obj.schoolUrl || obj.canonicalUrl || "";
  if (!obj.schoolName && !obj.teamName && !obj.mascot && !city && !url) return null;
  return { schoolName, city, state, mascot, maxprepsUrl: url };
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 research contact spreadsheet" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return await res.text();
}

async function teamsForDivision(division, url) {
  const html = await fetchText(url);
  const match = html.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error(`No Next data for ${division}`);
  const data = JSON.parse(htmlDecode(match[1]));
  const found = new Map();
  walk(data, (obj) => {
    const item = normalizeTeam(obj);
    if (!item) return;
    const name = item.schoolName.trim();
    if (/^(MaxPreps|Montana|High School Football|Class Division)/i.test(name)) return;
    const key = name.toLowerCase();
    if (!found.has(key)) found.set(key, item);
  });
  return [...found.values()].map((team) => {
    const override = cityOverrides[team.schoolName];
    const city = team.city || override?.[0] || "";
    const state = team.state || override?.[1] || "MT";
    return {
      school: team.schoolName,
      team: team.mascot || "",
      city,
      state,
      region: "Montana",
      division,
      coach: "",
      coachEmail: "",
      coachPhone: "",
      athleticsDirector: "",
      athleticsDirectorEmail: "",
      athleticsDirectorPhone: "",
      schoolTeamSite: "",
      sourceUrls: url,
      notes: team.maxprepsUrl ? `MaxPreps team URL: ${team.maxprepsUrl}` : "",
    };
  });
}

const all = [];
for (const [division, url] of divisions) {
  const teams = await teamsForDivision(division, url);
  const deduped = new Map();
  for (const team of teams) deduped.set(team.school.toLowerCase(), team);
  console.error(`${division}: ${deduped.size}`);
  all.push(...deduped.values());
}

await fs.writeFile("outputs/montana_hs_football_research/base_teams.json", JSON.stringify(all, null, 2));
console.log(JSON.stringify(all, null, 2));
