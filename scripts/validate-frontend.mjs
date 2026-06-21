import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

const requiredIds = [
  "thesis",
  "executive",
  "executive-summary",
  "shortlist",
  "channels",
  "opportunities",
  "matrix",
  "comparison-table",
  "matrix-export-csv",
  "synthesis",
  "capability",
  "product-capability",
  "monitor",
  "monitor-digest",
  "funding",
  "timeline-controls",
  "timeline-export-csv",
  "funding-timeline",
  "irl",
  "people",
  "company-background-review",
  "financial",
  "decision-map",
  "market-decision-map",
  "official",
  "audit",
  "evidence-scoring",
  "discovery",
  "discovery-scan",
  "completion",
  "review",
  "data-persistence",
  "detail-tables",
  "playbook",
  "query-matrix",
  "sqlite-guide",
  "refresh-workflow",
  "export-pack",
];

for (const id of requiredIds) {
  expect(html.includes(`id="${id}"`), `index.html must include #${id}`);
}

expect(/styles\.css\?v=[\w.-]+/.test(html), "index.html must version the stylesheet URL for live-demo cache busting");
expect(/app\.js\?v=[\w.-]+/.test(html), "index.html must version the app script URL for live-demo cache busting");

const requiredRenderCalls = [
  "renderHero(data)",
  "renderExecutiveSummary(data)",
  "renderThesis(data)",
  "renderPriorityShortlist(data)",
  "renderChannelSummary(data)",
  "renderOpportunityRanking(data)",
  "renderProductCapability(data)",
  "renderComparisonTable(data)",
  "renderFunding(data)",
  "renderMonitor(monitor, history, ledger, digest, data)",
  "renderFinancial(data)",
  "renderMarketDecisionMap(data)",
  "renderDiscoveryScan(data)",
  "renderCompletionAudit(data)",
  "renderDataPersistence(data, monitor, history, ledger)",
  "renderSqliteGuide(data)",
  "renderRunLog(data)",
  "renderDetailTables(data)",
];

for (const call of requiredRenderCalls) {
  expect(app.includes(call), `app.js must call ${call}`);
}

const requiredSelectors = [
  "#matrix-export-csv",
  "#timeline-export-csv",
  "#comparison-body",
  "#executive-summary",
  "#funding-timeline",
  "#candidate-review",
  "#opportunity-ranking",
  "#product-capability",
  "#company-background-review",
  "#market-decision-map",
  "#channel-summary",
  "#export-pack",
  "#sqlite-guide",
  "#discovery-scan",
  "#evidence-scoring",
  "#data-persistence",
  "#detail-table-app",
];

for (const selector of requiredSelectors) {
  expect(app.includes(selector), `app.js must use ${selector}`);
}

const requiredCss = [
  ".comparison-table",
  ".executive-card",
  ".timeline-controls",
  ".scoring-card",
  ".opportunity-card",
  ".capability-card",
  ".company-background-card",
  ".decision-card",
  ".channel-card",
  ".completion-card",
  ".review-card",
  ".data-persistence-card",
  ".detail-data-table",
  ".workflow-card",
  ".export-card",
  ".sqlite-card",
  ".sql-snippet",
  ".monitor-closure",
  ".original-objective-card",
];

for (const selector of requiredCss) {
  expect(css.includes(selector), `styles.css must style ${selector}`);
}

