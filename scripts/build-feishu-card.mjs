import { mkdir, readFile, writeFile } from "node:fs/promises";

// Phase 2 notification builder:
// Turns the daily monitor digest + alert triage into a Feishu-card-ready
// markdown body plus card metadata (title / header color / button), written to
// exports/. Sending is a single command via the feishu-card skill once a target
// (ou_... user or oc_... group) is known:
//
//   node skills/feishu-card/send.js \
//     --target <ou_/oc_id> \
//     --title "<exports/feishu-card-meta.json .title>" \
//     --color "<.color>" \
//     --text-file exports/feishu-alert-digest.md \
//     --button-text "<.buttonText>" --button-url "<.buttonUrl>"
//
// No network access and no credentials needed: pure derivation.

async function readJson(url, fallback) {
  try {
    return JSON.parse(await readFile(url, "utf8"));
  } catch {
    return fallback;
  }
}

const digest = await readJson(new URL("../data/monitor-digest.json", import.meta.url), null);
const triage = await readJson(new URL("../data/alert-triage.json", import.meta.url), null);
const monitor = await readJson(new URL("../data/monitor.json", import.meta.url), { generatedAt: null });

if (!digest && !triage) {
  throw new Error("Need data/monitor-digest.json or data/alert-triage.json. Run exa-monitor.mjs and triage-alerts.mjs first.");
}

const promotionQueue = triage?.promotionQueue ?? [];
const summary = triage?.summary ?? {};
const hasGradeA = promotionQueue.some((c) => c.grade === "A");
const hasIrlAlert = promotionQueue.some((c) => c.routeTarget === "clusters:irl" && c.isNewUrl);
const newUrls = summary.newUrls ?? 0;

// Header color signals urgency: red for high-signal/IRL/new, blue otherwise.
const color = hasGradeA || hasIrlAlert ? "red" : newUrls > 0 ? "orange" : "blue";
const title = newUrls > 0
  ? `AI 社交监控 · ${newUrls} 条新增提醒待复核`
  : "AI 社交监控 · 今日无新增，复核近窗信号";

const lines = [];
if (digest?.headline) {
  lines.push(`**${digest.headline}**`);
  lines.push("");
}
for (const bullet of digest?.bullets ?? []) {
  lines.push(`- ${bullet}`);
}

if (promotionQueue.length > 0) {
  lines.push("");
  lines.push(`**升级队列（${promotionQueue.length} 条，按证据分排序）**`);
  promotionQueue.slice(0, 6).forEach((c) => {
    const flag = c.isNewUrl ? "🆕 " : "";
    lines.push(`- ${flag}[${c.grade}·${c.triageScore}] [${c.candidateName}](${c.url}) → ${c.routeTo}`);
  });
  if (promotionQueue.length > 6) {
    lines.push(`- …其余 ${promotionQueue.length - 6} 条见 data/alert-triage.json`);
  }
} else {
  lines.push("");
  lines.push("_本次没有达到 A/B 级的升级候选；保留为 watchlist。_");
}

if (digest?.recommendedActions?.length) {
  lines.push("");
  lines.push("**建议动作**");
  digest.recommendedActions.forEach((action) => lines.push(`- ${action}`));
}

lines.push("");
lines.push(`_监控时间：${monitor.generatedAt ?? "未知"} · 由 triage-alerts 自动评分_`);

const body = lines.join("\n");

const topUrl = promotionQueue[0]?.url ?? "https://docs.exa.ai/reference/search";
const meta = {
  generatedAt: monitor.generatedAt,
  title,
  color,
  buttonText: "查看最高优先级证据",
  buttonUrl: topUrl,
  // Convenience: shouldSend lets a scheduler skip empty days.
  shouldSend: newUrls > 0 || hasGradeA,
  promotionQueueSize: promotionQueue.length,
  newUrls,
};

await mkdir(new URL("../exports", import.meta.url), { recursive: true });
await writeFile(new URL("../exports/feishu-alert-digest.md", import.meta.url), body);
await writeFile(new URL("../exports/feishu-card-meta.json", import.meta.url), JSON.stringify(meta, null, 2));

const sendCommand = [
  "node skills/feishu-card/send.js",
  "--target <ou_或oc_目标ID>",
  `--title ${JSON.stringify(title)}`,
  `--color ${color}`,
  "--text-file exports/feishu-alert-digest.md",
  `--button-text ${JSON.stringify(meta.buttonText)}`,
  `--button-url ${JSON.stringify(meta.buttonUrl)}`,
].join(" ");

console.log(JSON.stringify({
  ok: true,
  generatedAt: meta.generatedAt,
  shouldSend: meta.shouldSend,
  newUrls,
  promotionQueueSize: meta.promotionQueueSize,
  color,
  title,
  files: ["exports/feishu-alert-digest.md", "exports/feishu-card-meta.json"],
  sendCommand,
}, null, 2));
