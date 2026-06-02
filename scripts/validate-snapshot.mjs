import { readFile, readdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";

const brief = JSON.parse(await readFile(new URL("../data/brief.json", import.meta.url), "utf8"));
const monitor = JSON.parse(await readFile(new URL("../data/monitor.json", import.meta.url), "utf8"));
const monitorHistory = JSON.parse(await readFile(new URL("../data/monitor-history.json", import.meta.url), "utf8"));
const monitorLedger = JSON.parse(await readFile(new URL("../data/monitor-ledger.json", import.meta.url), "utf8"));
const originalObjectiveAudit = JSON.parse(await readFile(new URL("../exports/original-objective-audit.json", import.meta.url), "utf8"));
const currentState = JSON.parse(await readFile(new URL("../exports/current-state.json", import.meta.url), "utf8"));
const latestMonitorRun = JSON.parse(await readFile(new URL("../exports/latest-monitor-run.json", import.meta.url), "utf8"));
const completionManifest = JSON.parse(await readFile(new URL("../exports/completion-manifest.json", import.meta.url), "utf8"));
const automationAudit = await readFile(new URL("../exports/automation-audit.md", import.meta.url), "utf8");
const demoChecklist = await readFile(new URL("../exports/demo-checklist.md", import.meta.url), "utf8");
const paidClaimCounts = (brief.paidAcquisitionEvidenceAudit?.rows ?? []).reduce((acc, row) => {
  acc[row.claimLevel] = (acc[row.claimLevel] ?? 0) + 1;
  return acc;
}, {});
const monitorZeroNewAlertStreak = (monitorHistory.runs ?? []).findIndex((run) => (run.summary?.newAlerts ?? 0) > 0);
const zeroNewAlertRunCount = monitorZeroNewAlertStreak === -1 ? (monitorHistory.runs ?? []).length : monitorZeroNewAlertStreak;

const snapshotBase = new URL("../exports/snapshots/", import.meta.url);
const entries = await readdir(snapshotBase, { withFileTypes: true }).catch(() => []);
const latest = entries
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
  .at(-1);

const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

expect(Boolean(latest), "at least one snapshot directory must exist");

let manifest = null;
if (latest) {
  manifest = JSON.parse(await readFile(new URL(`${latest}/manifest.json`, snapshotBase), "utf8"));
  const latestSnapshotPointer = JSON.parse(await readFile(new URL("../exports/latest-snapshot.json", import.meta.url), "utf8"));
  const latestSnapshotPointerMd = await readFile(new URL("../exports/latest-snapshot.md", import.meta.url), "utf8");
  const snapshotBrief = JSON.parse(await readFile(new URL(`${latest}/data/brief.json`, snapshotBase), "utf8"));
  const snapshotMonitor = JSON.parse(await readFile(new URL(`${latest}/data/monitor.json`, snapshotBase), "utf8"));
  const snapshotMonitorHistory = JSON.parse(await readFile(new URL(`${latest}/data/monitor-history.json`, snapshotBase), "utf8"));
  const snapshotMonitorLedger = JSON.parse(await readFile(new URL(`${latest}/data/monitor-ledger.json`, snapshotBase), "utf8"));
  const snapshotLatestMonitorRun = JSON.parse(await readFile(new URL(`${latest}/exports/latest-monitor-run.json`, snapshotBase), "utf8"));
  const snapshotLatestMonitorRunMd = await readFile(new URL(`${latest}/exports/latest-monitor-run.md`, snapshotBase), "utf8");
  const snapshotCompletionManifest = JSON.parse(await readFile(new URL(`${latest}/exports/completion-manifest.json`, snapshotBase), "utf8"));
  const snapshotAutomationAudit = await readFile(new URL(`${latest}/exports/automation-audit.md`, snapshotBase), "utf8");
  const snapshotDemoChecklist = await readFile(new URL(`${latest}/exports/demo-checklist.md`, snapshotBase), "utf8");
  const sqlite = new DatabaseSync(new URL(`${latest}/exports/exa-social-research.sqlite`, snapshotBase).pathname, { readOnly: true });
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
  expect(manifest.counts?.products === brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0), "snapshot product count must match brief");
  expect(manifest.counts?.monitorRecentItems === monitor.recentItems.length, "snapshot monitor recent count must match current monitor");
  expect(manifest.counts?.monitorNewAlerts === monitor.summary.newAlerts, "snapshot new-alert count must match current monitor");
  expect(manifest.counts?.monitorHistoryRuns === monitorHistory.runs.length, "snapshot monitor history count must match history");
  expect(manifest.counts?.monitorLedgerItems === monitorLedger.totalItems, "snapshot monitor ledger count must match ledger");
  expect(manifest.counts?.monitorZeroNewAlertStreak === zeroNewAlertRunCount, "snapshot monitor zero-new-alert streak must match history");
  expect(manifest.counts?.irlOfflineEvidenceRows === brief.irlOfflineEvidenceMap.totalRows, "snapshot IRL evidence count must match brief");
  expect(manifest.counts?.fundingIntegrityOutOfWindowRows === brief.fundingIntegritySummary.outOfWindowRows, "snapshot funding out-of-window count must match brief");
  expect(manifest.counts?.fundingIntegrityDuplicateRows === brief.fundingIntegritySummary.duplicateRows, "snapshot funding duplicate count must match brief");
  expect(manifest.counts?.fundingIntegrityIrlUniqueRows === brief.fundingIntegritySummary.irlUniqueRows, "snapshot funding IRL count must match brief");
  expect(manifest.counts?.fundingIntegrityProductRollupRows === brief.fundingIntegritySummary.productRollupRows, "snapshot funding product rollup count must match brief");
  expect(manifest.counts?.paidAcquisitionMonitorSignalRows === brief.paidAcquisitionEvidenceAudit.monitorPaidSignalRows, "snapshot paid-acquisition monitor count must match brief");
  expect(manifest.counts?.paidAcquisitionClaimablePaidRows === (paidClaimCounts["可声称付费投放"] ?? 0), "snapshot paid claimable count must match brief");
  expect(manifest.counts?.paidAcquisitionChannelOnlyClaimRows === (paidClaimCounts["只能声称渠道线索"] ?? 0), "snapshot channel-only claim count must match brief");
  expect(manifest.counts?.paidAcquisitionNoPaidClaimRows === (paidClaimCounts["不能声称投放"] ?? 0), "snapshot no-paid claim count must match brief");
  expect(manifest.counts?.originalObjectiveAuditRows === originalObjectiveAudit.rows.length, "snapshot original objective audit rows must match JSON");
  expect(manifest.counts?.originalObjectiveAuditStatus === originalObjectiveAudit.verdict.status, "snapshot original objective audit status must match JSON");
  expect(manifest.counts?.currentStateProducts === currentState.counts.products, "snapshot current-state product count must match current-state JSON");
  expect(manifest.counts?.currentStateMonitorRecentSignals === currentState.counts.monitorRecentSignals, "snapshot current-state monitor count must match current-state JSON");
  expect(manifest.counts?.currentStateMonitorNewAlerts === currentState.counts.monitorNewAlerts, "snapshot current-state new-alert count must match current-state JSON");
  expect(manifest.counts?.currentStateMonitorHistoryRuns === currentState.counts.monitorHistoryRuns, "snapshot current-state monitor history count must match current-state JSON");
  expect(manifest.counts?.currentStateMonitorLedgerItems === currentState.counts.monitorLedgerItems, "snapshot current-state monitor ledger count must match current-state JSON");
  expect(manifest.counts?.currentStateMonitorZeroNewAlertStreak === currentState.counts.monitorZeroNewAlertStreak, "snapshot current-state monitor zero-new-alert streak must match current-state JSON");
  expect(manifest.counts?.currentStateFundingIntegrityOutOfWindowRows === currentState.counts.fundingIntegrityOutOfWindowRows, "snapshot current-state funding out-of-window count must match current-state JSON");
  expect(manifest.counts?.currentStateFundingIntegrityDuplicateRows === currentState.counts.fundingIntegrityDuplicateRows, "snapshot current-state funding duplicate count must match current-state JSON");
  expect(manifest.counts?.currentStateFundingIntegrityIrlUniqueRows === currentState.counts.fundingIntegrityIrlUniqueRows, "snapshot current-state funding IRL count must match current-state JSON");
  expect(manifest.counts?.currentStateFundingIntegrityProductRollupRows === currentState.counts.fundingIntegrityProductRollupRows, "snapshot current-state funding product rollup count must match current-state JSON");
  expect(manifest.counts?.currentStateIrlOfflineEvidenceRows === currentState.counts.irlOfflineEvidenceRows, "snapshot current-state IRL count must match current-state JSON");
  expect(manifest.counts?.currentStatePaidAcquisitionClaimablePaidRows === currentState.counts.paidAcquisitionClaimablePaidRows, "snapshot current-state paid claimable count must match current-state JSON");
  expect(manifest.counts?.currentStatePaidAcquisitionChannelOnlyClaimRows === currentState.counts.paidAcquisitionChannelOnlyClaimRows, "snapshot current-state channel-only claim count must match current-state JSON");
  expect(manifest.counts?.currentStatePaidAcquisitionNoPaidClaimRows === currentState.counts.paidAcquisitionNoPaidClaimRows, "snapshot current-state no-paid claim count must match current-state JSON");
  expect(manifest.counts?.currentStateOriginalObjectiveAuditRows === currentState.counts.originalObjectiveAuditRows, "snapshot current-state original objective count must match current-state JSON");
  expect(manifest.counts?.sqliteProducts === sqliteCounts.products, "snapshot SQLite product count must match snapshot database");
  expect(manifest.counts?.sqliteFundingEvents === sqliteCounts.funding_events, "snapshot SQLite funding count must match snapshot database");
  expect(manifest.counts?.sqliteMonitorSignals === sqliteCounts.monitor_signals, "snapshot SQLite monitor count must match snapshot database");
  expect(manifest.counts?.sqliteSourceLinkage === sqliteCounts.source_linkage, "snapshot SQLite source linkage count must match snapshot database");
  expect(manifest.counts?.sqliteCoverageGaps === sqliteCounts.coverage_gaps, "snapshot SQLite coverage gap count must match snapshot database");
  expect(manifest.counts?.sqliteAuditRows === sqliteCounts.audit_rows, "snapshot SQLite audit row count must match snapshot database");
  expect(manifest.counts?.sqliteViewLanguageAdjacentProducts === sqliteCounts.view_language_adjacent_products, "snapshot SQLite language view count must match snapshot database");
  expect(manifest.counts?.sqliteViewIrlFundingNews === sqliteCounts.view_irl_funding_news, "snapshot SQLite IRL view count must match snapshot database");
  expect(manifest.counts?.sqliteViewLatestMonitorSignals === sqliteCounts.view_latest_monitor_signals, "snapshot SQLite monitor view count must match snapshot database");
  expect(manifest.counts?.sqliteViewUnresolvedCoverageGaps === sqliteCounts.view_unresolved_coverage_gaps, "snapshot SQLite coverage view count must match snapshot database");
  expect(manifest.counts?.sqliteViewPaidAcquisitionClaims === sqliteCounts.view_paid_acquisition_claims, "snapshot SQLite paid view count must match snapshot database");
  expect(manifest.counts?.sqliteProducts === brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0), "snapshot SQLite product count must match brief");
  expect(manifest.counts?.sqliteFundingEvents === (brief.fundingEventAudit?.rows?.length ?? 0), "snapshot SQLite funding count must match brief");
  expect(manifest.counts?.sqliteMonitorSignals === monitor.recentItems.length, "snapshot SQLite monitor count must match current monitor");
  expect(manifest.counts?.sqliteSourceLinkage === (brief.sourceLinkageAudit?.rows?.length ?? 0), "snapshot SQLite source linkage count must match brief");
  expect(manifest.counts?.sqliteCoverageGaps === (brief.coverageGapRegister?.groups?.length ?? 0), "snapshot SQLite coverage gap count must match brief");
  expect(manifest.counts?.sqliteViewLanguageAdjacentProducts === (brief.languageOfficialEvidenceMap?.rows?.length ?? 0), "snapshot SQLite language view count must match brief");
  expect(manifest.counts?.sqliteViewIrlFundingNews === (brief.fundingEventAudit?.rows ?? []).filter((item) => item.irlRelated).length, "snapshot SQLite IRL view count must match brief");
  expect(manifest.counts?.sqliteViewLatestMonitorSignals === monitor.recentItems.length, "snapshot SQLite monitor view count must match current monitor");
  expect(manifest.counts?.sqliteViewUnresolvedCoverageGaps === (brief.coverageGapRegister?.groups ?? []).filter((item) => (item.unresolvedCount ?? 0) > 0).length, "snapshot SQLite unresolved view count must match brief");
  expect(manifest.counts?.sqliteViewPaidAcquisitionClaims === (brief.paidAcquisitionEvidenceAudit?.rows?.length ?? 0), "snapshot SQLite paid view count must match brief");
  expect(latestSnapshotPointer.relativeSnapshot === `exports/snapshots/${latest}/`, "latest snapshot pointer must target latest snapshot directory");
  expect(latestSnapshotPointer.relativeManifest === `exports/snapshots/${latest}/manifest.json`, "latest snapshot pointer must target latest manifest");
  expect(latestSnapshotPointer.snapshot.endsWith(`/exports/snapshots/${latest}/`), "latest snapshot pointer absolute path must target latest directory");
  expect(latestSnapshotPointer.manifest.endsWith(`/exports/snapshots/${latest}/manifest.json`), "latest snapshot pointer absolute manifest path must target latest manifest");
  expect(latestSnapshotPointer.strictCompletionStatus === manifest.counts.strictCompletionStatus, "latest snapshot pointer status must match manifest");
  expect(latestSnapshotPointer.presentationReady === manifest.counts.strictCompletionPresentationReady, "latest snapshot pointer presentation readiness must match manifest");
  expect(latestSnapshotPointer.counts?.products === manifest.counts.products, "latest snapshot pointer product count must match manifest");
  expect(latestSnapshotPointer.counts?.monitorRecentItems === manifest.counts.monitorRecentItems, "latest snapshot pointer monitor count must match manifest");
  expect(latestSnapshotPointer.counts?.monitorNewAlerts === manifest.counts.monitorNewAlerts, "latest snapshot pointer new-alert count must match manifest");
  expect(latestSnapshotPointer.counts?.sqliteProducts === manifest.counts.sqliteProducts, "latest snapshot pointer SQLite product count must match manifest");
  expect(latestSnapshotPointerMd.includes(`exports/snapshots/${latest}/`), "latest snapshot Markdown pointer must mention latest snapshot directory");
  expect(latestSnapshotPointerMd.includes(`exports/snapshots/${latest}/manifest.json`), "latest snapshot Markdown pointer must mention latest manifest path");
  expect(latestSnapshotPointerMd.includes("Strict completion status"), "latest snapshot Markdown pointer must include status section");
  expect(manifest.files?.exports?.includes("exports/latest-monitor-run.md"), "snapshot manifest must list latest monitor Markdown receipt");
  expect(manifest.files?.exports?.includes("exports/latest-monitor-run.json"), "snapshot manifest must list latest monitor JSON receipt");
  expect(manifest.files?.exports?.includes("exports/automation-audit.md"), "snapshot manifest must list automation audit");
  expect(manifest.files?.exports?.includes("exports/demo-checklist.md"), "snapshot manifest must list demo checklist");
  expect(manifest.entrypoints?.latestMonitorRun === "exports/latest-monitor-run.md", "snapshot manifest must expose latest monitor Markdown receipt entrypoint");
  expect(manifest.entrypoints?.latestMonitorRunJson === "exports/latest-monitor-run.json", "snapshot manifest must expose latest monitor JSON receipt entrypoint");
  expect(manifest.entrypoints?.automationAudit === "exports/automation-audit.md", "snapshot manifest must expose automation audit entrypoint");
  expect(manifest.entrypoints?.demoChecklist === "exports/demo-checklist.md", "snapshot manifest must expose demo checklist entrypoint");
  expect(snapshotAutomationAudit === automationAudit, "snapshot automation audit must match current automation audit");
  expect(snapshotAutomationAudit.includes("exa-ai-social-market-monitor"), "snapshot automation audit must include daily monitor id");
  expect(snapshotAutomationAudit.includes("exa-ai-social-weekly-full-rebuild"), "snapshot automation audit must include weekly full rebuild id");
  expect(snapshotCompletionManifest.artifacts?.automationAuditMarkdown === "exports/automation-audit.md", "snapshot completion manifest must list automation audit artifact");
  expect(snapshotCompletionManifest.artifacts?.demoChecklistMarkdown === "exports/demo-checklist.md", "snapshot completion manifest must list demo checklist artifact");
  expect(snapshotCompletionManifest.artifacts?.automationAuditMarkdown === completionManifest.artifacts?.automationAuditMarkdown, "snapshot completion manifest automation artifact must match current manifest");
  expect(snapshotCompletionManifest.artifacts?.demoChecklistMarkdown === completionManifest.artifacts?.demoChecklistMarkdown, "snapshot completion manifest demo checklist artifact must match current manifest");
  expect(snapshotDemoChecklist === demoChecklist, "snapshot demo checklist must match current demo checklist");
  expect(snapshotDemoChecklist.includes("3 分钟打开路径"), "snapshot demo checklist must include live-demo path");
  expect(snapshotDemoChecklist.includes("exports/exa-social-research.sqlite"), "snapshot demo checklist must include SQLite database path");
  expect(snapshotDemoChecklist.includes("CSV 是复核和二次分析附件，不是主要阅读入口"), "snapshot demo checklist must preserve CSV boundary");
  expect(snapshotLatestMonitorRun.monitorGeneratedAt === snapshotMonitor.generatedAt, "snapshot monitor receipt generatedAt must match snapshot monitor");
  expect(snapshotLatestMonitorRun.monitorGeneratedAt === latestMonitorRun.monitorGeneratedAt, "snapshot monitor receipt generatedAt must match current receipt");
  expect(snapshotLatestMonitorRun.summary?.recentResults === snapshotMonitor.summary.recentResults, "snapshot monitor receipt recent count must match snapshot monitor");
  expect(snapshotLatestMonitorRun.summary?.newAlerts === snapshotMonitor.summary.newAlerts, "snapshot monitor receipt new-alert count must match snapshot monitor");
  expect(snapshotLatestMonitorRun.requestIds?.length === (snapshotMonitor.runs ?? []).filter((run) => run.requestId).length, "snapshot monitor receipt must preserve requestIds");
  expect(snapshotLatestMonitorRun.alertClosure?.latestAlertReviewRows === snapshotBrief.candidateReview.alertClosure.latestAlertReviewRows, "snapshot monitor receipt latest-alert row count must match snapshot brief");
  expect(snapshotLatestMonitorRun.alertClosure?.latestAlertPendingRows === snapshotBrief.candidateReview.alertClosure.latestAlertPendingRows, "snapshot monitor receipt latest-alert pending count must match snapshot brief");
  expect(snapshotLatestMonitorRun.alertClosure?.recentSignalReviewRows === snapshotBrief.candidateReview.alertClosure.recentSignalReviewRows, "snapshot monitor receipt recent review row count must match snapshot brief");
  expect(snapshotLatestMonitorRun.alertClosure?.recentSignalPendingRows === snapshotBrief.candidateReview.alertClosure.recentSignalPendingRows, "snapshot monitor receipt recent pending count must match snapshot brief");
  expect(snapshotLatestMonitorRun.persistence?.monitorHistoryRuns === (snapshotMonitorHistory.runs?.length ?? 0), "snapshot monitor receipt history count must match snapshot history");
  expect(snapshotLatestMonitorRun.persistence?.monitorLedgerItems === (snapshotMonitorLedger.totalItems ?? snapshotMonitorLedger.items?.length ?? 0), "snapshot monitor receipt ledger count must match snapshot ledger");
  expect(snapshotLatestMonitorRun.persistence?.sqliteCounts?.monitor_signals === sqliteCounts.monitor_signals, "snapshot monitor receipt SQLite monitor count must match snapshot database");
  expect(snapshotLatestMonitorRun.persistence?.sqliteCounts?.view_latest_monitor_signals === sqliteCounts.view_latest_monitor_signals, "snapshot monitor receipt SQLite monitor view count must match snapshot database");
  expect(snapshotLatestMonitorRun.latestHandledAlerts?.[0]?.name === snapshotBrief.candidateReview.latestAlertReview?.[0]?.name, "snapshot monitor receipt latest handled alert must match snapshot brief");
  expect(snapshotLatestMonitorRun.latestHandledAlerts?.[0]?.decision === snapshotBrief.candidateReview.latestAlertReview?.[0]?.decision, "snapshot monitor receipt latest handled decision must match snapshot brief");
  expect(snapshotLatestMonitorRunMd.includes(`Monitor generated at: ${snapshotMonitor.generatedAt}`), "snapshot monitor Markdown receipt must record snapshot monitor generatedAt");
  expect(snapshotLatestMonitorRunMd.includes(snapshotBrief.candidateReview.latestAlertReview?.[0]?.name ?? ""), "snapshot monitor Markdown receipt must record latest handled alert");
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, latestSnapshot: latest, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  latestSnapshot: latest,
  counts: {
    monitorRecentItems: manifest.counts.monitorRecentItems,
    monitorNewAlerts: manifest.counts.monitorNewAlerts,
    monitorHistoryRuns: manifest.counts.monitorHistoryRuns,
    monitorLedgerItems: manifest.counts.monitorLedgerItems,
    monitorZeroNewAlertStreak: manifest.counts.monitorZeroNewAlertStreak,
    irlOfflineEvidenceRows: manifest.counts.irlOfflineEvidenceRows,
    fundingIntegrityOutOfWindowRows: manifest.counts.fundingIntegrityOutOfWindowRows,
    fundingIntegrityDuplicateRows: manifest.counts.fundingIntegrityDuplicateRows,
    fundingIntegrityIrlUniqueRows: manifest.counts.fundingIntegrityIrlUniqueRows,
    fundingIntegrityProductRollupRows: manifest.counts.fundingIntegrityProductRollupRows,
    paidAcquisitionMonitorSignalRows: manifest.counts.paidAcquisitionMonitorSignalRows,
    paidAcquisitionClaimablePaidRows: manifest.counts.paidAcquisitionClaimablePaidRows,
    paidAcquisitionChannelOnlyClaimRows: manifest.counts.paidAcquisitionChannelOnlyClaimRows,
    paidAcquisitionNoPaidClaimRows: manifest.counts.paidAcquisitionNoPaidClaimRows,
    originalObjectiveAuditRows: manifest.counts.originalObjectiveAuditRows,
    currentStateProducts: manifest.counts.currentStateProducts,
    sqliteProducts: manifest.counts.sqliteProducts,
    sqliteFundingEvents: manifest.counts.sqliteFundingEvents,
    sqliteMonitorSignals: manifest.counts.sqliteMonitorSignals,
    sqliteSourceLinkage: manifest.counts.sqliteSourceLinkage,
    sqliteCoverageGaps: manifest.counts.sqliteCoverageGaps,
    sqliteAuditRows: manifest.counts.sqliteAuditRows,
    sqliteViewLanguageAdjacentProducts: manifest.counts.sqliteViewLanguageAdjacentProducts,
    sqliteViewIrlFundingNews: manifest.counts.sqliteViewIrlFundingNews,
    sqliteViewLatestMonitorSignals: manifest.counts.sqliteViewLatestMonitorSignals,
    sqliteViewUnresolvedCoverageGaps: manifest.counts.sqliteViewUnresolvedCoverageGaps,
    sqliteViewPaidAcquisitionClaims: manifest.counts.sqliteViewPaidAcquisitionClaims,
    latestMonitorRunRequestIds: latestMonitorRun.requestIds?.length ?? 0,
  },
}, null, 2));
