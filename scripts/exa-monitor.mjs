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

const lookbackDays = Number(process.env.EXA_MONITOR_LOOKBACK_DAYS ?? 14);
const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
const now = new Date();

const staticMonitors = [
  {
    id: "funding",
    label: "融资 / 商业化",
    category: "news",
    priority: "high",
    query:
      "past two weeks funding raised seed series A AI social app AI companion app AI roleplay app consumer AI app social entertainment startup",
  },
  {
    id: "irl",
    label: "线下真人社交",
    category: "news",
    priority: "critical",
    query:
      "past two weeks IRL offline social app AI matching friends dinner strangers meetup event social discovery funding launch 222 Pie Timeleft Meet5 Aglow Breeze group travel",
  },
  {
    id: "language",
    label: "语言交换 / 跨文化社交",
    category: "news",
    priority: "medium",
    query:
      "past two weeks HelloTalk Tandem SewaYou Hilokal Slowly Linguado LangPal MatchaLingua language exchange app native speaker chat social language learning growth funding launch",
  },
  {
    id: "china-export",
    label: "中国 AI 社交出海",
    category: "news",
    priority: "high",
    query:
      "past two weeks Chinese AI companion app overseas Talkie MiniMax PolyBuzz HiWaifu Linky AI social app downloads revenue funding",
  },
  {
    id: "research-risk",
    label: "研究 / 政策风险",
    category: "research paper",
    priority: "high",
    query:
      "past two weeks AI companion safety loneliness teens regulation lawsuit research paper Character.AI Replika Nomi chatbot companion",
  },
  {
    id: "company-new",
    label: "新公司 / 新产品",
    category: "company",
    priority: "medium",
    query:
      "new companies AI social app AI companion app IRL social app language exchange app launched 2026 startup",
  },
  {
    id: "paid-acquisition",
    label: "投放 / 付费获客证据",
    category: "news",
    priority: "medium",
    query:
      "past two weeks AI social app AI companion app language exchange app IRL social app paid acquisition advertising campaign ads library creatives CAC ROAS user acquisition marketing spend app install ads",
  },
];

async function readJson(url, fallback) {
  try {
    return JSON.parse(await readFile(url, "utf8"));
  } catch {
    return fallback;
  }
}

const baseline = await readJson(new URL("../data/exa-results.json", import.meta.url), { searches: [] });
const previous = await readJson(new URL("../data/monitor.json", import.meta.url), { knownUrls: [] });
const previousHistory = await readJson(new URL("../data/monitor-history.json", import.meta.url), { runs: [] });
const previousLedger = await readJson(new URL("../data/monitor-ledger.json", import.meta.url), { items: [] });
const nativeMonitor = await readJson(new URL("../data/exa-websets-monitor.json", import.meta.url), null);
const brief = await readJson(new URL("../data/brief.json", import.meta.url), {});

const residualWatchlist = (brief.residualSignalReview?.rows ?? [])
  .filter((item) => item.decision === "monitor watchlist")
  .sort((a, b) => a.name.localeCompare(b.name));

const coverageSignalWatchlist = (brief.coverageGapRegister?.groups ?? [])
  .filter((group) => group.reviewTier === "signal-candidate" && (group.unresolvedCount ?? 0) > 0)
  .sort((a, b) => b.unresolvedCount - a.unresolvedCount || a.queryId.localeCompare(b.queryId))
  .map((group) => ({
    name: group.queryId.replaceAll("_", " "),
    queryId: group.queryId,
    unresolvedCount: group.unresolvedCount,
    reason: group.reason,
    examples: (group.examples ?? []).slice(0, 3).map((item) => item.title),
    urls: (group.urls ?? []).slice(0, 3),
  }));

const coverageSignalTerms = coverageSignalWatchlist
  .flatMap((item) => [item.name, ...item.examples])
  .join(" ")
  .replace(/\s+/g, " ")
  .slice(0, 900);

const monitors =
  residualWatchlist.length > 0 || coverageSignalWatchlist.length > 0
    ? [
        ...staticMonitors,
        ...(residualWatchlist.length > 0
          ? [
              {
                id: "residual-irl-watchlist",
                label: "Residual IRL watchlist",
                category: "news",
                priority: "medium",
                query: `past two weeks ${residualWatchlist
                  .map((item) => item.name)
                  .join(" ")} IRL social app friends events networking face-to-face launch funding users growth invite-only gatherings`,
                source: "brief.residualSignalReview monitor watchlist",
                watchlist: residualWatchlist.map((item) => ({
                  name: item.name,
                  lane: item.lane,
                  reason: item.reason,
                  url: item.url,
                })),
              },
            ]
          : []),
        ...(coverageSignalWatchlist.length > 0
          ? [
              {
                id: "coverage-signal-watchlist",
                label: "Coverage signal watchlist",
                category: "news",
                priority: "medium",
                query: `past two weeks ${coverageSignalTerms} AI social app IRL social app companion app launch funding users revenue downloads official product update`,
                source: "brief.coverageGapRegister signal-candidate unresolved groups",
                watchlist: coverageSignalWatchlist,
              },
            ]
          : []),
      ]
    : staticMonitors;

