import { mkdir, readFile, writeFile } from "node:fs/promises";

// Phase 1 closed-loop connector:
// Reads the latest Exa monitor run and scores every recent / new-alert item
// with a deterministic rubric, routes it to the brief location it would feed,
// dedupes against products already tracked in the stock comparison (brief.json),
// and writes data/alert-triage.json so dynamic discoveries flow toward the
// stock competitor table instead of dying in the monitor feed.
//
// No network access and no EXA_API_KEY needed: this is a pure derivation.

async function readJson(url, fallback) {
  try {
    return JSON.parse(await readFile(url, "utf8"));
  } catch {
    return fallback;
  }
}

const monitor = await readJson(new URL("../data/monitor.json", import.meta.url), null);
if (!monitor) {
  throw new Error("Missing data/monitor.json. Run scripts/exa-monitor.mjs first.");
}
const brief = await readJson(new URL("../data/brief.json", import.meta.url), { clusters: [], fundingTimeline: [] });

// ---- Known products already in the stock comparison (for dedup / closed loop) ----
const trackedNames = new Set();
for (const cluster of brief.clusters ?? []) {
  for (const item of cluster.items ?? []) {
    if (item.name) trackedNames.add(item.name.toLowerCase());
  }
}
for (const event of brief.fundingTimeline ?? []) {
  if (event.name) trackedNames.add(event.name.toLowerCase());
}

function matchedTrackedName(text) {
  const haystack = text.toLowerCase();
  for (const name of trackedNames) {
    // Only match reasonably specific names to avoid false positives on short tokens.
    if (name.length >= 4 && haystack.includes(name)) return name;
  }
  return null;
}

// ---- Signal detection (deterministic keyword rubric) ----
const SIGNAL_RULES = [
  ["funding", /\$|\braise[sd]?\b|seed|series\s?[a-e]\b|funding|million|\bm\b|investment|venture|backed|融资|轮/i, 10],
  ["launch", /launch|debut|unveil|introduc|rolls?\s+out|上线|发布|推出/i, 6],
  ["irl", /\birl\b|offline|in[-\s]person|meetup|dinner|strangers?|gathering|线下|约会|聚会|面基/i, 12],
  ["companion", /companion|roleplay|character|girlfriend|boyfriend|waifu|陪伴|伴侣|角色/i, 6],
  ["ai-social", /ai\s+social|ai\s+friend|social\s+(app|network)|messaging|chat\s+app/i, 6],
  ["china-export", /\bchina\b|chinese|出海|talkie|minimax|polybuzz|hiwaifu/i, 6],
  ["risk", /loneliness|teen|safety|lawsuit|regulation|mental\s+health|addiction|孤独|监管|青少年/i, 6],
];

const REPUTABLE_DOMAINS = [
  "techcrunch.com", "theinformation.com", "reuters.com", "bloomberg.com",
  "wsj.com", "ft.com", "theverge.com", "wired.com", "axios.com",
  "sensortower.com", "appfigures.com", "a16z.com", "forbes.com",
];

const PRIORITY_BASE = { critical: 40, high: 30, medium: 20, low: 10 };

// monitorId -> where this candidate would feed in the stock comparison
const ROUTE_MAP = {
  funding: { routeTo: "融资时间线", target: "fundingTimeline", missing: "确认融资金额 / 轮次 / 投资方" },
  irl: { routeTo: "IRL 线下真人簇", target: "clusters:irl", missing: "确认线下撮合机制 / 城市运营 / 真人见面闭环" },
  "residual-irl-watchlist": { routeTo: "IRL 线下真人簇", target: "clusters:irl", missing: "确认线下机制是否成立，避免纯线上误入" },
  language: { routeTo: "语言交换簇", target: "clusters:language", missing: "确认母语者匹配 / 社交功能 / 增长口径" },
  "china-export": { routeTo: "AI 伴侣 / 出海簇", target: "clusters:companions", missing: "确认出海地区 / 下载或收入口径" },
  "research-risk": { routeTo: "研究与风险信号", target: "researchSignals", missing: "确认论文 / 政策来源权威性与结论" },
  "company-new": { routeTo: "发现扫描候选池", target: "discoveryScan", missing: "确认是否真实新公司、官网与产品形态" },
  "paid-acquisition": { routeTo: "渠道 / 投放审计", target: "channelSummary", missing: "确认投放渠道是否与目标赛道产品相关" },
  "coverage-signal-watchlist": { routeTo: "覆盖缺口登记", target: "coverageGapRegister", missing: "确认是否是新的覆盖缺口" },
};

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function scoreItem(item) {
  const text = `${item.title ?? ""} ${item.highlight ?? ""}`;
  const signals = [];
  let score = PRIORITY_BASE[item.priority] ?? 15;

  for (const [name, regex, weight] of SIGNAL_RULES) {
    if (regex.test(text)) {
      signals.push(name);
      score += weight;
    }
  }
  if (item.alert) score += 20; // genuinely new URL (not in baseline/previous runs)
  if (item.isRecent) score += 10;

  const domain = domainOf(item.url);
  const reputable = REPUTABLE_DOMAINS.includes(domain);
  if (reputable) score += 5;

  score = Math.max(0, Math.min(100, score));
  const grade = score >= 70 ? "A" : score >= 50 ? "B" : score >= 35 ? "C" : "D";
  return { score, grade, signals, domain, reputable };
}

