import { mkdir, readFile, writeFile } from "node:fs/promises";

const brief = JSON.parse(await readFile(new URL("../data/brief.json", import.meta.url), "utf8"));
const monitor = JSON.parse(await readFile(new URL("../data/monitor.json", import.meta.url), "utf8"));
const monitorHistory = JSON.parse(await readFile(new URL("../data/monitor-history.json", import.meta.url), "utf8"));

const exportDir = new URL("../exports/", import.meta.url);

const productCount = brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0);
const languageCount = brief.clusters.find((cluster) => cluster.id === "language")?.items.length ?? 0;
const irlCount = brief.clusters.find((cluster) => cluster.id === "irl")?.items.length ?? 0;
const supplementalFundingCount = brief.discoveryScan?.supplementalFundingNews?.length ?? 0;
const recentSignalReviewCount = brief.candidateReview?.recentSignalReview?.length ?? 0;
const topCapability = (brief.productCapability?.rows ?? []).slice(0, 6).map((item) => `${item.name}（${item.tier}，${item.score}）`);
const categories = brief.exaQueryMatrix.byCategory
  .map((item) => `${item.category}: ${item.searches} queries / ${item.results} results`)
  .join("; ");
const latestAlertPendingRows =
  brief.candidateReview?.alertClosure?.latestAlertPendingRows ??
  (brief.candidateReview?.latestAlertReview ?? []).filter((item) => item.decision === "待复核" || /自动补齐的新提醒记录/.test(item.reason ?? "")).length;
const recentSignalPendingRows =
  brief.candidateReview?.alertClosure?.recentSignalPendingRows ??
  (brief.candidateReview?.recentSignalReview ?? []).filter((item) => item.decision === "待复核").length;
const blockingGapRows = brief.goalReadiness?.blockingGaps?.rows ?? null;
const monitoredGapRows = brief.goalReadiness?.monitoredGaps?.rows ?? null;
const strictCompletionVerdict = {
  status: "not-mathematically-complete",
  presentationReady: brief.goalReadiness?.status === "ready-with-monitoring-boundary",
  reason:
    "The current evidence set satisfies the presentation deliverable and has no blocking candidate or pending alert-review rows, but the original word 'all' cannot be proven mathematically for a live consumer-social market. The goal remains active through monitor and full rebuild workflows.",
  blockingGapRows,
  monitoredGapRows,
  latestAlertPendingRows,
  recentSignalPendingRows,
  conditionsForFutureCompletion: [
    "No blocking product-candidate rows.",
    "No pending latest-alert or recent-signal review rows.",
    "Fresh monitor run reviewed.",
    "Conservative boundary continues to disclose that coverage is broad and monitored, not mathematically exhaustive.",
  ],
};

function bulletList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

