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

const brief = JSON.parse(await readFile(new URL("../data/brief.json", import.meta.url), "utf8"));

function cleanName(title) {
  return String(title ?? "Untitled")
    .replace(/\s+-\s+.*$/, "")
    .replace(/\s+\|\s+.*$/, "")
    .trim();
}

const seedCandidates = [
  ...new Map(
    (brief.sourceLinkageAudit?.rows ?? [])
      .filter((row) => row.reviewTier === "product-candidate")
      .map((row) => [
        cleanName(row.title).toLowerCase(),
        {
          name: cleanName(row.title),
          seedUrl: row.url,
          sourceQueryId: row.queryId,
          sourceCategory: row.category,
        },
      ]),
  ).values(),
];

const searches = seedCandidates.flatMap((candidate) => [
  {
    id: `${candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_company`,
    candidate: candidate.name,
    seedUrl: candidate.seedUrl,
    sourceQueryId: candidate.sourceQueryId,
    category: "company",
    query: `${candidate.name} social app company official website users features funding growth language exchange AI offline social`,
  },
  {
    id: `${candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_news`,
    candidate: candidate.name,
    seedUrl: candidate.seedUrl,
    sourceQueryId: candidate.sourceQueryId,
    category: "news",
    query: `${candidate.name} app funding launch growth users AI social language exchange offline social 2024 2025 2026`,
  },
]);

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
      numResults: 6,
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
      highlight: (result.highlights ?? []).join(" ").replace(/\s+/g, " ").slice(0, 420),
    })),
    costDollars: body.costDollars,
  };
}

const startedAt = new Date().toISOString();
const results = [];
for (const search of searches) {
  results.push(await runSearch(search));
}

const artifact = {
  generatedAt: new Date().toISOString(),
  startedAt,
  source: "https://api.exa.ai/search",
  purpose:
    "Targeted Exa company/news deep dive for product-candidate rows from the raw source linkage review queue.",
  candidates: seedCandidates,
  searches: results,
};

await mkdir(new URL("../data", import.meta.url), { recursive: true });
await writeFile(new URL("../data/exa-candidate-deep-dive.json", import.meta.url), `${JSON.stringify(artifact, null, 2)}\n`);

console.log(JSON.stringify({
  ok: results.every((run) => run.ok),
  candidates: seedCandidates.length,
  searches: results.map((run) => ({
    id: run.id,
    candidate: run.candidate,
    category: run.category,
    ok: run.ok,
    status: run.status,
    resultCount: run.results.length,
    requestId: run.requestId,
  })),
}, null, 2));
