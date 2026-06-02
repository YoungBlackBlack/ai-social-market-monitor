import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fetchWithRetry } from "./fetch-with-retry.mjs";

const envText = await readFile(new URL("../.env", import.meta.url), "utf8");
const apiKey = envText
  .split(/\r?\n/)
  .map((line) => line.trim())
  .find((line) => line.startsWith("EXA_API_KEY="))
  ?.slice("EXA_API_KEY=".length)
  ?.replace(/^"|"$/g, "");

if (!apiKey) {
  throw new Error("Missing EXA_API_KEY in .env");
}

const scans = [
  {
    id: "ai_friend_wearables",
    label: "AI friend / wearable companion",
    category: "news",
    query:
      "2024 2025 2026 AI friend wearable companion app funding launch Friend Dot Limitless Bee Plaud pendant social AI companion consumer",
  },
  {
    id: "ai_native_social_networks",
    label: "AI-native social networks",
    category: "news",
    query:
      "2024 2025 2026 AI native social network app funding launch SocialAI Butterflies Status Daze Oasiz Series consumer social",
  },
  {
    id: "ai_dating_discovery",
    label: "AI dating / offline dating",
    category: "news",
    query:
      "2024 2025 2026 AI dating app offline dating anti swipe IRL singles events funding Breeze Thursday Hinge Bumble Tinder live events",
  },
  {
    id: "companion_long_tail",
    label: "AI companion long tail",
    category: "company",
    query:
      "AI companion roleplay apps company Candy AI CrushOn Janitor AI Lovescape FantasyGF Muah AI Kupid AI SoulFun users revenue 2025 2026",
  },
  {
    id: "irl_social_long_tail",
    label: "IRL social long tail",
    category: "company",
    query:
      "offline IRL social discovery app meet friends local activities dinners strangers 2024 2025 2026 Posh Luma 222 Timeleft Pie Aglow Meet5",
  },
  {
    id: "language_exchange_long_tail",
    label: "Language exchange long tail",
    category: "company",
    query:
      "HelloTalk Tandem alternatives language exchange social app native speaker voice chat Speaky Lingbe Lingopie Ling App 2024 2025 2026",
  },
  {
    id: "ai_social_games_funding",
    label: "AI social games / playable social funding",
    category: "news",
    query:
      "2024 2025 2026 AI social game playable social platform generative AI friends startup funding seed Series Oasiz Status AI Series Daze social entertainment",
  },
  {
    id: "ai_companion_funding_expansion",
    label: "AI companion funding expansion",
    category: "news",
    query:
      "2024 2025 2026 AI companion app raises funding seed Series revenue downloads Candy AI Kupid AI SoulFun FantasyGF Janitor AI CrushOn Dippy Tolan",
  },
  {
    id: "irl_social_funding_expansion",
    label: "IRL social funding expansion",
    category: "news",
    query:
      "2024 2025 2026 IRL social app raises funding seed Series events friends dinners strangers Partiful 222 Pie Timeleft Meet5 Posh Luma Aglow Life",
  },
  {
    id: "ai_dating_funding_expansion",
    label: "AI dating / matchmaking funding expansion",
    category: "news",
    query:
      "2024 2025 2026 AI dating app raises funding seed Series matchmaking anti swipe offline dates Sitch Breeze Thursday Bumble Tinder Hinge Stanford app",
  },
];

async function runSearch(scan) {
  const response = await fetchWithRetry("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query: scan.query,
      type: "auto",
      category: scan.category,
      numResults: 10,
      contents: {
        highlights: true,
      },
    }),
  });

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    return {
      ...scan,
      ok: false,
      status: response.status,
      error: body,
      results: [],
    };
  }

  return {
    ...scan,
    ok: true,
    status: response.status,
    requestId: body.requestId,
    results: (body.results ?? []).map((result) => ({
      title: result.title ?? "Untitled",
      url: result.url,
      publishedDate: result.publishedDate ?? null,
      author: result.author ?? null,
      highlight: (result.highlights ?? []).join(" ").replace(/\s+/g, " ").slice(0, 360),
    })),
  };
}

const startedAt = new Date().toISOString();
const results = [];
for (const scan of scans) {
  results.push(await runSearch(scan));
}

const artifact = {
  generatedAt: new Date().toISOString(),
  startedAt,
  source: "https://api.exa.ai/search",
  purpose:
    "Additional broad discovery scan for AI social, AI friend, AI dating, AI companion long tail, IRL social, and language-exchange blind spots.",
  scans: results,
};

await mkdir(new URL("../data", import.meta.url), { recursive: true });
await writeFile(new URL("../data/exa-discovery-scan.json", import.meta.url), `${JSON.stringify(artifact, null, 2)}\n`);

console.log(JSON.stringify({
  ok: true,
  scans: results.map((scan) => ({
    id: scan.id,
    category: scan.category,
    ok: scan.ok,
    status: scan.status,
    resultCount: scan.results.length,
    requestId: scan.requestId,
  })),
}, null, 2));