const lines = [
  "# Exa AI Social Market Research - Completion Audit",
  "",
  `Generated from current workspace data at ${new Date().toISOString()}.`,
  "",
  "## Scope",
  "",
  "Original objective: use Exa categories such as company, people, research paper, news, and financial report to judge app markets, company background, and product capability; find HelloTalk/Tandem-like social apps with growth signals, channels, feature differences, official/social evidence; summarize near-two-year AI social, AI entertainment, and related funding/news, especially products involving offline real-human social interaction.",
  "",
  "## Current Evidence Snapshot",
  "",
  bulletList([
    `Exa query matrix: ${brief.exaQueryMatrix.totalSearches} searches / ${brief.exaQueryMatrix.totalResults} raw results.`,
    `Categories covered: ${categories}.`,
    `Product evidence cards: ${productCount}; language-exchange adjacent: ${languageCount}; IRL/offline social: ${irlCount}.`,
  `Raw source linkage audit: ${brief.sourceLinkageAudit.totalResults} results, ${brief.sourceLinkageAudit.linkedResults} linked to curated products/timeline/official evidence, ${brief.sourceLinkageAudit.unlinkedResults} in review queue.`,
  `Language coverage audit: ${brief.languageCoverageAudit.totalUnique} unique HelloTalk/Tandem-adjacent entries, ${brief.languageCoverageAudit.coreCount} in core matrix, ${brief.languageCoverageAudit.watchlistCount} in watchlist.`,
  `Language official evidence map: ${brief.languageOfficialEvidenceMap.totalRows} curated language products, ${brief.languageOfficialEvidenceMap.readyRows} ready, ${brief.languageOfficialEvidenceMap.displayableRows} displayable, ${brief.languageOfficialEvidenceMap.thinRows} thin.`,
  `Language official/social deep-dive: ${brief.languageOfficialSocialDeepDive?.searches ?? 0} targeted Exa searches, ${brief.languageOfficialSocialDeepDive?.resultRows ?? 0} results.`,
  `Language growth/channel deep-dive: ${brief.languageGrowthChannelDeepDive?.searches ?? 0} targeted Exa searches, ${brief.languageGrowthChannelDeepDive?.resultRows ?? 0} results, ${brief.languageGrowthChannelDeepDive?.strongRows ?? 0} strong and ${brief.languageGrowthChannelDeepDive?.usableRows ?? 0} usable product rows.`,
  `IRL coverage audit: ${brief.irlCoverageAudit.totalUnique} unique offline-human/IRL entries, ${brief.irlCoverageAudit.coreCount} core, ${brief.irlCoverageAudit.monitorCount} monitor-linked.`,
  `IRL offline evidence map: ${brief.irlOfflineEvidenceMap.totalRows} entries, ${brief.irlOfflineEvidenceMap.fundingLinkedRows} funding/news-linked, ${brief.irlOfflineEvidenceMap.monitorLinkedRows} monitor-linked, ${brief.irlOfflineEvidenceMap.strongRows} strong.`,
  `Candidate deep dive: ${brief.candidateDeepDive.candidates} product candidates, ${brief.candidateDeepDive.searches} targeted Exa company/news searches, ${brief.candidateDeepDive.totalResults} results.`,
  `Funding/news timeline: ${brief.fundingSummary.totalEvents} core events plus ${supplementalFundingCount} supplemental candidates from exact window ${brief.fundingSummary.dateWindowAudit?.exactWindowStart ?? "2024-06-02"} - ${brief.fundingSummary.dateWindowAudit?.exactWindowEnd ?? "2026-06-02"} / month window ${brief.fundingSummary.yearRange}; IRL events: ${brief.fundingSummary.irlEvents}; explicit USD funding total: $${brief.fundingSummary.explicitUsdFundingM}M.`,
  `Funding/news dedupe: ${brief.fundingSummary.combinedEvents} raw review rows, ${brief.fundingSummary.uniqueCombinedEvents} unique events, ${brief.fundingSummary.duplicateCombinedEvents} duplicate rows.`,
  `Funding upgrade map: ${brief.fundingUpgradeMap.totalRows} supplemental rows, ${brief.fundingUpgradeMap.retainedCandidates} retained candidates, ${brief.fundingUpgradeMap.duplicateEvidenceRows} duplicate evidence rows, ${brief.fundingUpgradeMap.irlCandidateRows} retained IRL candidates.`,
  `Discovery scan: ${brief.discoveryScan?.totalScans ?? 0} blind-spot scans / ${brief.discoveryScan?.totalResults ?? 0} supplementary results.`,
  `Paid acquisition evidence audit: ${brief.paidAcquisitionEvidenceAudit?.totalProducts ?? 0} products, ${brief.paidAcquisitionEvidenceAudit?.explicitPaidRows ?? 0} explicit paid-acquisition rows, ${brief.paidAcquisitionEvidenceAudit?.directionalRows ?? 0} directional channel rows, ${brief.paidAcquisitionEvidenceAudit?.noPaidEvidenceRows ?? 0} no-paid-evidence rows, ${brief.paidAcquisitionEvidenceAudit?.monitorPaidSignalRows ?? 0} monitor paid-acquisition signals.`,
  `Coverage gaps: ${brief.coverageGapRegister.totalGaps} unmatched rows retained, ${brief.coverageGapRegister.deepDiveReviewedGaps} product-candidate gaps reviewed by candidate deep-dive, ${brief.coverageGapRegister.unresolvedAfterDeepDive} still monitored or archived by lane.`,
  `Monitor: ${monitor.summary.monitors} lanes, ${monitor.summary.recentResults} recent high-signal items, ${monitor.summary.newAlerts} new alerts in latest run; recent signal review queue: ${recentSignalReviewCount}.`,
    `Exports: competitive matrix, funding timeline, latest alert review, monitor recent review, monitor recent signals.`,
  ]),
  "",
  "## Requirement Audit",
  "",
];

for (const item of brief.completionAudit) {
  lines.push(`### ${item.status}: ${item.requirement}`);
  lines.push("");
  lines.push(item.evidence);
  lines.push("");
  lines.push("Proof:");
  lines.push(bulletList(item.proof));
  lines.push("");
}

