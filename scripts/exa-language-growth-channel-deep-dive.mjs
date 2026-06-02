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

const targets = [
  {
    id: "conversation_exchange_growth",
    productName: "Conversation Exchange",
    category: "company",
    dimension: "growth/channel evidence",
    query: "Conversation Exchange language exchange website app users traffic SEO app store social media growth",
  },
  {
    id: "sewayou_growth",
    productName: "SewaYou",
    category: "company",
    dimension: "growth/channel evidence",
    query: "SewaYou language exchange app nearby face to face users App Store Google Play growth social media",
  },
  {
    id: "talk4now_growth",
    productName: "Talk4Now",
    category: "company",
    dimension: "growth/channel evidence",
    query: "Talk4Now language exchange app users launch app store social media growth channel",
  },
  {
    id: "meetalk_growth",
    productName: "meeTalk",
    category: "company",
    dimension: "growth/channel evidence",
    query: "meeTalk language exchange app users app store google play social media growth channel",
  },
  {
    id: "langpal_growth",
    productName: "LangPal",
    category: "company",
    dimension: "growth/channel evidence",
    query: "LangPal AI language learning chat app users app store growth community",
  },
  {
    id: "matchalingua_growth",
    productName: "MatchaLingua",
    category: "company",
    dimension: "growth/channel evidence",
    query: "MatchaLingua language partners nearby app users launch app store social media",
  },
  {
    id: "roamchat_growth",
    productName: "RoamChat",
    category: "news",
    dimension: "growth/channel evidence",
    query: "RoamChat AI roaming social platform language translation launch users app store growth",
  },
  {
    id: "speakyparrot_growth",
    productName: "SpeakyParrot",
    category: "company",
    dimension: "growth/channel evidence",
    query: "SpeakyParrot native speaker language exchange app users live sessions growth app store",
  },
  {
    id: "fluently_growth",
    productName: "Fluently",
    category: "company",
    dimension: "growth/channel evidence",
    query: "Fluently chat live language exchange native speakers users app store growth social media",
  },
  {
    id: "lingbe_growth",
    productName: "Lingbe",
    category: "company",
    dimension: "growth/channel evidence",
    query: "Lingbe language exchange app users downloads app store google play growth native speakers",
  },
  {
    id: "slowly_growth",
    productName: "Slowly",
    category: "company",
    dimension: "growth/channel evidence",
    query: "Slowly pen pal app users downloads awards app store growth community language exchange",
  },
  {
    id: "lingopraxis_growth",
    productName: "LingoPraxis",
    category: "company",
    dimension: "growth/channel evidence",
    query: "LingoPraxis language exchange speaking club app store google play telegram users growth",
  },
];

async function runSearch(target) {
  const response = await fetchWithRetry("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query: target.query,
      type: "auto",
      category: target.category,
      numResults: 8,
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
      ...target,
      ok: false,
      status: response.status,
      error: body,
      results: [],
    };
  }

  return {
    ...target,
    ok: true,
    status: response.status,
    requestId: body.requestId,
    results: (body.results ?? []).map((result) => ({
      title: result.title ?? "Untitled",
      url: result.url,
      publishedDate: result.publishedDate ?? null,
      author: result.author ?? null,
      highlight: (result.highlights ?? []).join(" ").replace(/\s+/g, " ").slice(0, 420),
    })),
  };
}

const startedAt = new Date().toISOString();
const searches = [];
for (const target of targets) {
  searches.push(await runSearch(target));
}

const artifact = {
  generatedAt: new Date().toISOString(),
  startedAt,
  source: "https://api.exa.ai/search",
  purpose:
    "Targeted Exa growth/channel deep-dive for HelloTalk/Tandem-adjacent language products whose growth, acquisition channel, or official discovery evidence was still thin.",
  searches,
};

await mkdir(new URL("../data", import.meta.url), { recursive: true });
await writeFile(
  new URL("../data/exa-language-growth-channel-deep-dive.json", import.meta.url),
  `${JSON.stringify(artifact, null, 2)}\n`,
);

console.log(JSON.stringify({
  ok: searches.every((search) => search.ok),
  searches: searches.map((search) => ({
    id: search.id,
    productName: search.productName,
    category: search.category,
    ok: search.ok,
    status: search.status,
    resultCount: search.results.length,
    requestId: search.requestId,
  })),
}, null, 2));
