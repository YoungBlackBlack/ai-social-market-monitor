import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";

const root = new URL("..", import.meta.url);
const snapshotBase = new URL("../exports/snapshots/", import.meta.url);
const keepCount = Number(process.env.SNAPSHOT_KEEP ?? 30);
const stamp = new Date()
  .toISOString()
  .replace(/\.\d{3}Z$/, "Z")
  .replaceAll(":", "")
  .replaceAll("T", "-")
  .replace("Z", "");
const snapshotRoot = new URL(`${stamp}/`, snapshotBase);

const rootFiles = ["index.html", "styles.css", "app.js", "README.md", "功能与版本记录.md", "交付说明.md"];
const dataFiles = [
  "brief.json",
  "exa-results.json",
  "exa-synthesis.json",
  "exa-social-profiles.json",
  "exa-official-gap-deep-dive.json",
  "exa-discovery-scan.json",
  "exa-candidate-deep-dive.json",
  "exa-lingopraxis-deep-dive.json",
  "exa-residual-signal-deep-dive.json",
  "exa-company-background-deep-dive.json",
  "exa-language-growth-channel-deep-dive.json",
  "exa-language-official-social-deep-dive.json",
  "exa-websets-monitor.json",
  "monitor.json",
  "monitor-history.json",
  "monitor-ledger.json",
  "monitor-digest.json",
];
const exportFiles = [
  "exa-ai-social-report.html",
  "exa-social-research.sqlite",
  "sqlite-database-guide.md",
  "browser-qa-report.md",
  "current-state.md",
  "current-state.json",
  "latest-monitor-run.md",
  "latest-monitor-run.json",
  "exa-category-coverage-guide.md",
  "automation-audit.md",
  "demo-checklist.md",
  "executive-brief.md",
  "objective-evidence-map.csv",
  "goal-readiness.csv",
  "competitive-matrix.csv",
  "source-coverage.csv",
  "exa-category-evidence-audit.csv",
  "source-linkage-audit.csv",
  "coverage-gap-register.csv",
  "candidate-deep-dive.csv",
  "residual-signal-review.csv",
  "product-capability-score.csv",
  "growth-channel-audit.csv",
  "acquisition-channel-map.csv",
  "paid-acquisition-evidence-audit.csv",
  "functional-difference-audit.csv",
  "official-social-coverage-audit.csv",
  "official-gap-deep-dive.csv",
  "language-official-social-deep-dive.csv",
  "company-background-review.csv",
  "company-background-deep-dive.csv",
  "company-background-coverage-audit.csv",
  "market-decision-evidence-map.csv",
  "funding-timeline.csv",
  "funding-news-review.csv",
  "funding-news-dedup-audit.csv",
  "funding-event-audit.csv",
  "funding-upgrade-map.csv",
  "funding-product-rollup.csv",
  "funding-discovery-candidates.csv",
  "candidate-promotion-queue.csv",
  "latest-alert-review.csv",
  "monitor-recent-review.csv",
  "monitor-lane-routing.csv",
  "monitor-recent-signals.csv",
  "discovery-candidates.csv",
  "language-long-tail-review.csv",
  "language-coverage-audit.csv",
  "language-similarity-audit.csv",
  "language-official-evidence-map.csv",
  "language-growth-channel-deep-dive.csv",
  "irl-coverage-audit.csv",
  "irl-offline-evidence-map.csv",
  "supplemental-funding-news.csv",
  "completion-audit.md",
  "completion-manifest.json",
  "original-objective-audit.md",
  "original-objective-audit.csv",
  "original-objective-audit.json",
];

async function copyInto(relativePath, destinationPath = relativePath) {
  await copyFile(new URL(relativePath, root), new URL(destinationPath, snapshotRoot));
}

await mkdir(snapshotRoot, { recursive: true });
await mkdir(new URL("data/", snapshotRoot), { recursive: true });
await mkdir(new URL("exports/", snapshotRoot), { recursive: true });

