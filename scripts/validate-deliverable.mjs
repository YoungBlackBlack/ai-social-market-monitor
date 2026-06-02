import { access, readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { DatabaseSync } from "node:sqlite";

const root = new URL("..", import.meta.url);
const brief = JSON.parse(await readFile(new URL("data/brief.json", root), "utf8"));
const monitor = JSON.parse(await readFile(new URL("data/monitor.json", root), "utf8"));
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

async function fileExists(path) {
  try {
    await access(new URL(path, root));
    return true;
  } catch {
    return false;
  }
}

function productCount() {
  return brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0);
}

const requiredExports = [
  "exports/exa-ai-social-report.html",
  "exports/exa-social-research.sqlite",
  "exports/sqlite-database-guide.md",
  "exports/current-state.md",
  "exports/current-state.json",
  "exports/latest-monitor-run.md",
  "exports/latest-monitor-run.json",
  "exports/automation-audit.md",
  "exports/demo-checklist.md",
  "exports/latest-snapshot.md",
  "exports/latest-snapshot.json",
  "exports/browser-qa-report.md",
  "exports/executive-brief.md",
  "exports/objective-evidence-map.csv",
  "exports/goal-readiness.csv",
  "exports/competitive-matrix.csv",
  "exports/source-coverage.csv",
  "exports/exa-category-evidence-audit.csv",
  "exports/exa-category-coverage-guide.md",
  "exports/source-linkage-audit.csv",
  "exports/coverage-gap-register.csv",
  "exports/candidate-deep-dive.csv",
  "exports/product-capability-score.csv",
  "exports/growth-channel-audit.csv",
  "exports/acquisition-channel-map.csv",
  "exports/paid-acquisition-evidence-audit.csv",
  "exports/functional-difference-audit.csv",
  "exports/official-social-coverage-audit.csv",
  "exports/official-gap-deep-dive.csv",
  "exports/company-background-review.csv",
  "exports/company-background-deep-dive.csv",
  "exports/company-background-coverage-audit.csv",
  "exports/market-decision-evidence-map.csv",
  "exports/funding-timeline.csv",
  "exports/funding-news-review.csv",
  "exports/funding-news-dedup-audit.csv",
  "exports/funding-event-audit.csv",
  "exports/funding-upgrade-map.csv",
  "exports/funding-product-rollup.csv",
  "exports/funding-discovery-candidates.csv",
  "exports/candidate-promotion-queue.csv",
  "exports/latest-alert-review.csv",
  "exports/monitor-recent-review.csv",
  "exports/monitor-lane-routing.csv",
  "exports/monitor-recent-signals.csv",
  "exports/discovery-candidates.csv",
  "exports/language-long-tail-review.csv",
  "exports/language-coverage-audit.csv",
  "exports/language-similarity-audit.csv",
  "exports/language-official-evidence-map.csv",
  "exports/irl-coverage-audit.csv",
  "exports/irl-offline-evidence-map.csv",
  "exports/supplemental-funding-news.csv",
  "exports/completion-audit.md",
  "exports/completion-manifest.json",
  "exports/original-objective-audit.md",
  "exports/original-objective-audit.csv",
  "exports/original-objective-audit.json",
];

for (const path of requiredExports) {
  expect(await fileExists(path), `missing export artifact: ${path}`);
}

expect(await fileExists("功能与版本记录.md"), "feature/version log Markdown must exist");
expect(await fileExists("交付说明.md"), "delivery note Markdown must exist");

const sqlite = new DatabaseSync(new URL("exports/exa-social-research.sqlite", root).pathname, { readOnly: true });
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