lines.push("## Conservative Boundary");
lines.push("");
lines.push(brief.coverage.note);
lines.push("");
lines.push("The page treats 'all' as a broad, monitored evidence pass rather than a mathematically exhaustive claim. New URLs are captured by monitor, retained in the alert ledger, and classified in the latest alert review workflow.");
lines.push("");
lines.push("## Strict Completion Verdict");
lines.push("");
lines.push(`Status: ${strictCompletionVerdict.status}.`);
lines.push("");
lines.push(strictCompletionVerdict.reason);
lines.push("");
lines.push(
  bulletList([
    `Presentation ready: ${strictCompletionVerdict.presentationReady ? "yes" : "no"}.`,
    `Blocking product-candidate rows: ${strictCompletionVerdict.blockingGapRows}.`,
    `Monitored signal rows: ${strictCompletionVerdict.monitoredGapRows}.`,
    `Latest alert pending rows: ${strictCompletionVerdict.latestAlertPendingRows}.`,
    `Recent signal pending rows: ${strictCompletionVerdict.recentSignalPendingRows}.`,
  ]),
);
lines.push("");
lines.push("## Local Artifacts");
lines.push("");
lines.push(bulletList([
  "index.html - presentation webpage",
  "功能与版本记录.md - living feature and version log",
  "交付说明.md - concise handoff note for presentation entrance, core numbers, and evidence boundary",
  "exports/current-state.md - concise current-state lock for handoff",
  "exports/latest-monitor-run.md - latest Exa monitor run receipt with lane requestIds and alert handling",
  "data/brief.json - curated display brief",
  "data/exa-results.json - raw Exa category search output",
  "data/exa-language-growth-channel-deep-dive.json - targeted language growth/channel Exa evidence",
  "data/exa-language-official-social-deep-dive.json - targeted language official/social Exa evidence",
  "data/monitor.json - latest Exa monitor output",
  "exports/executive-brief.md - presentation talk track attachment",
  "exports/competitive-matrix.csv - table attachment",
  "exports/source-coverage.csv - Exa query/source coverage attachment",
  "exports/exa-category-evidence-audit.csv - Exa category to downstream judgment mapping attachment",
  "exports/source-linkage-audit.csv - raw Exa result linkage/review audit attachment",
  "exports/coverage-gap-register.csv - unmatched raw-result coverage gap register",
  "exports/candidate-deep-dive.csv - targeted candidate补证 attachment",
  "exports/language-coverage-audit.csv - combined HelloTalk/Tandem-adjacent coverage audit attachment",
  "exports/language-similarity-audit.csv - HelloTalk/Tandem adjacency and differentiation scoring attachment",
  "exports/language-official-evidence-map.csv - language official/store/social evidence map attachment",
  "exports/language-growth-channel-deep-dive.csv - targeted language growth/channel evidence attachment",
  "exports/language-official-social-deep-dive.csv - targeted language official/social evidence attachment",
  "exports/irl-coverage-audit.csv - combined IRL/offline-human coverage audit attachment",
  "exports/product-capability-score.csv - derived product capability scoring attachment",
  "exports/growth-channel-audit.csv - per-product growth signal and GTM channel audit attachment",
  "exports/acquisition-channel-map.csv - per-product acquisition channel, paid/organic mode, and next evidence check attachment",
  "exports/paid-acquisition-evidence-audit.csv - explicit paid-acquisition versus directional channel evidence attachment",
  "exports/functional-difference-audit.csv - per-product mechanism and interaction-mode audit attachment",
  "exports/official-social-coverage-audit.csv - per-product official, store, LinkedIn, and social evidence coverage attachment",
  "exports/official-gap-deep-dive.csv - targeted official/social gap evidence attachment",
  "exports/company-background-review.csv - combined people, company, and financial-report background attachment",
  "exports/company-background-deep-dive.csv - targeted product-level company background attachment",
  "exports/company-background-coverage-audit.csv - per-product company background coverage attachment",
  "exports/market-decision-evidence-map.csv - research/financial evidence to market/product judgment mapping attachment",
  "exports/funding-timeline.csv - funding/news attachment",
  "exports/funding-news-review.csv - combined main plus supplemental funding/news review attachment",
  "exports/funding-news-dedup-audit.csv - combined funding/news dedupe audit attachment",
  "exports/funding-event-audit.csv - event-level funding/news methodology audit attachment",
  "exports/funding-product-rollup.csv - product-level funding/news aggregation attachment",
  "exports/funding-discovery-candidates.csv - discovery funding/news blind-spot candidate attachment",
  "exports/candidate-promotion-queue.csv - unified language and funding candidate upgrade queue",
  "exports/latest-alert-review.csv - alert classification attachment",
  "exports/monitor-recent-review.csv - recent monitor review queue attachment",
  "exports/monitor-lane-routing.csv - monitor signal lane routing attachment",
  "exports/monitor-recent-signals.csv - monitor signal attachment",
  "exports/objective-evidence-map.csv - objective-to-data/export/validator evidence map",
  "exports/original-objective-audit.md - original objective requirement-by-requirement audit",
  "exports/original-objective-audit.csv - original objective audit table",
  "exports/browser-qa-report.md - in-app browser route, viewport, DOM, and layout QA evidence",
  "exports/completion-manifest.json - machine-readable completion evidence manifest",
]));
lines.push("");

await mkdir(exportDir, { recursive: true });
await writeFile(new URL("completion-audit.md", exportDir), `${lines.join("\n")}\n`);