await Promise.all(rootFiles.map((file) => copyInto(file)));
await Promise.all(dataFiles.map((file) => copyInto(`data/${file}`)));
await Promise.all(exportFiles.map((file) => copyInto(`exports/${file}`)));

const brief = JSON.parse(await readFile(new URL("data/brief.json", snapshotRoot), "utf8"));
const monitor = JSON.parse(await readFile(new URL("data/monitor.json", snapshotRoot), "utf8"));
const monitorHistory = JSON.parse(await readFile(new URL("data/monitor-history.json", snapshotRoot), "utf8"));
const monitorLedger = JSON.parse(await readFile(new URL("data/monitor-ledger.json", snapshotRoot), "utf8"));
const originalObjectiveAudit = JSON.parse(await readFile(new URL("exports/original-objective-audit.json", snapshotRoot), "utf8"));
const currentState = JSON.parse(await readFile(new URL("exports/current-state.json", snapshotRoot), "utf8"));
const productCount = brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0);
const paidClaimCounts = (brief.paidAcquisitionEvidenceAudit?.rows ?? []).reduce((acc, row) => {
  acc[row.claimLevel] = (acc[row.claimLevel] ?? 0) + 1;
  return acc;
}, {});
const monitorZeroNewAlertStreak = (monitorHistory.runs ?? []).findIndex((run) => (run.summary?.newAlerts ?? 0) > 0);
const zeroNewAlertRunCount = monitorZeroNewAlertStreak === -1 ? (monitorHistory.runs ?? []).length : monitorZeroNewAlertStreak;
const sqlite = new DatabaseSync(new URL("exports/exa-social-research.sqlite", snapshotRoot).pathname, { readOnly: true });
const sqliteCounts = Object.fromEntries(
  [
    "products",
    "funding_events",
    "monitor_signals",
    "source_linkage",
    "coverage_gaps",
    "audit_rows",
    "view_language_adjacent_products",
    "view_irl_funding_news",
    "view_latest_monitor_signals",
    "view_unresolved_coverage_gaps",
    "view_paid_acquisition_claims",
  ].map((table) => [
    table,
    sqlite.prepare(`SELECT count(*) AS count FROM ${table}`).get().count,
  ]),
);
sqlite.close();