function cleanName(title) {
  return (title ?? "")
    .replace(/\s*[|\-–—:]\s*[^|\-–—:]*$/, "") // drop trailing " | Source" / " - Site"
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90) || "Untitled";
}

function suggestedAction(grade, tracked) {
  if (tracked) return "已在对照表，复核是否需要更新增长 / 融资 / 渠道字段";
  if (grade === "A") return "高优先级：人工打开证据，确认后升级进 brief 主表";
  if (grade === "B") return "中优先级：补官方 / 商业证据，达标后升级";
  if (grade === "C") return "保留为 watchlist，持续观察";
  return "低信号：暂不处理，仅留痕";
}

// ---- Build triage candidates from monitor recent + alert items ----
// recentItems already contains alert items (alert ⊆ recent), so dedupe by URL.
const seen = new Map();
const pool = [...(monitor.recentItems ?? []), ...(monitor.alertItems ?? [])];
for (const item of pool) {
  if (!item.url || seen.has(item.url)) continue;
  seen.set(item.url, item);
}

const candidates = [...seen.values()].map((item) => {
  const { score, grade, signals, domain, reputable } = scoreItem(item);
  const route = ROUTE_MAP[item.monitorId] ?? {
    routeTo: "未分类",
    target: "review",
    missing: "确认归属赛道",
  };
  const trackedMatch = matchedTrackedName(`${item.title ?? ""}`);
  const status = trackedMatch
    ? "already-tracked"
    : grade === "D"
      ? "low-signal"
      : "needs-review";

  return {
    candidateName: cleanName(item.title),
    monitorId: item.monitorId,
    monitorLabel: item.monitorLabel,
    lanePriority: item.priority,
    routeTo: route.routeTo,
    routeTarget: route.target,
    triageScore: score,
    grade,
    signals,
    sourceDomain: domain,
    reputableSource: reputable,
    isNewUrl: Boolean(item.alert),
    isRecent: Boolean(item.isRecent),
    matchedTracked: trackedMatch,
    missingEvidence: trackedMatch ? "—（已跟踪）" : route.missing,
    suggestedAction: suggestedAction(grade, Boolean(trackedMatch)),
    status,
    title: item.title,
    url: item.url,
    publishedDate: item.publishedDate ?? null,
    highlight: (item.highlight ?? "").slice(0, 320),
  };
});

const gradeRank = { A: 0, B: 1, C: 2, D: 3 };
candidates.sort((a, b) => {
  if (a.status === "already-tracked" && b.status !== "already-tracked") return 1;
  if (b.status === "already-tracked" && a.status !== "already-tracked") return -1;
  const g = (gradeRank[a.grade] ?? 9) - (gradeRank[b.grade] ?? 9);
  if (g !== 0) return g;
  return b.triageScore - a.triageScore;
});
candidates.forEach((candidate, index) => {
  candidate.rank = index + 1;
});

const byLane = {};
for (const c of candidates) {
  byLane[c.monitorLabel] = (byLane[c.monitorLabel] ?? 0) + 1;
}

const promotionQueue = candidates.filter((c) => c.status === "needs-review" && (c.grade === "A" || c.grade === "B"));

const artifact = {
  generatedAt: monitor.generatedAt, // align with monitor run (same convention as digest)
  source: "data/monitor.json",
  monitorGeneratedAt: monitor.generatedAt,
  lookbackDays: monitor.lookbackDays,
  rubric: {
    base: PRIORITY_BASE,
    signalWeights: Object.fromEntries(SIGNAL_RULES.map(([name, , weight]) => [name, weight])),
    bonuses: { newUrl: 20, recent: 10, reputableSource: 5 },
    grades: { A: "≥70 高信号，建议尽快人工复核升级", B: "≥50 中信号，补证据后升级", C: "≥35 边界 / watchlist", D: "<35 低信号，仅留痕" },
  },
  summary: {
    totalCandidates: candidates.length,
    newUrls: candidates.filter((c) => c.isNewUrl).length,
    alreadyTracked: candidates.filter((c) => c.status === "already-tracked").length,
    needsReview: candidates.filter((c) => c.status === "needs-review").length,
    lowSignal: candidates.filter((c) => c.status === "low-signal").length,
    gradeA: candidates.filter((c) => c.grade === "A").length,
    gradeB: candidates.filter((c) => c.grade === "B").length,
    gradeC: candidates.filter((c) => c.grade === "C").length,
    gradeD: candidates.filter((c) => c.grade === "D").length,
    promotionQueueSize: promotionQueue.length,
    byLane,
  },
  promotionQueue,
  candidates,
};

await mkdir(new URL("../data", import.meta.url), { recursive: true });
await writeFile(
  new URL("../data/alert-triage.json", import.meta.url),
  JSON.stringify(artifact, null, 2),
);

console.log(JSON.stringify({
  ok: true,
  generatedAt: artifact.generatedAt,
  summary: artifact.summary,
  topPromotions: promotionQueue.slice(0, 5).map((c) => ({
    rank: c.rank,
    grade: c.grade,
    score: c.triageScore,
    name: c.candidateName,
    routeTo: c.routeTo,
  })),
}, null, 2));