const knownUrls = new Set(previous.knownUrls ?? []);
for (const search of baseline.searches ?? []) {
  for (const result of search.results ?? []) {
    if (result.url) knownUrls.add(result.url);
  }
}

async function runMonitor(monitor) {
  const response = await fetchWithRetry("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query: monitor.query,
      type: "auto",
      category: monitor.category,
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
      ...monitor,
      ok: false,
      status: response.status,
      error: body,
      items: [],
    };
  }

  const items = (body.results ?? []).map((result) => {
    const publishedAt = result.publishedDate ? new Date(result.publishedDate) : null;
    const isRecent = publishedAt ? publishedAt >= since : false;
    const isKnown = result.url ? knownUrls.has(result.url) : false;
    return {
      title: result.title ?? "Untitled",
      url: result.url,
      publishedDate: result.publishedDate ?? null,
      author: result.author ?? null,
      highlight: (result.highlights ?? []).join(" ").replace(/\s+/g, " ").slice(0, 420),
      isRecent,
      isKnown,
      alert: isRecent && !isKnown,
    };
  });

  return {
    ...monitor,
    ok: true,
    status: response.status,
    requestId: body.requestId,
    items,
    alertCount: items.filter((item) => item.alert).length,
    recentCount: items.filter((item) => item.isRecent).length,
  };
}

const runs = [];
for (const monitor of monitors) {
  runs.push(await runMonitor(monitor));
}

const alertItems = runs.flatMap((run) =>
  run.items
    .filter((item) => item.alert)
    .map((item) => ({
      monitorId: run.id,
      monitorLabel: run.label,
      priority: run.priority,
      ...item,
    })),
);

const priorityRank = {
  critical: 0,
  high: 1,
  medium: 2,
};

const recentItems = runs
  .flatMap((run) =>
    run.items
      .filter((item) => item.isRecent)
      .map((item) => ({
        monitorId: run.id,
        monitorLabel: run.label,
        priority: run.priority,
        ...item,
      })),
  )
  .sort((a, b) => {
    const priorityDiff = (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.publishedDate ?? 0) - new Date(a.publishedDate ?? 0);
  });

const nextKnownUrls = new Set(knownUrls);
for (const run of runs) {
  for (const item of run.items) {
    if (item.url) nextKnownUrls.add(item.url);
  }
}

const artifact = {
  generatedAt: now.toISOString(),
  lookbackDays,
  since: since.toISOString(),
  source: "https://api.exa.ai/search",
  automationName: "Exa AI social market monitor",
  automationSchedule: "Daily 09:00",
  nativeMonitor,
  summary: {
    monitors: runs.length,
    ok: runs.filter((run) => run.ok).length,
    totalResults: runs.reduce((count, run) => count + run.items.length, 0),
    recentResults: runs.reduce((count, run) => count + run.recentCount, 0),
    newAlerts: alertItems.length,
  },
  runs,
  alertItems,
  recentItems,
  knownUrls: [...nextKnownUrls],
};

const historyEntry = {
  generatedAt: artifact.generatedAt,
  lookbackDays: artifact.lookbackDays,
  summary: artifact.summary,
  lanes: runs.map((run) => ({
    id: run.id,
    label: run.label,
    priority: run.priority,
    ok: run.ok,
    requestId: run.requestId ?? null,
    totalResults: run.items.length,
    recentCount: run.recentCount,
    alertCount: run.alertCount,
  })),
  topAlerts: alertItems.slice(0, 8).map((item) => ({
    monitorId: item.monitorId,
    monitorLabel: item.monitorLabel,
    priority: item.priority,
    title: item.title,
    url: item.url,
    publishedDate: item.publishedDate,
  })),
  topRecent: recentItems.slice(0, 8).map((item) => ({
    monitorId: item.monitorId,
    monitorLabel: item.monitorLabel,
    priority: item.priority,
    title: item.title,
    url: item.url,
    publishedDate: item.publishedDate,
    isKnown: item.isKnown,
  })),
};

