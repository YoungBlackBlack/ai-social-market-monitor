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

const searches = [
  {
    id: "language_social_profiles",
    query:
      "official website LinkedIn Instagram App Store Google Play HelloTalk Tandem Hilokal SewaYou language exchange app",
  },
  {
    id: "language_social_profiles_more",
    query:
      "official website LinkedIn Instagram App Store Google Play Slowly Linguado LangPal MatchaLingua Conversation Exchange language exchange app",
  },
  {
    id: "ai_companion_social_profiles",
    query:
      "official website LinkedIn Instagram TikTok X Discord App Store Google Play Character.AI Replika Chai Talkie Tolan Dippy PolyBuzz HiWaifu AI companion app",
  },
  {
    id: "irl_social_profiles",
    query:
      "official website LinkedIn Instagram TikTok X App Store 222 Pie Timeleft Partiful Breeze WeRoad MeetMux Aglow Life Paxmeet Thursday IRL social app",
  },
  {
    id: "ai_social_official_gap_profiles",
    query:
      "official website App Store Google Play LinkedIn Instagram Discord Status AI Butterflies AI Daze Shapes Born Pengu AI social app",
  },
  {
    id: "irl_official_gap_profiles",
    query:
      "official website App Store Google Play LinkedIn Instagram Meet5 Thursday Breeze Aglow Life Partiful WeRoad IRL dating social app",
  },
  {
    id: "language_long_tail_official_gap_profiles",
    query:
      "official website App Store Google Play LinkedIn Conversation Exchange Talk4Now meeTalk LangPal MatchaLingua FluentPal Lingbe SpeakyParrot Fluently language exchange app",
  },
  {
    id: "language_social_handles",
    query:
      "official Instagram TikTok X Twitter Facebook YouTube HelloTalk Tandem Hilokal SewaYou Slowly Linguado language exchange app social media",
  },
  {
    id: "ai_social_handles",
    query:
      "official Instagram TikTok X Twitter Discord YouTube Character.AI Replika Chai Talkie Dippy PolyBuzz Status AI Butterflies AI Daze social media",
  },
  {
    id: "irl_social_handles",
    query:
      "official Instagram TikTok X Twitter Facebook YouTube 222 Pie Timeleft Partiful Breeze WeRoad Meet5 Thursday IRL social app social media",
  },
];

async function runSearch(search) {
  const response = await fetchWithRetry("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query: search.query,
      type: "auto",
      numResults: 15,
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
      ...search,
      ok: false,
      status: response.status,
      error: body,
      results: [],
    };
  }

  return {
    ...search,
    ok: true,
    status: response.status,
    requestId: body.requestId,
    results: body.results ?? [],
    costDollars: body.costDollars,
  };
}

const runs = [];
for (const search of searches) {
  runs.push(await runSearch(search));
}

const artifact = {
  generatedAt: new Date().toISOString(),
  source: "https://api.exa.ai/search",
  searches: runs,
};

await mkdir(new URL("../data", import.meta.url), { recursive: true });
await writeFile(
  new URL("../data/exa-social-profiles.json", import.meta.url),
  JSON.stringify(artifact, null, 2),
);

console.log(JSON.stringify({
  ok: runs.every((run) => run.ok),
  searches: runs.map((run) => ({
    id: run.id,
    ok: run.ok,
    status: run.status,
    resultCount: run.results.length,
    requestId: run.requestId,
  })),
}, null, 2));