const manifest = {
  savedAt: new Date().toISOString(),
  purpose: "Point-in-time snapshot of the Exa AI social market research page, data, monitor output, and export artifacts.",
  counts: {
    products: productCount,
    fundingTimelineEvents: brief.fundingTimeline.length,
    supplementalFundingNews: brief.discoveryScan?.supplementalFundingNews?.length ?? 0,
    uniqueFundingNewsEvents: brief.fundingSummary?.uniqueCombinedEvents ?? 0,
    duplicateFundingNewsRows: brief.fundingSummary?.duplicateCombinedEvents ?? 0,
    fundingIntegrityOutOfWindowRows: brief.fundingIntegritySummary?.outOfWindowRows ?? 0,
    fundingIntegrityDuplicateRows: brief.fundingIntegritySummary?.duplicateRows ?? 0,
    fundingIntegrityIrlUniqueRows: brief.fundingIntegritySummary?.irlUniqueRows ?? 0,
    fundingIntegrityProductRollupRows: brief.fundingIntegritySummary?.productRollupRows ?? 0,
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
    candidatePromotionQueueResolvedMarketRows: brief.candidatePromotionQueue?.resolvedMarketRows ?? 0,
    candidatePromotionQueueLowConfidenceMarketRows: brief.candidatePromotionQueue?.lowConfidenceMarketRows ?? 0,
    candidatePromotionQueueDuplicateFundingRows: brief.candidatePromotionQueue?.duplicateFundingRows ?? 0,
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
    irlCoverageUnique: brief.irlCoverageAudit?.totalUnique ?? 0,
    irlCoverageMonitor: brief.irlCoverageAudit?.monitorCount ?? 0,
    irlOfflineEvidenceRows: brief.irlOfflineEvidenceMap?.totalRows ?? 0,
    irlOfflineEvidenceStrongRows: brief.irlOfflineEvidenceMap?.strongRows ?? 0,
    sourceLinkageRows: brief.sourceLinkageAudit?.totalResults ?? 0,
    sourceLinkageReviewQueue: brief.sourceLinkageAudit?.unlinkedResults ?? 0,
    coverageGapGroups: brief.coverageGapRegister?.groups?.length ?? 0,
    coverageGapRows: brief.coverageGapRegister?.totalGaps ?? 0,
    highPriorityCoverageGaps: brief.coverageGapRegister?.highPriorityGaps ?? 0,
    coverageGapsDeepDiveReviewed: brief.coverageGapRegister?.deepDiveReviewedGaps ?? 0,
    coverageGapsUnresolvedAfterDeepDive: brief.coverageGapRegister?.unresolvedAfterDeepDive ?? 0,
    goalReadinessStatus: brief.goalReadiness?.status ?? "",
    strictCompletionStatus: brief.strictCompletionVerdict?.status ?? "",
    strictCompletionPresentationReady: brief.strictCompletionVerdict?.presentationReady ?? false,
    strictCompletionLatestAlertPendingRows: brief.strictCompletionVerdict?.latestAlertPendingRows ?? null,
    strictCompletionRecentSignalPendingRows: brief.strictCompletionVerdict?.recentSignalPendingRows ?? null,
    strictCompletionBlockingGapRows: brief.strictCompletionVerdict?.blockingGapRows ?? null,
    goalReadinessBlockingRows: brief.goalReadiness?.blockingGaps?.rows ?? null,
    goalReadinessMonitoredRows: brief.goalReadiness?.monitoredGaps?.rows ?? null,
    goalReadinessBackgroundRows: brief.goalReadiness?.backgroundGaps?.rows ?? null,
    residualSignalReviewRows: brief.residualSignalReview?.rows?.length ?? 0,
    residualSignalMonitorWatchlistRows: brief.residualSignalReview?.monitorWatchlistRows ?? 0,
    candidateDeepDiveCandidates: brief.candidateDeepDive?.candidates ?? 0,
    candidateDeepDiveResults: brief.candidateDeepDive?.totalResults ?? 0,
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
    paidAcquisitionClaimablePaidRows: paidClaimCounts["可声称付费投放"] ?? 0,
    paidAcquisitionChannelOnlyClaimRows: paidClaimCounts["只能声称渠道线索"] ?? 0,
    paidAcquisitionNoPaidClaimRows: paidClaimCounts["不能声称投放"] ?? 0,
    paidAcquisitionMonitorSignalRows: brief.paidAcquisitionEvidenceAudit?.monitorPaidSignalRows ?? 0,
    paidAcquisitionMonitorNewRows: brief.paidAcquisitionEvidenceAudit?.monitorPaidNewRows ?? 0,
    functionalDifferenceAuditRows: brief.functionalDifferenceAudit?.rows?.length ?? 0,
    functionalMechanisms: brief.functionalDifferenceAudit?.byMechanism?.length ?? 0,
    officialSocialCoverageAuditRows: brief.officialSocialCoverageAudit?.rows?.length ?? 0,
    officialSocialCompleteRows: brief.officialSocialCoverageAudit?.summary?.complete ?? 0,
    officialGapDeepDiveSearches: brief.officialGapDeepDive?.searches ?? 0,
    officialGapDeepDiveResults: brief.officialGapDeepDive?.resultRows ?? 0,
    companyBackgroundCoverageRows: brief.companyBackgroundCoverageAudit?.rows?.length ?? 0,
    companyBackgroundDeepDiveSearches: brief.companyBackgroundDeepDive?.searches ?? 0,
    companyBackgroundDeepDiveResults: brief.companyBackgroundDeepDive?.resultRows ?? 0,
    companyBackgroundProductLevelRows: brief.companyBackgroundCoverageAudit?.rows?.filter((item) => item.directCompanySignals > 0 || item.directPeopleSignals > 0 || item.directFinancialSignals > 0).length ?? 0,
    marketDecisionEvidenceRows: brief.marketDecisionEvidenceMap?.rows?.length ?? 0,
    marketDecisionResearchRows: brief.marketDecisionEvidenceMap?.researchRows ?? 0,
    marketDecisionFinancialRows: brief.marketDecisionEvidenceMap?.financialRows ?? 0,
    monitorLanes: monitor.runs?.length ?? 0,
    monitorRecentItems: monitor.recentItems?.length ?? 0,
    monitorNewAlerts: monitor.summary?.newAlerts ?? 0,
    monitorHistoryRuns: monitorHistory.runs?.length ?? 0,
    monitorLedgerItems: monitorLedger.totalItems ?? monitorLedger.items?.length ?? 0,
    monitorZeroNewAlertStreak: zeroNewAlertRunCount,
    latestAlertReviewRows: brief.candidateReview?.latestAlertReview?.length ?? 0,
    latestAlertReviewPendingRows: (brief.candidateReview?.latestAlertReview ?? []).filter((item) => item.decision === "待复核" || /自动补齐的新提醒记录/.test(item.reason ?? "")).length,
    monitorRecentReviewPendingRows: (brief.candidateReview?.recentSignalReview ?? []).filter((item) => item.decision === "待复核").length,
    monitorLaneRouting: brief.candidateReview?.monitorLaneRouting?.length ?? 0,
    objectiveEvidenceRows: brief.objectiveEvidenceMap?.length ?? 0,
    originalObjectiveAuditRows: originalObjectiveAudit.rows?.length ?? 0,
    originalObjectiveAuditStatus: originalObjectiveAudit.verdict?.status ?? "",
    currentStateProducts: currentState.counts?.products ?? 0,
    currentStateMonitorRecentSignals: currentState.counts?.monitorRecentSignals ?? 0,
    currentStateMonitorNewAlerts: currentState.counts?.monitorNewAlerts ?? 0,
    currentStateMonitorHistoryRuns: currentState.counts?.monitorHistoryRuns ?? 0,
    currentStateMonitorLedgerItems: currentState.counts?.monitorLedgerItems ?? 0,
    currentStateMonitorZeroNewAlertStreak: currentState.counts?.monitorZeroNewAlertStreak ?? 0,
    currentStateFundingIntegrityOutOfWindowRows: currentState.counts?.fundingIntegrityOutOfWindowRows ?? 0,
    currentStateFundingIntegrityDuplicateRows: currentState.counts?.fundingIntegrityDuplicateRows ?? 0,
    currentStateFundingIntegrityIrlUniqueRows: currentState.counts?.fundingIntegrityIrlUniqueRows ?? 0,
    currentStateFundingIntegrityProductRollupRows: currentState.counts?.fundingIntegrityProductRollupRows ?? 0,
    currentStateIrlOfflineEvidenceRows: currentState.counts?.irlOfflineEvidenceRows ?? 0,
    currentStatePaidAcquisitionClaimablePaidRows: currentState.counts?.paidAcquisitionClaimablePaidRows ?? 0,
    currentStatePaidAcquisitionChannelOnlyClaimRows: currentState.counts?.paidAcquisitionChannelOnlyClaimRows ?? 0,
    currentStatePaidAcquisitionNoPaidClaimRows: currentState.counts?.paidAcquisitionNoPaidClaimRows ?? 0,
    currentStateOriginalObjectiveAuditRows: currentState.counts?.originalObjectiveAuditRows ?? 0,
    sqliteProducts: sqliteCounts.products,
    sqliteFundingEvents: sqliteCounts.funding_events,
    sqliteMonitorSignals: sqliteCounts.monitor_signals,
    sqliteSourceLinkage: sqliteCounts.source_linkage,
    sqliteCoverageGaps: sqliteCounts.coverage_gaps,
    sqliteAuditRows: sqliteCounts.audit_rows,
    sqliteViewLanguageAdjacentProducts: sqliteCounts.view_language_adjacent_products,
    sqliteViewIrlFundingNews: sqliteCounts.view_irl_funding_news,
    sqliteViewLatestMonitorSignals: sqliteCounts.view_latest_monitor_signals,
    sqliteViewUnresolvedCoverageGaps: sqliteCounts.view_unresolved_coverage_gaps,
    sqliteViewPaidAcquisitionClaims: sqliteCounts.view_paid_acquisition_claims,
    exaCategoryEvidenceRows: brief.exaCategoryEvidenceAudit?.rows?.length ?? 0,
    exaSearches: brief.exaQueryMatrix?.totalSearches ?? brief.exaQueryMatrix?.summary?.totalSearches,
    exaResults: brief.exaQueryMatrix?.totalResults ?? brief.exaQueryMatrix?.summary?.totalResults,
  },
  entrypoints: {
    standaloneHtml: "exports/exa-ai-social-report.html",
    sqliteDatabase: "exports/exa-social-research.sqlite",
    sqliteDatabaseGuide: "exports/sqlite-database-guide.md",
    latestMonitorRun: "exports/latest-monitor-run.md",
    latestMonitorRunJson: "exports/latest-monitor-run.json",
    exaCategoryCoverageGuide: "exports/exa-category-coverage-guide.md",
    automationAudit: "exports/automation-audit.md",
    demoChecklist: "exports/demo-checklist.md",
    featureVersionLog: "功能与版本记录.md",
    liveLocalUrl: "http://127.0.0.1:8000/#home",
    matrixRoute: "http://127.0.0.1:8000/#matrix",
    monitorRoute: "http://127.0.0.1:8000/#monitor",
  },
  files: {
    root: rootFiles,
    data: dataFiles.map((file) => `data/${file}`),
    exports: exportFiles.map((file) => `exports/${file}`),
  },
  notes: [
    "Future Exa monitor/full rebuild runs may update the live data files; this snapshot preserves the current version.",
    "Native Exa Websets Monitor was unavailable for the current key; fallback uses Exa Search API plus Codex automation.",
    "All-related-products coverage remains broad monitored coverage, not a mathematical exhaustiveness guarantee.",
  ],
};