expect(/<table class="comparison-table" id="comparison-table">/.test(html), "competitive matrix must remain a real table");
expect(html.includes("导出 CSV"), "competitive matrix export button text must exist");
expect(html.includes("executive snapshot"), "executive summary section must exist");
expect(app.includes("一屏先讲清楚") || app.includes("核心判断"), "app must render executive summary content");
expect(html.includes("公司与团队背景"), "people section must explicitly cover company background");
expect(html.includes("商业与规模背景"), "financial section must explicitly cover business/scale background");
expect(html.includes("导出时间线 CSV"), "timeline export button text must exist");
expect(html.includes("需求完成度审计"), "completion audit section title must exist");
expect(app.includes("原始目标逐条审计"), "completion section must render original objective audit summary");
expect(app.includes("originalObjectiveAuditSummary"), "frontend must use original objective audit summary from brief data");
expect(html.includes("网页内明细表"), "detail table section title must exist");
expect(html.includes("data-persistence"), "data persistence section must exist");
expect(html.includes("补充扫描"), "discovery scan section title must exist");
expect(app.includes("证据评分方法"), "coverage audit must render evidence scoring method");
expect(app.includes("Exa query / category / requestId 对照"), "query matrix title must be rendered");
expect(app.includes("window.__EXA_REPORT_DATA__"), "app must support embedded standalone report data");
expect(app.includes("Exa Websets Monitor"), "monitor section must disclose native Exa Websets monitor status");
expect(app.includes("本地 JSON + SQLite 数据层"), "data persistence card must explain JSON and SQLite storage");
expect(app.includes("CSV 不是唯一数据源"), "data persistence card must explain CSV is an export, not the only data source");
expect(app.includes("网页内可直接查看"), "data persistence card must explain frontend display coverage");
expect(app.includes("监控与快照已持久化"), "data persistence card must explain monitor and snapshot persistence");
expect(
  app.includes("降级 fallback") &&
    app.includes("Search API") &&
    app.includes("每日 09:00 Codex 定时刷新兜底"),
  "monitor section must disclose fallback mode",
);
expect(app.includes("新增提醒已闭环"), "monitor section must render alert closure status");
expect(app.includes("exports/latest-alert-review.csv"), "monitor section must link latest alert review CSV");
expect(app.includes("每周一 09:30"), "refresh workflow must mention weekly full rebuild automation");
expect(app.includes("exports/exa-ai-social-report.html"), "export pack must link standalone HTML report");
expect(app.includes("exports/exa-social-research.sqlite"), "export pack must link SQLite database");
expect(app.includes("exports/sqlite-database-guide.md"), "export pack must link SQLite database guide");
expect(app.includes("SQLite 查询手册：不用下载 CSV 也能查数据库"), "playbook must render SQLite query handoff");
expect(app.includes("view_language_adjacent_products"), "SQLite guide must expose language adjacent view");
expect(app.includes("view_irl_funding_news"), "SQLite guide must expose IRL funding/news view");
expect(app.includes("view_latest_monitor_signals"), "SQLite guide must expose latest monitor signals view");
expect(app.includes("view_unresolved_coverage_gaps"), "SQLite guide must expose unresolved coverage gaps view");
expect(app.includes("view_paid_acquisition_claims"), "SQLite guide must expose paid acquisition claims view");
expect(app.includes("exports/current-state.md"), "export pack must link current-state Markdown");
expect(app.includes("exports/current-state.json"), "export pack must link current-state JSON");
expect(app.includes("exports/latest-monitor-run.md"), "export pack must link latest monitor run Markdown receipt");
expect(app.includes("exports/latest-monitor-run.json"), "export pack must link latest monitor run JSON receipt");
expect(app.includes("exports/automation-audit.md"), "export pack must link automation audit Markdown");
expect(app.includes("exports/demo-checklist.md"), "export pack must link demo checklist Markdown");
expect(app.includes("exports/latest-snapshot.md"), "export pack must link latest snapshot Markdown pointer");
expect(app.includes("exports/latest-snapshot.json"), "export pack must link latest snapshot JSON pointer");
expect(app.includes("exports/executive-brief.md"), "export pack must link executive brief Markdown");
expect(app.includes("exports/objective-evidence-map.csv"), "export pack must link objective evidence map CSV");
expect(app.includes("exports/goal-readiness.csv"), "export pack must link goal readiness CSV");
expect(app.includes("exports/competitive-matrix.csv"), "export pack must link competitive matrix CSV");
expect(app.includes("exports/source-coverage.csv"), "export pack must link source coverage CSV");
expect(app.includes("exports/exa-category-evidence-audit.csv"), "export pack must link Exa category evidence audit CSV");
expect(app.includes("exports/exa-category-coverage-guide.md"), "export pack must link Exa category coverage guide Markdown");
expect(app.includes("exports/source-linkage-audit.csv"), "export pack must link source linkage audit CSV");
expect(app.includes("exports/coverage-gap-register.csv"), "export pack must link coverage gap register CSV");
expect(app.includes("exports/candidate-deep-dive.csv"), "export pack must link candidate deep-dive CSV");
expect(app.includes("exports/product-capability-score.csv"), "export pack must link product capability score CSV");
expect(app.includes("exports/growth-channel-audit.csv"), "export pack must link growth/channel audit CSV");
expect(app.includes("exports/functional-difference-audit.csv"), "export pack must link functional difference audit CSV");
expect(app.includes("exports/official-social-coverage-audit.csv"), "export pack must link official/social coverage audit CSV");
expect(app.includes("exports/official-gap-deep-dive.csv"), "export pack must link official/social gap deep-dive CSV");
expect(app.includes("exports/company-background-review.csv"), "export pack must link company background review CSV");
expect(app.includes("exports/company-background-deep-dive.csv"), "export pack must link company background deep-dive CSV");
expect(app.includes("exports/company-background-coverage-audit.csv"), "export pack must link company background coverage audit CSV");
expect(app.includes("exports/funding-news-review.csv"), "export pack must link funding/news review CSV");
expect(app.includes("exports/funding-news-dedup-audit.csv"), "export pack must link funding/news dedupe audit CSV");
expect(app.includes("exports/funding-event-audit.csv"), "export pack must link funding event audit CSV");
expect(app.includes("exports/funding-upgrade-map.csv"), "export pack must link funding upgrade map CSV");
expect(app.includes("exports/monitor-recent-review.csv"), "export pack must link monitor recent review CSV");
expect(app.includes("exports/monitor-lane-routing.csv"), "export pack must link monitor lane routing CSV");
expect(app.includes("exports/discovery-candidates.csv"), "export pack must link discovery candidates CSV");
expect(app.includes("exports/language-long-tail-review.csv"), "export pack must link language long-tail review CSV");
expect(app.includes("exports/language-coverage-audit.csv"), "export pack must link language coverage audit CSV");
expect(app.includes("exports/language-similarity-audit.csv"), "export pack must link language similarity audit CSV");
expect(app.includes("exports/language-official-evidence-map.csv"), "export pack must link language official evidence map CSV");
expect(app.includes("exports/irl-coverage-audit.csv"), "export pack must link IRL coverage audit CSV");
expect(app.includes("exports/irl-offline-evidence-map.csv"), "export pack must link IRL offline evidence map CSV");
expect(app.includes("exports/supplemental-funding-news.csv"), "export pack must link supplemental funding/news CSV");
expect(app.includes("exports/browser-qa-report.md"), "export pack must link browser QA Markdown report");
expect(app.includes("exports/original-objective-audit.md"), "export pack must link original objective audit Markdown");
expect(app.includes("exports/original-objective-audit.csv"), "export pack must link original objective audit CSV");
expect(app.includes("线下真人证据地图"), "IRL section must render offline-human evidence map");
expect(app.includes("补充融资/新闻候选"), "funding section must render supplemental funding/news candidates");
expect(app.includes("exports/completion-audit.md"), "export pack must link completion audit Markdown");
expect(app.includes("exports/completion-manifest.json"), "export pack must link completion manifest JSON");
expect(app.includes("growthChannelAudit") && app.includes("paidAcquisitionEvidenceAudit") && app.includes("fundingProductRollup"), "frontend detail tables must render core audit datasets");
expect(app.includes("renderDetailCellValue"), "frontend detail tables must render structured cell values");
expect(app.includes("detailLink") && app.includes("target = \"_blank\""), "frontend detail tables must render evidence URLs as clickable external links");
expect(app.includes("[\"evidence\", \"证据链接\"]"), "frontend detail tables must expose evidence link columns");
expect(app.includes("[\"fundingEvents\", \"融资链接\"]") && app.includes("[\"monitorSignals\", \"monitor链接\"]"), "IRL detail table must expose funding and monitor evidence links");
expect(app.includes("fundingEventAudit") && app.includes("融资事件级审计"), "frontend detail tables must render funding event audit");
expect(app.includes("sourceLinkageAudit") && app.includes("原始来源关联审计"), "frontend detail tables must render source linkage audit");
expect(app.includes("coverageGapRegister") && app.includes("覆盖缺口 Register"), "frontend detail tables must render coverage gap register");
expect(app.includes("candidateDeepDive") && app.includes("候选补证 Deep-dive"), "frontend detail tables must render candidate deep-dive review");
expect(app.includes("residualSignalReview") && app.includes("Residual 信号复核"), "frontend detail tables must render residual signal review");
expect(app.includes("marketDecisionEvidenceMap") && app.includes("市场判断证据映射"), "frontend detail tables must render market decision evidence map");
expect(app.includes("objectiveEvidenceMap") && app.includes("原始目标证据映射"), "frontend detail tables must render objective evidence map");
expect(css.includes(".detail-link"), "styles.css must style clickable detail links");

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  requiredIds: requiredIds.length,
  requiredRenderCalls: requiredRenderCalls.length,
  requiredSelectors: requiredSelectors.length,
  requiredCss: requiredCss.length,
}, null, 2));
