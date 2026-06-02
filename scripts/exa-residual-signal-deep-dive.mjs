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
    id: "residual_companion_long_tail",
    lane: "AI companion / roleplay residual",
    category: "company",
    query:
      "Janitor AI EverAI Soul App ChatFai AI companion roleplay app official users revenue funding App Store Google Play 2024 2025 2026",
  },
  {
    id: "residual_irl_long_tail",
    lane: "IRL social residual",
    category: "company",
    query:
      "Homii World Eve Inc Gist IRL Soma Gatherings Pie app offline social meet friends events official users funding 2024 2025 2026",
  },
  {
    id: "residual_language_media",
    lane: "language/media residual",
    category: "company",
    query:
      "Lingopie language learning social app official users revenue funding company 2024 2025 2026 HelloTalk Tandem adjacent",
  },
  {
    id: "residual_ai_social_people",
    lane: "AI social founder residual",
    category: "people",
    query:
      "Fai Nur Status AI founder background funding interactive social media app 2024 2025 2026",
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
      highlight: (result.highlights ?? []).join(" ").replace(/\s+/g, " ").slice(0, 520),
    })),
    costDollars: body.costDollars,
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
    "Targeted Exa pass for residual signal-candidate coverage gaps after product-candidate and funding-candidate queues were cleared.",
  searches,
};

await mkdir(new URL("../data", import.meta.url), { recursive: true });
await writeFile(new URL("../data/exa-residual-signal-deep-dive.json", import.meta.url), `${JSON.stringify(artifact, null, 2)}\n`);

console.log(JSON.stringify({
  ok: searches.every((run) => run.ok),
  searches: searches.map((run) => ({
    id: run.id,
    category: run.category,
    ok: run.ok,
    status: run.status,
    resultCount: run.results.length,
    requestId: run.requestId,
  })),
}, null, 2));