expect(sqliteCounts.products === productCount(), "SQLite products table must match product count");
expect(sqliteCounts.funding_events === (Array.isArray(brief.fundingEventAudit) ? brief.fundingEventAudit.length : brief.fundingEventAudit?.rows?.length), "SQLite funding_events table must match funding event audit");
expect(sqliteCounts.monitor_signals === monitor.recentItems.length, "SQLite monitor_signals table must match monitor recent items");
expect(sqliteCounts.source_linkage === (Array.isArray(brief.sourceLinkageAudit) ? brief.sourceLinkageAudit.length : brief.sourceLinkageAudit?.rows?.length), "SQLite source_linkage table must match source linkage audit");
expect(sqliteCounts.coverage_gaps === brief.coverageGapRegister.groups.length, "SQLite coverage_gaps table must match coverage gap groups");
expect(sqliteCounts.audit_rows >= productCount(), "SQLite audit_rows table must include webpage detail audit rows");
expect(sqliteCounts.view_language_adjacent_products === brief.languageOfficialEvidenceMap.rows.length, "SQLite language-adjacent view must match language official evidence map");
expect(sqliteCounts.view_irl_funding_news === brief.fundingEventAudit.rows.filter((item) => item.irlRelated).length, "SQLite IRL funding/news view must match IRL event rows");
expect(sqliteCounts.view_latest_monitor_signals === monitor.recentItems.length, "SQLite latest monitor view must match monitor recent items");
expect(sqliteCounts.view_unresolved_coverage_gaps === brief.coverageGapRegister.groups.filter((item) => (item.unresolvedCount ?? 0) > 0).length, "SQLite unresolved coverage gap view must match unresolved groups");
expect(sqliteCounts.view_paid_acquisition_claims === brief.paidAcquisitionEvidenceAudit.rows.length, "SQLite paid-acquisition view must match paid audit rows");