const history = {
  updatedAt: artifact.generatedAt,
  runs: [historyEntry, ...(previousHistory.runs ?? [])].slice(0, 30),
};

const ledgerByUrl = new Map();
for (const item of previousLedger.items ?? []) {
  if (item.url) ledgerByUrl.set(item.url, item);
}
for (const item of alertItems) {
  if (!item.url || ledgerByUrl.has(item.url)) continue;
  ledgerByUrl.set(item.url, {
    firstSeenAt: artifact.generatedAt,
    lastSeenAt: artifact.generatedAt,
    monitorId: item.monitorId,
    monitorLabel: item.monitorLabel,
    priority: item.priority,
    title: item.title,
    url: item.url,
    publishedDate: item.publishedDate,
    highlight: item.highlight,
    status: "new",
  });
}
for (const run of runs) {
  for (const item of run.items) {
    if (item.url && ledgerByUrl.has(item.url)) {
      ledgerByUrl.get(item.url).lastSeenAt = artifact.generatedAt;
    }
  }
}

const ledger = {
  updatedAt: artifact.generatedAt,
  totalItems: ledgerByUrl.size,
  items: [...ledgerByUrl.values()]
    .sort((a, b) => new Date(b.firstSeenAt) - new Date(a.firstSeenAt))
    .slice(0, 200),
};

const laneSummaries = runs.map((run) => ({
  id: run.id,
  label: run.label,
  priority: run.priority,
  alertCount: run.alertCount,
  recentCount: run.recentCount,
  topRecentTitles: recentItems
    .filter((item) => item.monitorId === run.id)
    .slice(0, 3)
    .map((item) => item.title),
}));

const hottestLane = [...laneSummaries].sort((a, b) => {
  if (b.alertCount !== a.alertCount) return b.alertCount - a.alertCount;
  return b.recentCount - a.recentCount;
})[0];

const digest = {
  generatedAt: artifact.generatedAt,
  headline:
    alertItems.length > 0
      ? `发现 ${alertItems.length} 条新增提醒，优先复核 ${hottestLane?.label ?? "高优先级主题"}。`
      : `本次没有新增未知 URL，但近 ${lookbackDays} 天仍有 ${recentItems.length} 条高相关信号。`,
  bullets: [
    `监控主题 ${runs.length} 条，成功 ${artifact.summary.ok} 条，共返回 ${artifact.summary.totalResults} 条结果。`,
    `近窗高相关 ${artifact.summary.recentResults} 条；新增提醒 ${artifact.summary.newAlerts} 条；台账累计 ${ledger.totalItems} 条。`,
    hottestLane
      ? `当前最活跃主题是「${hottestLane.label}」：近窗 ${hottestLane.recentCount} 条，新增 ${hottestLane.alertCount} 条。`
      : "当前没有可排序的活跃主题。",
  ],
  recommendedActions:
    alertItems.length > 0
      ? [
          "优先人工打开新增提醒里的 IRL 和融资类证据链接，确认是否需要升级进核心产品图谱。",
          "把确认后的融资金额、增长信号、投放渠道和功能差异补入 data/brief.json。",
          "对低质量来源只保留为 watchlist，不进入核心证据卡。",
        ]
      : [
          "本次可先复核近期高相关信号，尤其是 IRL lane 中的 Meet5、Aglow、Breeze、群组旅行、AI dating、线下约会产品。",
          "如果连续多天新增为 0，可扩大 lookback 或增加新关键词，例如 WeRoad、Breeze、AI dating、group travel。",
          "保持每日 09:00 自动化运行，让台账捕捉真正的新 URL。",
        ],
  laneSummaries,
};

await mkdir(new URL("../data", import.meta.url), { recursive: true });
await writeFile(
  new URL("../data/monitor.json", import.meta.url),
  JSON.stringify(artifact, null, 2),
);
await writeFile(
  new URL("../data/monitor-history.json", import.meta.url),
  JSON.stringify(history, null, 2),
);
await writeFile(
  new URL("../data/monitor-ledger.json", import.meta.url),
  JSON.stringify(ledger, null, 2),
);
await writeFile(
  new URL("../data/monitor-digest.json", import.meta.url),
  JSON.stringify(digest, null, 2),
);

console.log(JSON.stringify({
  ok: true,
  generatedAt: artifact.generatedAt,
  lookbackDays,
  summary: artifact.summary,
  historyRuns: history.runs.length,
  ledgerItems: ledger.totalItems,
  digestHeadline: digest.headline,
  requestIds: runs.map((run) => run.requestId).filter(Boolean),
}, null, 2));
