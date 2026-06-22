import { readFile, writeFile } from "node:fs/promises";

// Translates English titles/highlights in the monitor data to Simplified Chinese using the
// Gemini API, and writes the result back as `titleZh` / `highlightZh` fields. Results are cached
// in data/translation-cache.json so each daily run only pays for newly-discovered strings.
//
// Key is read from .env (GEMINI_API_KEY) — translation runs server-side in the pipeline, so the
// key is never exposed to the browser. The frontend just renders the pre-translated fields.

const root = new URL("..", import.meta.url);
const MODEL = process.env.GEMINI_TRANSLATE_MODEL || "gemini-2.5-flash";
const CACHE_URL = new URL("data/translation-cache.json", root);

function envValue(envText, key) {
  return envText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith(`${key}=`))
    ?.slice(key.length + 1)
    ?.replace(/^"|"$/g, "");
}

async function readJson(url, fallback) {
  try {
    return JSON.parse(await readFile(url, "utf8"));
  } catch {
    return fallback;
  }
}

// Treat a string as English (worth translating) when it is mostly Latin script with little CJK.
function looksEnglish(text) {
  if (!text || typeof text !== "string") return false;
  const cjk = (text.match(/[一-鿿]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  return latin >= 4 && cjk <= 1;
}

const envText = await readFile(new URL(".env", root), "utf8").catch(() => "");
const apiKey = process.env.GEMINI_API_KEY || envValue(envText, "GEMINI_API_KEY");

if (!apiKey) {
  // No key → do nothing (soft no-op). The pipeline marks this step soft-fail anyway.
  console.log(JSON.stringify({ ok: false, skipped: true, reason: "Missing GEMINI_API_KEY" }, null, 2));
  process.exit(0);
}

// Strip any leading list enumeration the model may echo back (e.g. "15. ", "1) ", "2、").
function cleanTranslation(text) {
  return String(text).replace(/^\s*\d+\s*[.)、:．]\s*/, "").trim();
}

const cache = await readJson(CACHE_URL, {});
// Sanitize previously-cached values in place so older enumeration leaks get cleaned on next run.
for (const key of Object.keys(cache)) {
  cache[key] = cleanTranslation(cache[key]);
}
let apiCalls = 0;

async function translateBatch(texts) {
  const numbered = texts.map((t, i) => `${i + 1}. ${String(t).replace(/\s+/g, " ").trim()}`).join("\n");
  const prompt =
    `You are a professional translator. Translate each numbered item below from English into natural, concise Simplified Chinese. ` +
    `Keep brand, product, company and person names in their original form. Do not add notes. ` +
    `Return ONLY a JSON array of ${texts.length} strings, in the same order. No markdown, no code fences.\n\n${numbered}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      // Disable "thinking" so translation is fast and cheap.
      generationConfig: { temperature: 0, thinkingConfig: { thinkingBudget: 0 } },
    }),
  });
  apiCalls += 1;
  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
  const data = await response.json();
  let textOut = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  textOut = textOut.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const arr = JSON.parse(textOut);
  if (!Array.isArray(arr) || arr.length !== texts.length) {
    throw new Error(`Batch length mismatch: got ${Array.isArray(arr) ? arr.length : "non-array"}, expected ${texts.length}`);
  }
  return arr.map((s) => cleanTranslation(s));
}

async function translateMany(uniqueTexts) {
  const pending = uniqueTexts.filter((t) => !(t in cache));
  const BATCH = 20;
  for (let i = 0; i < pending.length; i += BATCH) {
    const slice = pending.slice(i, i + BATCH);
    try {
      const out = await translateBatch(slice);
      slice.forEach((src, idx) => {
        cache[src] = out[idx];
      });
    } catch (error) {
      // Fall back to one-by-one for this batch so a single bad item can't drop the whole batch.
      for (const src of slice) {
        try {
          const [one] = await translateBatch([src]);
          cache[src] = one;
        } catch (innerError) {
          console.warn(`translate failed: ${String(innerError).slice(0, 80)}`);
        }
      }
    }
  }
}

// A headline is a multi-word English string worth translating — this skips brand/platform
// names like "LinkedIn", "App Store", "Google Play" that should stay in their original form.
function looksHeadline(text) {
  return looksEnglish(text) && String(text).trim().split(/\s+/).length >= 4;
}

// Walk any nested structure and apply a visitor to every object node.
function walkObjects(node, visit) {
  if (Array.isArray(node)) {
    node.forEach((child) => walkObjects(child, visit));
  } else if (node && typeof node === "object") {
    visit(node);
    for (const value of Object.values(node)) walkObjects(value, visit);
  }
}

// For brief.json: translate evidence headlines (label next to a url) and English highlights,
// while leaving product/brand names and already-Chinese analysis untouched.
function visitBriefNode(collect, apply, node) {
  if (typeof node.label === "string" && typeof node.url === "string" && looksHeadline(node.label)) {
    if (collect) collect(node.label);
    if (apply && cache[node.label]) node.labelZh = cache[node.label];
  }
  if (typeof node.highlight === "string" && looksEnglish(node.highlight)) {
    if (collect) collect(node.highlight);
    if (apply && cache[node.highlight]) node.highlightZh = cache[node.highlight];
  }
}

// Collect every English string that needs a translation across the data files.
const arrayTargets = [
  { url: new URL("data/monitor.json", root), arrays: ["recentItems", "alertItems"] },
  { url: new URL("data/monitor-ledger.json", root), arrays: ["items"] },
];

const allStrings = new Set();
const collect = (s) => allStrings.add(s);

const docs = [];
for (const target of arrayTargets) {
  const json = await readJson(target.url, null);
  if (!json) continue;
  docs.push({ ...target, json });
  for (const key of target.arrays) {
    for (const item of json[key] ?? []) {
      if (looksEnglish(item.title)) collect(item.title);
      if (looksEnglish(item.highlight)) collect(item.highlight);
    }
  }
}

const briefUrl = new URL("data/brief.json", root);
const brief = await readJson(briefUrl, null);
if (brief) walkObjects(brief, (node) => visitBriefNode(collect, false, node));

await translateMany([...allStrings]);

// Write the translations back onto the items and persist.
let annotatedTitles = 0;
let annotatedLabels = 0;
for (const doc of docs) {
  for (const key of doc.arrays) {
    for (const item of doc.json[key] ?? []) {
      if (looksEnglish(item.title) && cache[item.title]) {
        item.titleZh = cache[item.title];
        annotatedTitles += 1;
      }
      if (looksEnglish(item.highlight) && cache[item.highlight]) {
        item.highlightZh = cache[item.highlight];
      }
    }
  }
  await writeFile(doc.url, `${JSON.stringify(doc.json, null, 2)}\n`);
}

if (brief) {
  walkObjects(brief, (node) => {
    visitBriefNode(false, true, node);
    if (node.labelZh) annotatedLabels += 1;
  });
  await writeFile(briefUrl, `${JSON.stringify(brief, null, 2)}\n`);
}

await writeFile(CACHE_URL, `${JSON.stringify(cache, null, 2)}\n`);

console.log(JSON.stringify({
  ok: true,
  model: MODEL,
  uniqueStrings: allStrings.size,
  apiCalls,
  cacheSize: Object.keys(cache).length,
  annotatedTitles,
  annotatedEvidenceLabels: annotatedLabels,
}, null, 2));