const browser = await chromium.launch({ headless: true });
const latestHandledAlert = brief.candidateReview?.latestAlertReview?.[0];
const viewports = [
  { name: "desktop", width: 1440, height: 1200 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
];
const viewportResults = [];

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  page.on("pageerror", (error) => consoleErrors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto(new URL("exports/exa-ai-social-report.html", root).href, { waitUntil: "networkidle" });
  const result = await page.evaluate(() => ({
    title: document.title,
    activeView: document.body.dataset.activeView,
    visibleSections: [...document.querySelectorAll(".route-section:not([hidden])")].map((section) => section.id),
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    productRows: document.querySelectorAll("#comparison-body tr").length,
    capabilityCards: document.querySelectorAll("#product-capability .capability-card").length,
    companyBackgroundCards: document.querySelectorAll("#company-background-review .company-background-card").length,
    mainFundingEvents: document.querySelectorAll("#funding-timeline .event").length,
    supplementalFundingLinks: document.querySelectorAll("#funding-summary .supplemental-events a").length,
    executiveCards: document.querySelectorAll("#executive-summary .executive-card").length,
    scoringCards: document.querySelectorAll("#evidence-scoring .scoring-card").length,
    exportCards: document.querySelectorAll("#export-pack .export-card").length,
    discoveryReviewItems: document.querySelectorAll("#discovery-scan .review-card:nth-child(2) .review-item").length,
    hasDailyAutomation: document.querySelector("#refresh-workflow")?.textContent.includes("每日 09:00") ?? false,
    hasWeeklyAutomation: document.querySelector("#refresh-workflow")?.textContent.includes("每周一 09:30") ?? false,
    hasFallbackDisclosure:
      document.querySelector("#monitor-summary")?.textContent.includes("Search API + Codex 定时刷新 fallback") ?? false,
    hasStandaloneData: Boolean(window.__EXA_REPORT_DATA__),
  }));
  await page.goto(new URL("exports/exa-ai-social-report.html#matrix", root).href, { waitUntil: "networkidle" });
  const matrixRoute = await page.evaluate(() => ({
    activeView: document.body.dataset.activeView,
    visibleSections: [...document.querySelectorAll(".route-section:not([hidden])")].map((section) => section.id),
    activeNav: document.querySelector(".topbar a.active")?.textContent.trim(),
    rows: document.querySelectorAll("#comparison-body tr").length,
  }));
  await page.goto(new URL("exports/exa-ai-social-report.html#monitor", root).href, { waitUntil: "networkidle" });
  const monitorRoute = await page.evaluate(() => {
    const closure = document.querySelector(".monitor-closure");
    return {
      activeView: document.body.dataset.activeView,
      visibleSections: [...document.querySelectorAll(".route-section:not([hidden])")].map((section) => section.id),
      activeNav: document.querySelector(".topbar a.active")?.textContent.trim(),
      hasClosure: Boolean(closure),
      closureText: closure?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      alertCards: document.querySelectorAll("#monitor-alerts .alert-card").length,
    };
  });
  await page.goto(new URL("exports/exa-ai-social-report.html#evidence", root).href, { waitUntil: "networkidle" });
  const evidenceRoute = await page.evaluate(() => {
    const dataPersistence = document.querySelector("#data-persistence");
    const originalObjectiveCard = document.querySelector(".original-objective-card");
    const originalObjectiveLinks = [...document.querySelectorAll(".original-objective-card a")].map((link) => ({
      text: link.textContent.trim(),
      href: link.getAttribute("href"),
    }));
    return {
      activeView: document.body.dataset.activeView,
      visibleSections: [...document.querySelectorAll(".route-section:not([hidden])")].map((section) => section.id),
      activeNav: document.querySelector(".topbar a.active")?.textContent.trim(),
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      persistenceCards: document.querySelectorAll("#data-persistence .data-persistence-card").length,
      persistenceText: dataPersistence?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      originalObjectiveText: originalObjectiveCard?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      originalObjectiveLinks,
      detailTabs: document.querySelectorAll("#detail-table-app .detail-tabs button").length,
      detailTableRows: document.querySelectorAll("#detail-table-app .detail-data-table tbody tr").length,
    };
  });
  await page.goto(new URL("exports/exa-ai-social-report.html#playbook", root).href, { waitUntil: "networkidle" });
  const playbookRoute = await page.evaluate(() => ({
    activeView: document.body.dataset.activeView,
    visibleSections: [...document.querySelectorAll(".route-section:not([hidden])")].map((section) => section.id),
    activeNav: document.querySelector(".topbar a.active")?.textContent.trim(),
    sqliteGuideCards: document.querySelectorAll("#sqlite-guide .sqlite-card").length,
    sqliteGuideViews: [...document.querySelectorAll("#sqlite-guide .sqlite-view-name")].map((item) => item.textContent.trim()),
    sqliteSqlSnippets: [...document.querySelectorAll("#sqlite-guide .sql-snippet")].filter((item) => item.textContent.includes("SELECT")).length,
  }));
  await page.close();

  expect(consoleErrors.length === 0, `${viewport.name} has console errors: ${consoleErrors.join(" | ")}`);
  expect(result.activeView === "home", `${viewport.name} must default to home overview`);
  expect(result.visibleSections.length === 6, `${viewport.name} home must stay focused instead of rendering every section`);
  expect(result.visibleSections.includes("dashboard"), `${viewport.name} home must include the listening dashboard`);
  expect(result.visibleSections.includes("executive"), `${viewport.name} home must include executive overview`);
  expect(!result.visibleSections.includes("matrix"), `${viewport.name} home must not render the matrix section`);
  expect(result.scrollWidth <= result.clientWidth + 2, `${viewport.name} has page-level horizontal overflow`);
  expect(result.productRows === productCount(), `${viewport.name} product row count mismatch`);
  expect(result.capabilityCards >= 10, `${viewport.name} product capability cards must render`);
  expect(result.companyBackgroundCards >= 8, `${viewport.name} company background review must render`);
  expect(result.mainFundingEvents === brief.fundingTimeline.length, `${viewport.name} funding timeline count mismatch`);
  expect(
    result.supplementalFundingLinks === (brief.discoveryScan?.supplementalFundingNews?.length ?? 0),
    `${viewport.name} supplemental funding count mismatch`,
  );
  expect(result.executiveCards >= 5, `${viewport.name} executive snapshot must render`);
  expect(result.scoringCards >= 3, `${viewport.name} evidence scoring cards must render`);
  expect(result.exportCards >= requiredExports.length, `${viewport.name} export pack must render every artifact`);
  expect(result.discoveryReviewItems >= (brief.discoveryScan?.reviewItems?.length ?? 0), `${viewport.name} discovery review items must render`);
  expect(result.hasDailyAutomation, `${viewport.name} must show daily automation`);
  expect(result.hasWeeklyAutomation, `${viewport.name} must show weekly automation`);
  expect(result.hasFallbackDisclosure || monitor.nativeMonitor?.status === "available", `${viewport.name} must disclose monitor mode`);
  expect(result.hasStandaloneData, `${viewport.name} must use embedded standalone data`);
  expect(matrixRoute.activeView === "matrix", `${viewport.name} #matrix must activate matrix route`);
  expect(matrixRoute.visibleSections.length === 1 && matrixRoute.visibleSections[0] === "matrix", `${viewport.name} #matrix must show only matrix section`);
  expect(matrixRoute.rows === productCount(), `${viewport.name} #matrix row count mismatch`);
  expect(monitorRoute.activeView === "monitor", `${viewport.name} #monitor must activate monitor route`);
  expect(monitorRoute.visibleSections.length === 1 && monitorRoute.visibleSections[0] === "monitor", `${viewport.name} #monitor must show only monitor section`);
  expect(monitorRoute.hasClosure, `${viewport.name} #monitor must render alert closure card`);
  expect(monitorRoute.closureText.includes("新增提醒已闭环"), `${viewport.name} #monitor closure must state alerts are closed`);
  expect(monitorRoute.closureText.includes("待复核 0 条"), `${viewport.name} #monitor closure must show zero pending review`);
  expect(latestHandledAlert?.name && monitorRoute.closureText.includes(latestHandledAlert.name), `${viewport.name} #monitor closure must show latest handled alert`);
  expect(latestHandledAlert?.decision && monitorRoute.closureText.includes(latestHandledAlert.decision), `${viewport.name} #monitor closure must show latest handling decision`);
  expect(monitorRoute.alertCards >= Math.min(monitor.alertItems.length, 8), `${viewport.name} #monitor must render alert cards`);
  expect(evidenceRoute.activeView === "evidence", `${viewport.name} #evidence must activate evidence route`);
  expect(evidenceRoute.visibleSections.includes("detail-tables"), `${viewport.name} #evidence must show data persistence and detail table section`);
  expect(evidenceRoute.visibleSections.includes("completion"), `${viewport.name} #evidence must show completion audit section`);
  expect(evidenceRoute.scrollWidth <= evidenceRoute.clientWidth + 2, `${viewport.name} #evidence has page-level horizontal overflow`);
  expect(evidenceRoute.persistenceCards >= 5, `${viewport.name} #evidence must render data persistence cards`);
  expect(evidenceRoute.persistenceText.includes("本地 JSON + SQLite 数据层"), `${viewport.name} #evidence must state local JSON + SQLite data layer`);
  expect(evidenceRoute.persistenceText.includes("网页内可直接查看"), `${viewport.name} #evidence must state frontend display coverage`);
  expect(evidenceRoute.persistenceText.includes("CSV 不是唯一数据源"), `${viewport.name} #evidence must clarify CSV is not the only data source`);
  expect(evidenceRoute.persistenceText.includes("exports/exa-social-research.sqlite"), `${viewport.name} #evidence must link SQLite database artifact`);
  expect(evidenceRoute.persistenceText.includes("monitor & snapshots"), `${viewport.name} #evidence must show monitor and snapshot persistence`);
  expect(evidenceRoute.originalObjectiveText.includes("原始目标逐条审计"), `${viewport.name} #evidence must render original objective audit card`);
  expect(evidenceRoute.originalObjectiveText.includes("9 行验收索引"), `${viewport.name} #evidence original objective card must show nine-row audit index`);
  expect(evidenceRoute.originalObjectiveText.includes("not-mathematically-complete"), `${viewport.name} #evidence original objective card must preserve all-scope boundary`);
  expect(evidenceRoute.originalObjectiveText.includes("presentationReady = true"), `${viewport.name} #evidence original objective card must show presentation readiness`);
  expect(evidenceRoute.originalObjectiveLinks.some((link) => link.href === "exports/original-objective-audit.md"), `${viewport.name} #evidence must link objective audit Markdown`);
  expect(evidenceRoute.originalObjectiveLinks.some((link) => link.href === "exports/original-objective-audit.csv"), `${viewport.name} #evidence must link objective audit CSV`);
  expect(evidenceRoute.originalObjectiveLinks.some((link) => link.href === "exports/original-objective-audit.json"), `${viewport.name} #evidence must link objective audit JSON`);
  expect(evidenceRoute.detailTabs >= 10, `${viewport.name} #evidence must expose in-page detail datasets`);
  expect(evidenceRoute.detailTableRows > 0, `${viewport.name} #evidence must render an in-page detail table`);
  expect(playbookRoute.activeView === "playbook", `${viewport.name} #playbook must activate playbook route`);
  expect(playbookRoute.visibleSections.length === 1 && playbookRoute.visibleSections[0] === "playbook", `${viewport.name} #playbook must show only playbook section`);
  expect(playbookRoute.sqliteGuideCards === 5, `${viewport.name} #playbook must render five SQLite guide cards`);
  expect(playbookRoute.sqliteSqlSnippets === 5, `${viewport.name} #playbook must render SQL snippets for every SQLite guide card`);
  expect(playbookRoute.sqliteGuideViews.includes("view_language_adjacent_products"), `${viewport.name} #playbook must expose language adjacent SQLite view`);
  expect(playbookRoute.sqliteGuideViews.includes("view_irl_funding_news"), `${viewport.name} #playbook must expose IRL funding/news SQLite view`);
  expect(playbookRoute.sqliteGuideViews.includes("view_latest_monitor_signals"), `${viewport.name} #playbook must expose latest monitor SQLite view`);
  expect(playbookRoute.sqliteGuideViews.includes("view_unresolved_coverage_gaps"), `${viewport.name} #playbook must expose unresolved coverage gaps SQLite view`);
  expect(playbookRoute.sqliteGuideViews.includes("view_paid_acquisition_claims"), `${viewport.name} #playbook must expose paid acquisition claims SQLite view`);

  viewportResults.push({
    name: viewport.name,
    scrollWidth: result.scrollWidth,
    clientWidth: result.clientWidth,
    productRows: result.productRows,
    exportCards: result.exportCards,
  });
}

await browser.close();

const dailyAutomation = await readFile(
  `${process.env.HOME}/.codex/automations/exa-ai-social-market-monitor/automation.toml`,
  "utf8",
).catch(() => "");
const weeklyAutomation = await readFile(
  `${process.env.HOME}/.codex/automations/exa-ai-social-weekly-full-rebuild/automation.toml`,
  "utf8",
).catch(() => "");

expect(dailyAutomation.includes("node scripts/run-all.mjs"), "daily automation must run monitor workflow");
expect(weeklyAutomation.includes("node scripts/run-all.mjs --full"), "weekly automation must run full rebuild workflow");

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures, viewportResults }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  productCards: productCount(),
  timelineEvents: brief.fundingTimeline.length,
  supplementalFundingEvents: brief.discoveryScan?.supplementalFundingNews?.length ?? 0,
  discoveryReviewItems: brief.discoveryScan?.reviewItems?.length ?? 0,
  exportArtifacts: requiredExports.length,
  sqliteCounts,
  viewportResults,
}, null, 2));
