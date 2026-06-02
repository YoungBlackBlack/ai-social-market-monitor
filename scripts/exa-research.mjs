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
    id: "language_exchange_companies",
    category: "company",
    query:
      "companies and apps similar to HelloTalk and Tandem for language exchange social networking native speaker chat voice rooms pen pals",
  },
  {
    id: "language_exchange_growth_signals",
    category: "news",
    query:
      "HelloTalk Tandem Lingbe Speaky Slowly SewaYou Hilokal language exchange app users growth social features voice rooms 2024 2025 2026",
  },
  {
    id: "new_language_exchange_companies",
    category: "company",
    query:
      "new language exchange social apps 2024 2025 2026 similar to HelloTalk Tandem SewaYou Hilokal Slowly Linguado LangPal MatchaLingua native speaker matching nearby cultural exchange",
  },
  {
    id: "ai_social_funding_news",
    category: "news",
    query:
      "AI social app AI companion consumer social entertainment startup funding 2024 2025 2026 Butterflies Daze Dippy Tolan Pengu Status AI",
  },
  {
    id: "ai_companion_roleplay_funding_news",
    category: "news",
    query:
      "AI companion roleplay app funding 2024 2025 2026 Replika Character.AI Nomi Kindroid PolyBuzz Chai Talkie MiniMax Linky HiWaifu Oh Dippy",
  },
  {
    id: "mature_ai_companion_products",
    category: "company",
    query:
      "AI companion apps Replika Character.AI Nomi Kindroid Chai PolyBuzz Talkie Linky HiWaifu CrushOn Janitor AI company product users revenue",
  },
  {
    id: "mature_ai_companion_news",
    category: "news",
    query:
      "Replika Character.AI Nomi Kindroid Chai PolyBuzz Talkie Linky HiWaifu CrushOn Janitor AI funding revenue growth safety news 2024 2025 2026",
  },
  {
    id: "china_ai_companion_exports",
    category: "news",
    query:
      "Chinese AI companion app overseas Talkie MiniMax PolyBuzz Linky HiWaifu Oh AI roleplay app downloads revenue funding 2024 2025 2026",
  },
  {
    id: "ai_social_entertainment_news",
    category: "news",
    query:
      "AI social network interactive entertainment app funding 2024 2025 2026 Butterflies Status AI Series Oasiz Daze social media RPG fanfiction",
  },
  {
    id: "offline_ai_social_news",
    category: "news",
    query:
      "AI powered offline social app funding IRL friends dinner strangers meetups 222 Pie Timeleft 2024 2025 2026",
  },
  {
    id: "offline_social_discovery_companies",
    category: "company",
    query:
      "offline social discovery apps meet new friends IRL dinner strangers events algorithm matching 222 Pie Timeleft Saturday Plots Partiful",
  },
  {
    id: "offline_events_boundary_news",
    category: "news",
    query:
      "IRL social events app funding 2024 2025 2026 Partiful Plots Saturday 222 Pie Timeleft friends events meetup social discovery",
  },
  {
    id: "ai_dating_irl_news",
    category: "news",
    query:
      "AI dating app offline dates anti swiping IRL meetups funding launch 2024 2025 2026 Breeze Hinge Tinder Bumble Thursday dating app",
  },
  {
    id: "group_travel_irl_news",
    category: "news",
    query:
      "group travel social app funding 2024 2025 2026 WeRoad Airbnb millennials Gen Z strangers travel friends community",
  },
  {
    id: "local_activity_social_companies",
    category: "company",
    query:
      "local activity social apps meet new friends over 40 Gen X group activities IRL social app Meet5 Aglow Luma Posh Plots Saturday",
  },
  {
    id: "offline_social_company_boundary",
    category: "company",
    query:
      "companies offline social app events meetups friends Partiful Plots Saturday Posh Luma Timeleft 222 Pie AI matching",
  },
  {
    id: "ai_companion_research",
    category: "research paper",
    query:
      "AI companion social relationships loneliness teens Replika Character.AI Nomi research paper 2024 2025 2026",
  },
  {
    id: "offline_loneliness_research",
    category: "research paper",
    query:
      "offline social connection loneliness social apps algorithmic matching in-person meetups research 2024 2025 2026",
  },
  {
    id: "consumer_ai_financial_reports",
    category: "financial report",
    query:
      "AI companion apps revenue report 2025 Character.AI Replika PolyBuzz Chai Talkie Pengu consumer AI app market",
  },
  {
    id: "app_market_reports",
    category: "financial report",
    query:
      "consumer AI app market report AI companion app revenue downloads 2024 2025 Sensor Tower Appfigures data.ai financial report",
  },
  {
    id: "consumer_ai_app_rankings",
    category: "financial report",
    query:
      "top consumer generative AI apps rankings AI companion mobile app downloads revenue report 2025 2026 Andreessen Sensor Tower Appfigures",
  },
  {
    id: "ai_social_revenue_download_reports",
    category: "financial report",
    query:
      "AI social app AI companion app revenue downloads report 2026 China overseas Talkie PolyBuzz HiWaifu Linky Character.AI Replika Sensor Tower Appfigures",
  },
  {
    id: "founder_people_background",
    category: "people",
    query:
      "founders of AI social apps 222 Pie Butterflies Daze Status AI Tolan Born Pengu background investors",
  },
  {
    id: "offline_social_founders_people",
    category: "people",
    query:
      "founders 222 Pie Timeleft offline social app AI matching friends dinner strangers founder background investors",
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
      category: search.category,
      numResults: 12,
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
      body,
    };
  }

  return {
    ...search,
    ok: true,
    status: response.status,
    searchType: body.searchType,
    requestId: body.requestId,
    results: body.results ?? [],
    costDollars: body.costDollars,
  };
}

await mkdir(new URL("../data", import.meta.url), { recursive: true });

const startedAt = new Date().toISOString();
const results = [];
for (const search of searches) {
  results.push(await runSearch(search));
}

const artifact = {
  generatedAt: new Date().toISOString(),
  startedAt,
  source: "https://api.exa.ai/search",
  searches: results,
};

await writeFile(
  new URL("../data/exa-results.json", import.meta.url),
  JSON.stringify(artifact, null, 2),
);

const summary = results.map((item) => ({
  id: item.id,
  category: item.category,
  ok: item.ok,
  status: item.status,
  resultCount: item.results?.length ?? 0,
  requestId: item.requestId,
}));

console.log(JSON.stringify(summary, null, 2));
