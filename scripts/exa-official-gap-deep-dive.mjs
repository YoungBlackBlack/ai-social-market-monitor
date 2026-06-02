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
  ["HelloTalk", "HelloTalk official LinkedIn Instagram TikTok X Twitter App Store Google Play language exchange app"],
  ["Tandem", "Tandem language exchange app official LinkedIn Instagram TikTok X Twitter App Store Google Play"],
  ["Hilokal", "Hilokal official LinkedIn Instagram TikTok X Twitter App Store Google Play language exchange app"],
  ["SewaYou", "SewaYou official LinkedIn Instagram TikTok X Twitter App Store Google Play language exchange app"],
  ["Conversation Exchange", "Conversation Exchange official LinkedIn Facebook Instagram language exchange app website"],
  ["Slowly", "Slowly app official LinkedIn Instagram TikTok X Twitter App Store Google Play pen pal app"],
  ["Status AI", "Status AI app official LinkedIn Instagram TikTok X Twitter App Store Google Play social app"],
  ["Butterflies AI", "Butterflies AI official LinkedIn Instagram TikTok X Twitter App Store Google Play social network"],
  ["Daze", "Daze AI messaging app official LinkedIn Instagram TikTok X Twitter App Store Google Play"],
  ["Shapes", "Shapes app AI group chat official LinkedIn Instagram TikTok X Twitter App Store Google Play"],
  ["222", "222 app official LinkedIn Instagram TikTok X Twitter App Store Google Play IRL social app"],
  ["Partiful", "Partiful official LinkedIn Instagram TikTok X Twitter App Store Google Play events app"],
  ["Pie", "Pie app Andy Dunn official LinkedIn Instagram TikTok X Twitter App Store Google Play social app"],
  ["Breeze", "Breeze dating app official LinkedIn Instagram TikTok X Twitter App Store Google Play"],
  ["Timeleft", "Timeleft official LinkedIn Instagram TikTok X Twitter App Store Google Play dinner strangers app"],
  ["Meet5", "Meet5 official LinkedIn Instagram TikTok X Twitter App Store Google Play social app"],
  ["Thursday", "Thursday dating app official LinkedIn Instagram TikTok X Twitter App Store Google Play singles events"],
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
    "Targeted Exa official/social-profile deep-dive for products whose official, store, LinkedIn, or social-community evidence still had gaps.",
  searches,
};

await mkdir(new URL("../data", import.meta.url), { recursive: true });
await writeFile(
  new URL("../data/exa-official-gap-deep-dive.json", import.meta.url),
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
