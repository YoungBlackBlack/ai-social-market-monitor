import { mkdir, readFile, writeFile } from "node:fs/promises";

const exportDir = new URL("../exports/", import.meta.url);

const brief = JSON.parse(await readFile(new URL("../data/brief.json", import.meta.url), "utf8"));
const monitor = JSON.parse(await readFile(new URL("../data/monitor.json", import.meta.url), "utf8"));
const monitorHistory = JSON.parse(await readFile(new URL("../data/monitor-history.json", import.meta.url), "utf8"));
const monitorLedger = JSON.parse(await readFile(new URL("../data/monitor-ledger.json", import.meta.url), "utf8"));
const objectiveAudit = JSON.parse(await readFile(new URL("../exports/original-objective-audit.json", import.meta.url), "utf8"));

const productCount = brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0);
const paidClaimCounts = (brief.paidAcquisitionEvidenceAudit?.rows ?? []).reduce((acc, row) => {
  acc[row.claimLevel] = (acc[row.claimLevel] ?? 0) + 1;
  return acc;
}, {});
const monitorZeroNewAlertStreak = (monitorHistory.runs ?? []).findIndex((run) => (run.summary?.newAlerts ?? 0) > 0);
const zeroNewAlertRunCount = monitorZeroNewAlertStreak === -1 ? (monitorHistory.runs ?? []).length : monitorZeroNewAlertStreak;

const state = {
  generatedAt: new Date().toISOString(),
  status: "presentation-ready-with-monitoring-boundary",
  strictCompletionStatus: brief.strictCompletionVerdict.status,
  strictCompletionPresentationReady: brief.strictCompletionVerdict.presentationReady,
  counts: {
    products: productCount,
    languageAdjacentUnique: brief.languageCoverageAudit.totalUnique,
    languageMainTableProducts: brief.languageCoverageAudit.coreCount,
    fundingTimelineEvents: brief.fundingSummary.totalEvents,
    supplementalFundingEvents: brief.fundingSummary.supplementalEvents,
    fundingReviewRows: brief.fundingSummary.combinedEvents,
    uniqueFundingEvents: brief.fundingSummary.uniqueCombinedEvents,
    fundingIntegrityOutOfWindowRows: brief.fundingIntegritySummary.outOfWindowRows,
    fundingIntegrityDuplicateRows: brief.fundingIntegritySummary.duplicateRows,
    fundingIntegrityIrlUniqueRows: brief.fundingIntegritySummary.irlUniqueRows,
    fundingIntegrityProductRollupRows: brief.fundingIntegritySummary.productRollupRows,
    irlOfflineEvidenceRows: brief.irlOfflineEvidenceMap.totalRows,
    irlMonitorLinkedRows: brief.irlOfflineEvidenceMap.monitorLinkedRows,
    exaSearches: brief.exaQueryMatrix.totalSearches,
    exaResults: brief.exaQueryMatrix.totalResults,
    monitorLanes: monitor.summary.monitors,
    monitorRecentSignals: monitor.summary.recentResults,
    monitorNewAlerts: monitor.summary.newAlerts,
    monitorHistoryRuns: monitorHistory.runs?.length ?? 0,
    monitorLedgerItems: monitorLedger.totalItems ?? monitorLedger.items?.length ?? 0,
    monitorZeroNewAlertStreak: zeroNewAlertRunCount,
    latestAlertPendingRows: brief.candidateReview.alertClosure.latestAlertPendingRows,
    recentSignalPendingRows: brief.candidateReview.alertClosure.recentSignalPendingRows,
    paidAcquisitionExplicitRows: brief.paidAcquisitionEvidenceAudit.explicitPaidRows,
    paidAcquisitionDirectionalRows: brief.paidAcquisitionEvidenceAudit.directionalRows,
    paidAcquisitionNoEvidenceRows: brief.paidAcquisitionEvidenceAudit.noPaidEvidenceRows,
    paidAcquisitionClaimablePaidRows: paidClaimCounts["可声称付费投放"] ?? 0,
    paidAcquisitionChannelOnlyClaimRows: paidClaimCounts["只能声称渠道线索"] ?? 0,
    paidAcquisitionNoPaidClaimRows: paidClaimCounts["不能声称投放"] ?? 0,
    paidAcquisitionMonitorSignalRows: brief.paidAcquisitionEvidenceAudit.monitorPaidSignalRows,
    paidAcquisitionMonitorNewRows: brief.paidAcquisitionEvidenceAudit.monitorPaidNewRows,
    originalObjectiveAuditRows: objectiveAudit.rows.length,
  },
  entrypoints: {
    localWeb: "http://127.0.0.1:8000/#home",
    standaloneHtml: "exports/exa-ai-social-report.html",
    sqliteDatabase: "exports/exa-social-research.sqlite",
    sqliteDatabaseGuide: "exports/sqlite-database-guide.md",
    latestMonitorRun: "exports/latest-monitor-run.md",
    latestMonitorRunJson: "exports/latest-monitor-run.json",
    exaCategoryCoverageGuide: "exports/exa-category-coverage-guide.md",
    automationAudit: "exports/automation-audit.md",
    deliveryNote: "交付说明.md",
    originalObjectiveAudit: "exports/original-objective-audit.md",
    completionAudit: "exports/completion-audit.md",
    snapshots: "exports/snapshots/",
  },
  boundary:
    "The deliverable is presentation-ready broad monitored coverage. It does not claim mathematical exhaustiveness for all products/news in a live consumer-social market.",
  nextRefresh: [
    "Daily monitor: node scripts/run-all.mjs",
    "Weekly/full rebuild: node scripts/run-all.mjs --full",
    "Hard checks: node scripts/validate-brief.mjs && node scripts/validate-frontend.mjs && node scripts/validate-deliverable.mjs",
  ],
};