await writeFile(new URL("manifest.json", snapshotRoot), JSON.stringify(manifest, null, 2));

let pruned = [];
if (Number.isFinite(keepCount) && keepCount > 0) {
  const entries = await readdir(snapshotBase, { withFileTypes: true }).catch(() => []);
  const snapshotDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => /^\d{4}-\d{2}-\d{2}-/.test(name))
    .sort();
  const stale = snapshotDirs.slice(0, Math.max(0, snapshotDirs.length - keepCount));
  await Promise.all(stale.map((name) => rm(new URL(`${name}/`, snapshotBase), { recursive: true, force: true })));
  pruned = stale;
}

const latestSnapshotPointer = {
  savedAt: new Date().toISOString(),
  snapshot: new URL(".", snapshotRoot).pathname,
  manifest: new URL("manifest.json", snapshotRoot).pathname,
  relativeSnapshot: `exports/snapshots/${stamp}/`,
  relativeManifest: `exports/snapshots/${stamp}/manifest.json`,
  strictCompletionStatus: manifest.counts.strictCompletionStatus,
  presentationReady: manifest.counts.strictCompletionPresentationReady,
  entrypoints: manifest.entrypoints,
  counts: {
    products: manifest.counts.products,
    fundingTimelineEvents: manifest.counts.fundingTimelineEvents,
    uniqueFundingNewsEvents: manifest.counts.uniqueFundingNewsEvents,
    monitorLanes: manifest.counts.monitorLanes,
    monitorRecentItems: manifest.counts.monitorRecentItems,
    monitorNewAlerts: manifest.counts.monitorNewAlerts,
    monitorHistoryRuns: manifest.counts.monitorHistoryRuns,
    monitorLedgerItems: manifest.counts.monitorLedgerItems,
    sqliteProducts: manifest.counts.sqliteProducts,
    sqliteFundingEvents: manifest.counts.sqliteFundingEvents,
    sqliteMonitorSignals: manifest.counts.sqliteMonitorSignals,
    originalObjectiveAuditRows: manifest.counts.originalObjectiveAuditRows,
  },
  retention: {
    keep: keepCount,
    pruned,
  },
};

