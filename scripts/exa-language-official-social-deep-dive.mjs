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
  ["Tandem", "Tandem language exchange app LinkedIn Instagram TikTok Facebook X App Store Google Play official"],
  ["Hilokal", "Hilokal language exchange app LinkedIn Instagram TikTok Facebook X App Store Google Play official"],
  ["SewaYou", "SewaYou language exchange app LinkedIn Instagram TikTok Facebook X App Store Google Play official"],
  ["Conversation Exchange", "\"Conversation Exchange\" language exchange LinkedIn Facebook Instagram X official website conversationexchange.com"],
  ["Talk4Now", "\"Talk4Now\" language exchange LinkedIn Instagram Facebook X official app store talk4now.com"],
  ["meeTalk", "meeTalk language exchange app LinkedIn Instagram Facebook Google Play official"],
  ["LangPal", "LangPal language app LinkedIn Instagram TikTok App Store Google Play official"],
  ["MatchaLingua", "\"MatchaLingua\" language exchange LinkedIn Instagram Facebook App Store Google Play official"],
  ["Slowly", "Slowly app LinkedIn Instagram Facebook X App Store Google Play official"],
  ["FluentPal", "\"FluentPal\" language app LinkedIn Instagram TikTok App Store Google Play official"],
  ["RoamChat", "\"RoamChat\" AI roaming social platform LinkedIn Instagram X App Store Google Play official RoamChat"],
  ["Lingbe", "Lingbe language exchange app LinkedIn Instagram Facebook X App Store Google Play official"],
  ["SpeakyParrot", "\"SpeakyParrot\" language exchange app LinkedIn Instagram Facebook App Store Google Play official speakyparrot.com"],
  ["Fluently", "Fluently chat language exchange LinkedIn Instagram TikTok App Store Google Play official"],
];

async function runSearch([productName, query]) {
  const response = await fetchWithRetry("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query,
      type: "auto",
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

  const id = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  if (!response.ok) {
    return {
      id,
      productName,
      query,
      ok: false,
      status: response.status,
      error: body,
      results: [],
    };
  }

  return {
    id,
    productName,
    query,
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
const searches = [];
for (const target of targets) {
  searches.push(await runSearch(target));
}

const artifact = {
  generatedAt: new Date().toISOString(),
  startedAt,
  source: "https://api.exa.ai/search",
  purpose:
    "Targeted Exa language official/social deep-dive for HelloTalk/Tandem-adjacent products still missing LinkedIn, social-community, or store evidence.",
  searches,
};

await mkdir(new URL("../data", import.meta.url), { recursive: true });
await writeFile(
  new URL("../data/exa-language-official-social-deep-dive.json", import.meta.url),
  `${JSON.stringify(artifact, null, 2)}\n`,
);

console.log(JSON.stringify({
  ok: searches.every((search) => search.ok),
  searches: searches.map((search) => ({
    id: search.id,
    productName: search.productName,
    ok: search.ok,
    status: search.status,
    resultCount: search.results.length,
    requestId: search.requestId,
  })),
}, null, 2));
