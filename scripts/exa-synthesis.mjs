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

const body = {
  query:
    "2024 2025 2026 AI social apps AI companion apps AI roleplay apps interactive entertainment apps language exchange apps similar to HelloTalk Tandem AI dating offline dates local activity social apps group travel social platforms and IRL offline social apps funding growth news",
  type: "deep-lite",
  systemPrompt:
    "Prefer primary company pages, funding announcements, reputable tech media, app-market reports, and research papers. Collapse duplicates. Separate AI-only companion products from products that create real offline human interactions such as dinners, events, group travel, local activities, and offline-first dating. Return concise Chinese output grounded in sources.",
  outputSchema: {
    type: "object",
    required: ["summary", "core_products", "irl_products", "watchlist", "risks"],
    properties: {
      summary: {
        type: "string",
        description: "A concise Chinese synthesis of the market and opportunity.",
      },
      core_products: {
        type: "array",
        description: "Important AI social, AI companion, language exchange, or entertainment products.",
        items: { type: "string" },
      },
      irl_products: {
        type: "array",
        description: "Products that connect users to real offline human interactions.",
        items: { type: "string" },
      },
      watchlist: {
        type: "array",
        description: "Products or categories to keep monitoring because evidence is incomplete or adjacent.",
        items: { type: "string" },
      },
      risks: {
        type: "array",
        description: "Safety, regulation, monetization, or evidence risks.",
        items: { type: "string" },
      },
    },
  },
  contents: {
    highlights: true,
  },
};

const response = await fetchWithRetry("https://api.exa.ai/search", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
  },
  body: JSON.stringify(body),
});

const text = await response.text();
let data;
try {
  data = JSON.parse(text);
} catch {
  data = { raw: text };
}

const artifact = {
  generatedAt: new Date().toISOString(),
  source: "https://api.exa.ai/search",
  request: body,
  ok: response.ok,
  status: response.status,
  response: data,
};

await mkdir(new URL("../data", import.meta.url), { recursive: true });
await writeFile(
  new URL("../data/exa-synthesis.json", import.meta.url),
  JSON.stringify(artifact, null, 2),
);

if (!response.ok) {
  console.error(JSON.stringify({ ok: false, status: response.status, data }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  status: response.status,
  requestId: data.requestId,
  hasOutput: Boolean(data.output),
  resultCount: data.results?.length ?? 0,
  fields: Object.keys(data.output?.content ?? {}),
}, null, 2));