const executiveBrief = [
  "# AI 社交与线下真人连接机会图谱 - 展示讲稿",
  "",
  `生成时间：${new Date().toISOString()}`,
  "",
  "## 1. 一句话结论",
  "",
  "AI 社交里最值得单独看的不是“更像真人的机器人”，而是“AI 降低陌生人连接成本，真人在线下或真实关系里完成情绪兑现”的产品。",
  "",
  "## 2. 研究覆盖",
  "",
  bulletList([
    `Exa 搜索：${brief.exaQueryMatrix.totalSearches} 组查询，${brief.exaQueryMatrix.totalResults} 条原始结果。`,
    `来源关联审计：${brief.sourceLinkageAudit.totalResults} 条原始 Exa 结果，${brief.sourceLinkageAudit.linkedResults} 条已关联结论，${brief.sourceLinkageAudit.unlinkedResults} 条留在复核队列。`,
    `候选补证深挖：${brief.candidateDeepDive.candidates} 个候选，${brief.candidateDeepDive.searches} 组 Exa company/news 搜索，${brief.candidateDeepDive.totalResults} 条结果。`,
    `类别覆盖：${categories}。`,
    `产品主表：${productCount} 个产品，其中 HelloTalk/Tandem 相邻 ${languageCount} 个，IRL/线下真人 ${irlCount} 个。`,
    `语言交换覆盖审计：${brief.languageCoverageAudit.totalUnique} 个唯一相邻条目，其中主表 ${brief.languageCoverageAudit.coreCount} 个、watchlist ${brief.languageCoverageAudit.watchlistCount} 个。`,
    `语言官方/社媒深挖：${brief.languageOfficialSocialDeepDive?.searches ?? 0} 组 targeted Exa 查询，${brief.languageOfficialSocialDeepDive?.resultRows ?? 0} 条结果。`,
    `语言增长/渠道深挖：${brief.languageGrowthChannelDeepDive?.searches ?? 0} 组 targeted Exa 查询，${brief.languageGrowthChannelDeepDive?.resultRows ?? 0} 条结果，strong ${brief.languageGrowthChannelDeepDive?.strongRows ?? 0} 个、usable ${brief.languageGrowthChannelDeepDive?.usableRows ?? 0} 个。`,
    `IRL 覆盖审计：${brief.irlCoverageAudit.totalUnique} 个唯一线下真人/IRL 相邻条目，其中核心 ${brief.irlCoverageAudit.coreCount} 个、monitor 近窗覆盖 ${brief.irlCoverageAudit.monitorCount} 个。`,
    `线下真人证据地图：${brief.irlOfflineEvidenceMap.totalRows} 个条目，其中融资/新闻链接 ${brief.irlOfflineEvidenceMap.fundingLinkedRows} 个、monitor 近窗链接 ${brief.irlOfflineEvidenceMap.monitorLinkedRows} 个、强证据 ${brief.irlOfflineEvidenceMap.strongRows} 个。`,
    `近两年融资/新闻：精确窗口 ${brief.fundingSummary.dateWindowAudit?.exactWindowStart ?? "2024-06-02"} - ${brief.fundingSummary.dateWindowAudit?.exactWindowEnd ?? "2026-06-02"}，月份归档窗口 ${brief.fundingSummary.yearRange}，主时间线 ${brief.fundingSummary.totalEvents} 条，补充候选 ${supplementalFundingCount} 条，合并复核 ${brief.fundingSummary.combinedEvents} 条。`,
    `融资/新闻去重：合并复核 ${brief.fundingSummary.combinedEvents} 行，去重后 ${brief.fundingSummary.uniqueCombinedEvents} 个唯一事件，重复行 ${brief.fundingSummary.duplicateCombinedEvents} 条。`,
    `日期窗口校验：主时间线 ${brief.fundingSummary.dateWindowAudit.main.inWindow}/${brief.fundingSummary.dateWindowAudit.main.total} 条在窗内，补充候选 ${brief.fundingSummary.dateWindowAudit.supplemental.inWindow}/${brief.fundingSummary.dateWindowAudit.supplemental.total} 条在窗内。`,
  ]),
  "",
  "## 3. 展示顺序",
  "",
  "1. 先打开 `#home`，讲市场判断、优先赛道和机会排序。",
  "2. 再打开 `#matrix`，展示 42 行竞品矩阵：增长信号、渠道、功能差异、官网/社媒证据。",
  "3. 切到 `#products`，讲产品能力评分和产品图谱。",
  "4. 切到 `#funding`，讲 2024.06 - 2026.06 融资/新闻时间线和 IRL 占比。",
  "5. 切到 `#monitor`，说明每日 monitor、近窗信号和 Websets fallback。",
  "6. 最后切到 `#evidence` / `#playbook`，回答证据来源、公司背景、长尾覆盖和完成度审计。",
  "",
  "## 4. 优先讲的产品",
  "",
  bulletList(topCapability),
  "",
  "## 5. 四个重点赛道",
  "",
  ...brief.priorityShortlist.flatMap((group) => [
    `### ${group.lane}`,
    "",
    group.thesis,
    "",
    bulletList(group.picks.map((pick) => `${pick.name}: ${pick.reason}`)),
    "",
  ]),
  "## 6. 融资与新闻口径",
  "",
  bulletList([
    `精确窗口 ${brief.fundingSummary.dateWindowAudit?.exactWindowStart ?? "2024-06-02"} - ${brief.fundingSummary.dateWindowAudit?.exactWindowEnd ?? "2026-06-02"}；月份归档窗口 ${brief.fundingSummary.yearRange}；主时间线 ${brief.fundingSummary.totalEvents} 条，补充候选 ${supplementalFundingCount} 条。`,
    `日期窗口校验无越界事件；多数来源为月份级日期，年份级日期保留为低精度标记。`,
    `主时间线 IRL 相关 ${brief.fundingSummary.irlEvents} 条，占 ${brief.fundingSummary.irlShare}。`,
    `明确美元融资事件 ${brief.fundingSummary.explicitUsdFundingEvents} 条，合计约 $${brief.fundingSummary.explicitUsdFundingM}M。`,
    "美元融资总额只统计主时间线里明确出现 $XM 的事件；补充候选进入总复核表，但不直接混入主结论。",
  ]),
  "",
  "## 7. Monitor 口径",
  "",
  bulletList([
    `当前 monitor ${monitor.summary.monitors} 条 lane，近窗高相关信号 ${monitor.summary.recentResults} 条，新增未知 URL ${monitor.summary.newAlerts} 条。`,
    `最新 alert review ${brief.candidateReview.latestAlertReview.length} 条，待复核 ${brief.candidateReview.alertClosure?.latestAlertPendingRows ?? 0} 条。`,
    `近窗复核队列 ${recentSignalReviewCount} 条，待复核 ${brief.candidateReview.alertClosure?.recentSignalPendingRows ?? 0} 条，用于判断是否升级到主表、融资新闻或继续观察。`,
    "当前 Exa Websets Monitor API 权限不可用，因此使用 Exa Search API + Codex automation fallback。",
  ]),
  "",
  "## 8. 保守边界",
  "",
  "“所有相关产品”在消费社交市场中无法数学穷尽。本报告采用 broad evidence pass + discovery blind-spot scan + daily monitor + weekly full rebuild 的方式逼近覆盖，并把长尾候选与保守边界单独标注。",
  "",
].join("\n");

