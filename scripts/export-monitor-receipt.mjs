import { readFile, writeFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";

const root = new URL("..", import.meta.url);

const monitor = JSON.parse(await readFile(new URL("data/monitor.json", root), "utf8"));
const history = JSON.parse(await readFile(new URL("data/monitor-history.json", root), "utf8"));
const ledger = JSON.parse(await readFile(new URL("data/monitor-ledger.json", root), "utf8"));
const brief = JSON.parse(await readFile(new URL("data/brief.json", root), "utf8"));

const sqlite = new DatabaseSync(new URL("exports/exa-social-research.sqlite", root).pathname, { readOnly: true });
const sqliteCounts = Object.fromEntries(
  [
    "products",
    "funding_events",
    "monitor_signals",
    "source_linkage",
    "coverage_gaps",
    "audit_rows",
    "view_latest_monitor_signals",
  ].map((table) => [table, sqlite.prepare(`SELECT count(*) AS count FROM ${table}`).get().count]),
);
sqlite.close();

function mdCell(value) {
  return String(value ?? "")
    .replaceAll("\n", " ")
    .replaceAll("|", "\\|")
    .trim();
}

const latestReviews = brief.candidateReview?.latestAlertReview ?? [];
const recentReviews = brief.candidateReview?.recentSignalReview ?? [];
const alertClosure = brief.candidateReview?.alertClosure ?? {};
const requestIds = (monitor.runs ?? []).map((run) => run.requestId).filter(Boolean);

const receipt = {
  generatedAt: new Date().toISOString(),
  monitorGeneratedAt: monitor.generatedAt,
  lookbackDays: monitor.lookbackDays,
  source: monitor.source,
  nativeMonitor: monitor.nativeMonitor,
  automation: {
    name: monitor.automationName,
    schedule: monitor.automationSchedule,
  },
  summary: monitor.summary,
  requestIds,
  runs: (monitor.runs ?? []).map((run) => ({
    id: run.id,
    label: run.label,
    status: run.status,
    requestId: run.requestId,
    recentCount: run.recentCount ?? 0,
    query: run.query,
  })),
  alertClosure: {
    latestAlertReviewRows: alertClosure.latestAlertReviewRows ?? latestReviews.length,
    latestAlertPendingRows: alertClosure.latestAlertPendingRows ?? 0,
    recentSignalReviewRows: alertClosure.recentSignalReviewRows ?? recentReviews.length,
    recentSignalPendingRows: alertClosure.recentSignalPendingRows ?? 0,
    status: alertClosure.status,
  },
  latestHandledAlerts: latestReviews.slice(0, 5).map((item) => ({
    name: item.name,
    decision: item.decision,
    source: item.source,
    reason: item.reason,
    evidence: item.evidence,
  })),
  persistence: {
    monitorHistoryRuns: history.runs?.length ?? 0,
    monitorLedgerItems: ledger.totalItems ?? ledger.items?.length ?? 0,
    sqliteCounts,
    files: [
      "data/monitor.json",
      "data/monitor-history.json",
      "data/monitor-ledger.json",
      "data/brief.json",
      "exports/latest-alert-review.csv",
      "exports/monitor-recent-review.csv",
      "exports/monitor-recent-signals.csv",
      "exports/exa-social-research.sqlite",
      "exports/exa-ai-social-report.html",
    ],
  },
  boundary:
    "This receipt proves the latest monitor run and its persisted handling status. It does not claim mathematical exhaustiveness for all live-market products or news.",
};

const runRows = receipt.runs
  .map((run) => `| ${mdCell(run.label)} | ${mdCell(run.status)} | ${mdCell(run.recentCount)} | \`${mdCell(run.requestId)}\` |`)
  .join("\n");

const alertRows = receipt.latestHandledAlerts
  .map((item) => `| ${mdCell(item.name)} | ${mdCell(item.decision)} | ${mdCell(item.source)} |`)
  .join("\n");

const sqliteRows = Object.entries(sqliteCounts)
  .map(([table, count]) => `| \`${table}\` | ${count} |`)
  .join("\n");

const markdown = `# Latest Exa Monitor Run Receipt

Generated: ${receipt.generatedAt}

## Summary

- Monitor generated at: ${receipt.monitorGeneratedAt}
- Lookback days: ${receipt.lookbackDays}
- Source: ${receipt.source}
- Lanes: ${receipt.summary?.monitors ?? 0}; ok: ${receipt.summary?.ok ?? 0}; total results: ${receipt.summary?.totalResults ?? 0}; recent signals: ${receipt.summary?.recentResults ?? 0}; new alerts: ${receipt.summary?.newAlerts ?? 0}
- Latest alert review: ${receipt.alertClosure.latestAlertReviewRows} rows, pending ${receipt.alertClosure.latestAlertPendingRows}
- Recent signal review: ${receipt.alertClosure.recentSignalReviewRows} rows, pending ${receipt.alertClosure.recentSignalPendingRows}
- Monitor history runs: ${receipt.persistence.monitorHistoryRuns}
- Monitor ledger items: ${receipt.persistence.monitorLedgerItems}

## Exa Request IDs

${requestIds.map((id) => `- \`${id}\``).join("\n")}

## Lane Runs

| Lane | HTTP status | Recent signals | Request ID |
|---|---:|---:|---|
${runRows}

## Latest Handled Alerts

| Alert | Decision | Source |
|---|---|---|
${alertRows}

## SQLite Persistence Check

| Table / view | Rows |
|---|---:|
${sqliteRows}

## Persisted Files

${receipt.persistence.files.map((file) => `- \`${file}\``).join("\n")}

## Boundary

${receipt.boundary}
`;

await writeFile(new URL("exports/latest-monitor-run.json", root), JSON.stringify(receipt, null, 2));
await writeFile(new URL("exports/latest-monitor-run.md", root), markdown);

console.log(JSON.stringify({
  ok: true,
  files: ["exports/latest-monitor-run.md", "exports/latest-monitor-run.json"],
  monitorGeneratedAt: receipt.monitorGeneratedAt,
  requestIds: requestIds.length,
  recentSignals: receipt.summary?.recentResults ?? 0,
  newAlerts: receipt.summary?.newAlerts ?? 0,
  latestAlertPendingRows: receipt.alertClosure.latestAlertPendingRows,
  recentSignalPendingRows: receipt.alertClosure.recentSignalPendingRows,
}, null, 2));
