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
    id: "lingopraxis_company_profile",
    category: "company",
    query:
      "LingoPraxis language exchange app company official website users growth App Store Google Play Product Hunt LinkedIn",
  },
  {
    id: "lingopraxis_news_growth",
    category: "news",
    query:
      "LingoPraxis app launch funding users growth language exchange 2024 2025 2026 Product Hunt App Store Telegram Zoom Google Meet",
  },
  {
    id: "lingopraxis_official_social",
    category: "company",
    query:
      "LingoPraxis official website App Store Google Play LinkedIn Instagram Telegram Product Hunt language exchange speaking club",
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
    results: (body.results ?? []).map((result) => ({
      title: result.title ?? "Untitled",
      url: result.url,
      publishedDate: result.publishedDate ?? null,
      author: result.author ?? null,
      highlight: (result.highlights ?? []).join(" ").replace(/\s+/g, " ").slice(0, 520),
    })),
    costDollars: body.costDollars,
  };
}

const startedAt = new Date().toISOString();
const runs = [];
for (const search of searches) {
  runs.push(await runSearch(search));
}

const artifact = {
  generatedAt: new Date().toISOString(),
  startedAt,
  source: "https://api.exa.ai/search",
  purpose:
    "Targeted Exa company/news pass for the remaining LingoPraxis language-exchange watchlist item, focused on official evidence, consumer-social strength, growth, funding, and whether it should upgrade to the HelloTalk/Tandem-adjacent main table.",
  searches: runs,
};

await mkdir(new URL("../data", import.meta.url), { recursive: true });
await writeFile(new URL("../data/exa-lingopraxis-deep-dive.json", import.meta.url), `${JSON.stringify(artifact, null, 2)}\n`);

console.log(JSON.stringify({
  ok: runs.every((run) => run.ok),
  searches: runs.map((run) => ({
    id: run.id,
    category: run.category,
    ok: run.ok,
    status: run.status,
    resultCount: run.results.length,
    requestId: run.requestId,
  })),
}, null, 2));