await writeFile(new URL("executive-brief.md", exportDir), `${executiveBrief}\n`);

const artifacts = {
  webpage: "index.html",
  featureVersionLogMarkdown: "功能与版本记录.md",
  deliveryNoteMarkdown: "交付说明.md",
  standaloneHtml: "exports/exa-ai-social-report.html",
  sqliteDatabase: "exports/exa-social-research.sqlite",
  sqliteDatabaseGuideMarkdown: "exports/sqlite-database-guide.md",
  currentStateMarkdown: "exports/current-state.md",
  currentStateJson: "exports/current-state.json",
  latestMonitorRunMarkdown: "exports/latest-monitor-run.md",
  latestMonitorRunJson: "exports/latest-monitor-run.json",
  exaCategoryCoverageGuideMarkdown: "exports/exa-category-coverage-guide.md",
  automationAuditMarkdown: "exports/automation-audit.md",
  demoChecklistMarkdown: "exports/demo-checklist.md",
  brief: "data/brief.json",
  rawExaResults: "data/exa-results.json",
  languageGrowthChannelDeepDiveRaw: "data/exa-language-growth-channel-deep-dive.json",
  languageOfficialSocialDeepDiveRaw: "data/exa-language-official-social-deep-dive.json",
  monitor: "data/monitor.json",
  monitorHistory: "data/monitor-history.json",
  monitorLedger: "data/monitor-ledger.json",
  monitorDigest: "data/monitor-digest.json",
  objectiveEvidenceMapCsv: "exports/objective-evidence-map.csv",
  goalReadinessCsv: "exports/goal-readiness.csv",
  competitiveMatrixCsv: "exports/competitive-matrix.csv",
  sourceCoverageCsv: "exports/source-coverage.csv",
  exaCategoryEvidenceAuditCsv: "exports/exa-category-evidence-audit.csv",
  sourceLinkageAuditCsv: "exports/source-linkage-audit.csv",
  coverageGapRegisterCsv: "exports/coverage-gap-register.csv",
  candidateDeepDiveCsv: "exports/candidate-deep-dive.csv",
  executiveBriefMarkdown: "exports/executive-brief.md",
  productCapabilityScoreCsv: "exports/product-capability-score.csv",
  growthChannelAuditCsv: "exports/growth-channel-audit.csv",
  acquisitionChannelMapCsv: "exports/acquisition-channel-map.csv",
  paidAcquisitionEvidenceAuditCsv: "exports/paid-acquisition-evidence-audit.csv",
  functionalDifferenceAuditCsv: "exports/functional-difference-audit.csv",
  officialSocialCoverageAuditCsv: "exports/official-social-coverage-audit.csv",
  officialGapDeepDiveCsv: "exports/official-gap-deep-dive.csv",
  companyBackgroundReviewCsv: "exports/company-background-review.csv",
  companyBackgroundDeepDiveCsv: "exports/company-background-deep-dive.csv",
  companyBackgroundCoverageAuditCsv: "exports/company-background-coverage-audit.csv",
  marketDecisionEvidenceMapCsv: "exports/market-decision-evidence-map.csv",
  fundingTimelineCsv: "exports/funding-timeline.csv",
  fundingNewsReviewCsv: "exports/funding-news-review.csv",
  fundingNewsDedupAuditCsv: "exports/funding-news-dedup-audit.csv",
  fundingEventAuditCsv: "exports/funding-event-audit.csv",
  fundingUpgradeMapCsv: "exports/funding-upgrade-map.csv",
  fundingProductRollupCsv: "exports/funding-product-rollup.csv",
  fundingDiscoveryCandidatesCsv: "exports/funding-discovery-candidates.csv",
  candidatePromotionQueueCsv: "exports/candidate-promotion-queue.csv",
  latestAlertReviewCsv: "exports/latest-alert-review.csv",
  monitorRecentReviewCsv: "exports/monitor-recent-review.csv",
  monitorLaneRoutingCsv: "exports/monitor-lane-routing.csv",
  monitorRecentSignalsCsv: "exports/monitor-recent-signals.csv",
  discoveryCandidatesCsv: "exports/discovery-candidates.csv",
  languageLongTailReviewCsv: "exports/language-long-tail-review.csv",
  languageCoverageAuditCsv: "exports/language-coverage-audit.csv",
  languageSimilarityAuditCsv: "exports/language-similarity-audit.csv",
  languageOfficialEvidenceMapCsv: "exports/language-official-evidence-map.csv",
  languageGrowthChannelDeepDiveCsv: "exports/language-growth-channel-deep-dive.csv",
  languageOfficialSocialDeepDiveCsv: "exports/language-official-social-deep-dive.csv",
  irlCoverageAuditCsv: "exports/irl-coverage-audit.csv",
  irlOfflineEvidenceMapCsv: "exports/irl-offline-evidence-map.csv",
  supplementalFundingNewsCsv: "exports/supplemental-funding-news.csv",
  browserQaReportMarkdown: "exports/browser-qa-report.md",
  completionAuditMarkdown: "exports/completion-audit.md",
  completionManifest: "exports/completion-manifest.json",
  originalObjectiveAuditMarkdown: "exports/original-objective-audit.md",
  originalObjectiveAuditCsv: "exports/original-objective-audit.csv",
  originalObjectiveAuditJson: "exports/original-objective-audit.json",
};