function bullet(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

const markdown = [
  "# 当前状态锁定",
  "",
  `生成时间：${state.generatedAt}`,
  "",
  "## 状态",
  "",
  bullet([
    `交付状态：${state.status}`,
    `严格完成判定：${state.strictCompletionStatus}`,
    `presentationReady：${state.strictCompletionPresentationReady}`,
    `边界：${state.boundary}`,
  ]),
  "",
  "## 核心数字",
  "",
  bullet([
    `产品主表：${state.counts.products} 个。`,
    `HelloTalk/Tandem 相邻唯一覆盖：${state.counts.languageAdjacentUnique} 个，其中主表语言产品 ${state.counts.languageMainTableProducts} 个。`,
    `近两年融资/新闻：主时间线 ${state.counts.fundingTimelineEvents} 条，补充候选 ${state.counts.supplementalFundingEvents} 条，合并复核 ${state.counts.fundingReviewRows} 行，去重唯一事件 ${state.counts.uniqueFundingEvents} 个；窗口外 ${state.counts.fundingIntegrityOutOfWindowRows} 行，重复 ${state.counts.fundingIntegrityDuplicateRows} 行，IRL 唯一 ${state.counts.fundingIntegrityIrlUniqueRows} 行，产品聚合 ${state.counts.fundingIntegrityProductRollupRows} 行。`,
    `IRL/线下真人证据地图：${state.counts.irlOfflineEvidenceRows} 行，其中 monitor 链接 ${state.counts.irlMonitorLinkedRows} 行。`,
    `Exa 查询：${state.counts.exaSearches} 组，${state.counts.exaResults} 条结果。`,
    `Monitor：${state.counts.monitorLanes} 条 lane，${state.counts.monitorRecentSignals} 条近窗信号，${state.counts.monitorNewAlerts} 条新增提醒；历史运行 ${state.counts.monitorHistoryRuns} 次，提醒台账 ${state.counts.monitorLedgerItems} 条，连续 ${state.counts.monitorZeroNewAlertStreak} 次无新增提醒。`,
    `待复核：latest alert ${state.counts.latestAlertPendingRows}，recent signal ${state.counts.recentSignalPendingRows}。`,
    `投放/付费获客：产品级明确投放 ${state.counts.paidAcquisitionExplicitRows}，方向性渠道 ${state.counts.paidAcquisitionDirectionalRows}，无投放证据 ${state.counts.paidAcquisitionNoEvidenceRows}；可声称付费投放 ${state.counts.paidAcquisitionClaimablePaidRows}，只能声称渠道线索 ${state.counts.paidAcquisitionChannelOnlyClaimRows}，不能声称投放 ${state.counts.paidAcquisitionNoPaidClaimRows}；monitor 候选 ${state.counts.paidAcquisitionMonitorSignalRows}，本轮新增 ${state.counts.paidAcquisitionMonitorNewRows}。`,
    `原始目标逐条审计：${state.counts.originalObjectiveAuditRows} 行。`,
  ]),
  "",
  "## 展示入口",
  "",
  bullet(Object.entries(state.entrypoints).map(([key, value]) => `${key}: \`${value}\``)),
  "",
  "## 刷新命令",
  "",
  bullet(state.nextRefresh),
  "",
].join("\n");

await mkdir(exportDir, { recursive: true });
await writeFile(new URL("current-state.json", exportDir), `${JSON.stringify(state, null, 2)}\n`);
await writeFile(new URL("current-state.md", exportDir), `${markdown}\n`);

console.log(JSON.stringify({
  ok: true,
  files: ["exports/current-state.json", "exports/current-state.md"],
  counts: state.counts,
}, null, 2));