const latestSnapshotMarkdown = [
  "# Latest Snapshot Pointer",
  "",
  `Saved at: ${latestSnapshotPointer.savedAt}`,
  "",
  "## Snapshot",
  "",
  `- Snapshot directory: \`${latestSnapshotPointer.relativeSnapshot}\``,
  `- Manifest: \`${latestSnapshotPointer.relativeManifest}\``,
  `- Local absolute snapshot: \`${latestSnapshotPointer.snapshot}\``,
  "",
  "## Status",
  "",
  `- Strict completion status: \`${latestSnapshotPointer.strictCompletionStatus}\``,
  `- Presentation ready: \`${latestSnapshotPointer.presentationReady}\``,
  "",
  "## Core Counts",
  "",
  `- Products: ${latestSnapshotPointer.counts.products}`,
  `- Funding timeline events: ${latestSnapshotPointer.counts.fundingTimelineEvents}`,
  `- Unique funding/news events: ${latestSnapshotPointer.counts.uniqueFundingNewsEvents}`,
  `- Monitor lanes: ${latestSnapshotPointer.counts.monitorLanes}`,
  `- Recent monitor items: ${latestSnapshotPointer.counts.monitorRecentItems}`,
  `- New monitor alerts: ${latestSnapshotPointer.counts.monitorNewAlerts}`,
  `- Monitor history runs: ${latestSnapshotPointer.counts.monitorHistoryRuns}`,
  `- Monitor ledger items: ${latestSnapshotPointer.counts.monitorLedgerItems}`,
  `- SQLite products: ${latestSnapshotPointer.counts.sqliteProducts}`,
  `- SQLite funding events: ${latestSnapshotPointer.counts.sqliteFundingEvents}`,
  `- SQLite monitor signals: ${latestSnapshotPointer.counts.sqliteMonitorSignals}`,
  `- Original objective audit rows: ${latestSnapshotPointer.counts.originalObjectiveAuditRows}`,
  "",
  "## Main Entrypoints",
  "",
  `- Standalone HTML: \`${manifest.entrypoints.standaloneHtml}\``,
  `- SQLite database: \`${manifest.entrypoints.sqliteDatabase}\``,
  `- SQLite guide: \`${manifest.entrypoints.sqliteDatabaseGuide}\``,
  `- Latest monitor receipt: \`${manifest.entrypoints.latestMonitorRun}\` / \`${manifest.entrypoints.latestMonitorRunJson}\``,
  `- Exa category coverage guide: \`${manifest.entrypoints.exaCategoryCoverageGuide}\``,
  `- Automation audit: \`${manifest.entrypoints.automationAudit}\``,
  `- Demo checklist: \`${manifest.entrypoints.demoChecklist}\``,
  `- Feature/version log: \`${manifest.entrypoints.featureVersionLog}\``,
  `- Live local page: \`${manifest.entrypoints.liveLocalUrl}\``,
  "",
  "## Retention",
  "",
  `- Retained snapshot count: ${latestSnapshotPointer.retention.keep}`,
  `- Pruned in this run: ${latestSnapshotPointer.retention.pruned.length ? latestSnapshotPointer.retention.pruned.map((item) => `\`${item}\``).join(", ") : "none"}`,
  "",
].join("\n");

await writeFile(new URL("../exports/latest-snapshot.json", import.meta.url), JSON.stringify(latestSnapshotPointer, null, 2));
await writeFile(new URL("../exports/latest-snapshot.md", import.meta.url), latestSnapshotMarkdown);

console.log(JSON.stringify({
  ok: true,
  snapshot: new URL(".", snapshotRoot).pathname,
  manifest: new URL("manifest.json", snapshotRoot).pathname,
  latestSnapshotPointer: new URL("../exports/latest-snapshot.json", import.meta.url).pathname,
  retention: {
    keep: keepCount,
    pruned,
  },
  counts: manifest.counts,
}, null, 2));
