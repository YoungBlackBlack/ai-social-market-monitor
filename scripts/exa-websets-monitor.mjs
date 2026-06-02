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

const checkedAt = new Date().toISOString();
const docsUrl = "https://docs.exa.ai/reference/websets";
const outputUrl = new URL("../data/exa-websets-monitor.json", import.meta.url);

async function callWebsets(path) {
  const response = await fetchWithRetry(`https://api.exa.ai/websets/v0${path}`, {
    headers: {
      "x-api-key": apiKey,
    },
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return {
    path,
    ok: response.ok,
    status: response.status,
    requestId: body.requestId ?? null,
    message: body.message ?? null,
    body,
  };
}

const probes = [await callWebsets("/websets"), await callWebsets("/monitors")];
const unavailable = probes.find((probe) => probe.status === 401 || probe.status === 403);
const failed = probes.find((probe) => !probe.ok);

const artifact = {
  checkedAt,
  provider: "Exa Websets Monitor API",
  docsUrl,
  desiredMonitor: {
    externalId: "exa-ai-social-market-monitor",
    name: "Exa AI social market monitor",
    scope:
      "AI social apps, AI companions, AI entertainment, language-exchange social apps, and IRL/offline real-human social products.",
  },
  status: "available",
  mode: "native-exa-websets-monitor-ready",
  fallback: "Codex daily automation runs node scripts/run-all.mjs with Exa Search API monitor lanes.",
  probes: probes.map(({ path, ok, status, requestId, message }) => ({ path, ok, status, requestId, message })),
  websets: [],
  monitors: [],
};

if (unavailable) {
  artifact.status = "unavailable";
  artifact.mode = "codex-cron-search-api-fallback";
  artifact.reason =
    unavailable.message ??
    "The current Exa API key does not have access to Websets/Monitors API endpoints.";
} else if (failed) {
  artifact.status = "error";
  artifact.mode = "codex-cron-search-api-fallback";
  artifact.reason = failed.message ?? `Websets probe failed with HTTP ${failed.status}.`;
} else {
  const websetsProbe = probes.find((probe) => probe.path === "/websets");
  const monitorsProbe = probes.find((probe) => probe.path === "/monitors");
  artifact.websets = (websetsProbe?.body?.data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    externalId: item.externalId,
    status: item.status,
  }));
  artifact.monitors = (monitorsProbe?.body?.data ?? []).map((item) => ({
    id: item.id,
    websetId: item.websetId,
    externalId: item.externalId,
    status: item.status,
    nextRunAt: item.nextRunAt,
  }));
}

await mkdir(new URL("../data", import.meta.url), { recursive: true });
await writeFile(outputUrl, `${JSON.stringify(artifact, null, 2)}\n`);

console.log(JSON.stringify({
  ok: artifact.status !== "error",
  status: artifact.status,
  mode: artifact.mode,
  reason: artifact.reason ?? null,
  probes: artifact.probes,
}, null, 2));