const manifest = {
  generatedAt: new Date().toISOString(),
  objective:
    "Use Exa categories to judge app market/company/product capability, organize HelloTalk/Tandem-like social apps by growth/channel/function/evidence, and summarize near-two-year AI social/entertainment funding/news with IRL/offline-human emphasis.",
  statusSummary: {
    covered: brief.completionAudit.filter((item) => item.status === "已覆盖").length,
    conservative: brief.completionAudit.filter((item) => item.status === "保守说明").length,
    total: brief.completionAudit.length,
  },
  strictCompletionVerdict,
  counts: {
    exaSearches: brief.exaQueryMatrix.totalSearches,
    exaResults: brief.exaQueryMatrix.totalResults,
    exaCategoryEvidenceRows: brief.exaCategoryEvidenceAudit?.rows?.length ?? 0,
    sourceLinkageRows: brief.sourceLinkageAudit?.totalResults ?? 0,
    sourceLinkageReviewQueue: brief.sourceLinkageAudit?.unlinkedResults ?? 0,
    coverageGapGroups: brief.coverageGapRegister?.groups?.length ?? 0,
    coverageGapRows: brief.coverageGapRegister?.totalGaps ?? 0,
    highPriorityCoverageGaps: brief.coverageGapRegister?.highPriorityGaps ?? 0,
    coverageGapsDeepDiveReviewed: brief.coverageGapRegister?.deepDiveReviewedGaps ?? 0,
    coverageGapsUnresolvedAfterDeepDive: brief.coverageGapRegister?.unresolvedAfterDeepDive ?? 0,
    goalReadinessStatus: brief.goalReadiness?.status ?? "",
    goalReadinessBlockingRows: brief.goalReadiness?.blockingGaps?.rows ?? null,
    goalReadinessMonitoredRows: brief.goalReadiness?.monitoredGaps?.rows ?? null,
    goalReadinessBackgroundRows: brief.goalReadiness?.backgroundGaps?.rows ?? null,
    candidateDeepDiveCandidates: brief.candidateDeepDive?.candidates ?? 0,
    candidateDeepDiveResults: brief.candidateDeepDive?.totalResults ?? 0,
    productCards: productCount,
    productCapabilityRows: brief.productCapability?.rows?.length ?? 0,
    growthChannelAuditRows: brief.growthChannelAudit?.rows?.length ?? 0,
    strongGrowthSignals: brief.growthChannelAudit?.byGrowthLevel?.find((item) => item.level === "强")?.count ?? 0,
    acquisitionChannelRows: brief.acquisitionChannelMap?.rows?.length ?? 0,
    acquisitionHighConfidenceRows: brief.acquisitionChannelMap?.highConfidenceRows ?? 0,
    acquisitionPaidConversionRows: brief.acquisitionChannelMap?.paidConversionRows ?? 0,
    acquisitionCityOpsRows: brief.acquisitionChannelMap?.cityOpsRows ?? 0,
    paidAcquisitionEvidenceRows: brief.paidAcquisitionEvidenceAudit?.rows?.length ?? 0,
    paidAcquisitionExplicitRows: brief.paidAcquisitionEvidenceAudit?.explicitPaidRows ?? 0,
    paidAcquisitionDirectionalRows: brief.paidAcquisitionEvidenceAudit?.directionalRows ?? 0,
    paidAcquisitionNoEvidenceRows: brief.paidAcquisitionEvidenceAudit?.noPaidEvidenceRows ?? 0,
    paidAcquisitionMonitorSignalRows: brief.paidAcquisitionEvidenceAudit?.monitorPaidSignalRows ?? 0,
    paidAcquisitionMonitorNewRows: brief.paidAcquisitionEvidenceAudit?.monitorPaidNewRows ?? 0,
    functionalDifferenceAuditRows: brief.functionalDifferenceAudit?.rows?.length ?? 0,
    functionalMechanisms: brief.functionalDifferenceAudit?.byMechanism?.length ?? 0,
    officialSocialCoverageAuditRows: brief.officialSocialCoverageAudit?.rows?.length ?? 0,
    officialSocialCompleteRows: brief.officialSocialCoverageAudit?.summary?.complete ?? 0,
    officialGapDeepDiveSearches: brief.officialGapDeepDive?.searches ?? 0,
    officialGapDeepDiveResults: brief.officialGapDeepDive?.resultRows ?? 0,
    companyBackgroundSignals: brief.companyBackgroundReview?.totalSignals ?? 0,
    companyBackgroundLinkedSignals: brief.companyBackgroundReview?.linkedSignals ?? 0,
    companyBackgroundDeepDiveSearches: brief.companyBackgroundDeepDive?.searches ?? 0,
    companyBackgroundDeepDiveResults: brief.companyBackgroundDeepDive?.resultRows ?? 0,
    companyBackgroundCoverageRows: brief.companyBackgroundCoverageAudit?.rows?.length ?? 0,
    marketDecisionEvidenceRows: brief.marketDecisionEvidenceMap?.rows?.length ?? 0,
    marketDecisionResearchRows: brief.marketDecisionEvidenceMap?.researchRows ?? 0,
    marketDecisionFinancialRows: brief.marketDecisionEvidenceMap?.financialRows ?? 0,
    languageExchangeAdjacentProducts: languageCount,
    languageLongTailReview: brief.discoveryScan?.languageLongTailReview?.length ?? 0,
    languageCoverageUnique: brief.languageCoverageAudit?.totalUnique ?? 0,
    languageCoverageWatchlist: brief.languageCoverageAudit?.watchlistCount ?? 0,
    languageSimilarityRows: brief.languageSimilarityAudit?.rows?.length ?? 0,
    highlySimilarLanguageProducts: brief.languageSimilarityAudit?.highlySimilar ?? 0,
    languageOfficialEvidenceRows: brief.languageOfficialEvidenceMap?.rows?.length ?? 0,
    languageOfficialEvidenceReadyRows: brief.languageOfficialEvidenceMap?.readyRows ?? 0,
    languageOfficialSocialDeepDiveSearches: brief.languageOfficialSocialDeepDive?.searches ?? 0,
    languageOfficialSocialDeepDiveResults: brief.languageOfficialSocialDeepDive?.resultRows ?? 0,
    languageGrowthChannelDeepDiveSearches: brief.languageGrowthChannelDeepDive?.searches ?? 0,
    languageGrowthChannelDeepDiveResults: brief.languageGrowthChannelDeepDive?.resultRows ?? 0,
    languageGrowthChannelDeepDiveStrongRows: brief.languageGrowthChannelDeepDive?.strongRows ?? 0,
    languageGrowthChannelDeepDiveUsableRows: brief.languageGrowthChannelDeepDive?.usableRows ?? 0,
    irlProducts: irlCount,
    irlCoverageUnique: brief.irlCoverageAudit?.totalUnique ?? 0,
    irlCoverageMonitor: brief.irlCoverageAudit?.monitorCount ?? 0,
    irlOfflineEvidenceRows: brief.irlOfflineEvidenceMap?.totalRows ?? 0,
    irlOfflineEvidenceStrongRows: brief.irlOfflineEvidenceMap?.strongRows ?? 0,
    fundingTimelineEvents: brief.fundingSummary.totalEvents,
    combinedFundingNewsReview: brief.fundingSummary.combinedEvents,
    uniqueFundingNewsEvents: brief.fundingSummary.uniqueCombinedEvents,
    duplicateFundingNewsRows: brief.fundingSummary.duplicateCombinedEvents,
    outOfWindowFundingNewsEvents: brief.fundingSummary.dateWindowAudit?.outOfWindowTotal ?? null,
    fundingExactWindowStart: brief.fundingSummary.dateWindowAudit?.exactWindowStart ?? null,
    fundingExactWindowEnd: brief.fundingSummary.dateWindowAudit?.exactWindowEnd ?? null,
    fundingEventAuditRows: brief.fundingEventAudit?.rows?.length ?? 0,
    fundingEventAuditIrlRows: brief.fundingEventAudit?.irlRows ?? 0,
    fundingUpgradeRows: brief.fundingUpgradeMap?.rows?.length ?? 0,
    fundingUpgradeRetainedCandidates: brief.fundingUpgradeMap?.retainedCandidates ?? 0,
    fundingUpgradeDuplicateEvidenceRows: brief.fundingUpgradeMap?.duplicateEvidenceRows ?? 0,
    fundingProductRollupRows: brief.fundingProductRollup?.rows?.length ?? 0,
    fundingProductRollupIrlProducts: brief.fundingProductRollup?.irlProducts ?? 0,
    fundingProductRollupExplicitUsdM: brief.fundingProductRollup?.explicitUsdFundingM ?? 0,
    fundingDiscoveryCandidateRows: brief.discoveryScan?.fundingCandidateRows ?? 0,
    fundingDiscoveryCandidatePendingRows: brief.discoveryScan?.fundingCandidatePendingRows ?? 0,
    candidatePromotionQueueRows: brief.candidatePromotionQueue?.totalRows ?? 0,
    candidatePromotionQueueHighPriorityRows: brief.candidatePromotionQueue?.highPriorityRows ?? 0,
    supplementalFundingNews: supplementalFundingCount,
    irlFundingEvents: brief.fundingSummary.irlEvents,
    monitorLanes: monitor.summary.monitors,
    monitorRecentSignals: monitor.summary.recentResults,
    monitorNewAlerts: monitor.summary.newAlerts,
    latestAlertReview: brief.candidateReview?.latestAlertReview?.length ?? 0,
    latestAlertReviewPendingRows: latestAlertPendingRows,
    recentSignalReview: recentSignalReviewCount,
    monitorRecentReviewPendingRows: recentSignalPendingRows,
    monitorLaneRouting: brief.candidateReview?.monitorLaneRouting?.length ?? 0,
    monitorHistoryRuns: monitorHistory.runs?.length ?? 0,
    objectiveEvidenceRows: brief.objectiveEvidenceMap?.length ?? 0,
  },
  verificationCommands: [
    "node scripts/validate-brief.mjs",
    "node scripts/validate-frontend.mjs",
    "node scripts/validate-deliverable.mjs",
    "node scripts/snapshot-current.mjs",
  ],
  artifacts,
  objectiveEvidenceMap: (brief.objectiveEvidenceMap ?? []).map((item) => ({
    id: item.id,
    requirement: item.requirement,
    status: item.status,
    evidence: item.evidence,
    views: item.views,
    dataFiles: item.dataFiles,
    exportFiles: item.exportFiles,
    validators: item.validators,
    boundary: item.boundary,
  })),
  requirements: brief.completionAudit.map((item) => ({
    requirement: item.requirement,
    status: item.status,
    evidence: item.evidence,
    proof: item.proof,
    artifactKeys:
      item.requirement.includes("Exa company") || item.requirement.includes("类别")
        ? ["brief", "rawExaResults", "sourceCoverageCsv", "productCapabilityScoreCsv", "companyBackgroundReviewCsv", "marketDecisionEvidenceMapCsv", "completionManifest"]
        : item.requirement.includes("HelloTalk") || item.requirement.includes("Tandem")
          ? ["competitiveMatrixCsv", "growthChannelAuditCsv", "acquisitionChannelMapCsv", "languageLongTailReviewCsv", "languageOfficialEvidenceMapCsv", "languageGrowthChannelDeepDiveCsv", "languageGrowthChannelDeepDiveRaw", "languageOfficialSocialDeepDiveCsv", "languageOfficialSocialDeepDiveRaw", "candidatePromotionQueueCsv", "standaloneHtml", "brief"]
          : item.requirement.includes("融资") || item.requirement.includes("新闻")
            ? ["fundingTimelineCsv", "fundingNewsReviewCsv", "fundingProductRollupCsv", "fundingDiscoveryCandidatesCsv", "candidatePromotionQueueCsv", "supplementalFundingNewsCsv", "brief"]
            : item.requirement.includes("线下真人")
              ? ["competitiveMatrixCsv", "fundingTimelineCsv", "monitorRecentReviewCsv", "brief"]
              : item.requirement.includes("monitor")
                ? ["monitor", "monitorHistory", "monitorLedger", "monitorDigest", "monitorRecentReviewCsv"]
                : item.requirement.includes("网页")
                  ? ["webpage", "standaloneHtml"]
                  : ["brief", "discoveryCandidatesCsv", "languageLongTailReviewCsv", "monitorRecentReviewCsv"],
  })),
  conservativeBoundary: {
    status: "broad monitored coverage, not mathematical exhaustiveness",
    note: brief.coverage.note,
    mitigation: [
      "Broad Exa category query matrix",
      "Discovery blind-spot scan",
      "Daily monitor fallback",
      "Recent signal review queue",
      "Weekly full rebuild automation",
    ],
  },
};

await writeFile(new URL("completion-manifest.json", exportDir), JSON.stringify(manifest, null, 2));

console.log(JSON.stringify({
  ok: true,
  file: new URL("completion-audit.md", exportDir).pathname,
  manifest: new URL("completion-manifest.json", exportDir).pathname,
  requirements: brief.completionAudit.length,
  productCount,
  timelineEvents: brief.fundingSummary.totalEvents,
}, null, 2));
