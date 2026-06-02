import { mkdir, unlink, writeFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const output = new URL("../exports/exa-social-research.sqlite", import.meta.url);
const brief = JSON.parse(await readFile(new URL("../data/brief.json", import.meta.url), "utf8"));
const monitor = JSON.parse(await readFile(new URL("../data/monitor.json", import.meta.url), "utf8"));
const history = JSON.parse(await readFile(new URL("../data/monitor-history.json", import.meta.url), "utf8"));
const ledger = JSON.parse(await readFile(new URL("../data/monitor-ledger.json", import.meta.url), "utf8"));

function rows(source) {
  if (Array.isArray(source)) return source;
  if (Array.isArray(source?.rows)) return source.rows;
  return [];
}

function text(value) {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value) || typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function bool(value) {
  if (value === true || value === 1) return 1;
  if (value === false || value === 0 || value === undefined || value === null || value === "") return 0;
  if (typeof value === "string") return ["true", "yes", "1", "是"].includes(value.trim().toLowerCase()) ? 1 : 0;
  return value ? 1 : 0;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

await mkdir(new URL("../exports/", import.meta.url), { recursive: true });
await unlink(output).catch(() => {});

const db = new DatabaseSync(output.pathname);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;

  CREATE TABLE meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE products (
    name TEXT PRIMARY KEY,
    cluster TEXT,
    signal TEXT,
    differentiator TEXT,
    channel TEXT,
    irl TEXT,
    evidence_grade TEXT,
    evidence_score INTEGER,
    evidence_count INTEGER,
    evidence_json TEXT NOT NULL,
    raw_json TEXT NOT NULL
  );

  CREATE TABLE funding_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    date TEXT,
    in_window INTEGER,
    amount TEXT,
    amount_type TEXT,
    explicit_usd_m REAL,
    lane TEXT,
    normalized_lane TEXT,
    irl_related INTEGER,
    source_type TEXT,
    kept_in_unique_count INTEGER,
    conclusion TEXT,
    url TEXT,
    raw_json TEXT NOT NULL
  );

  CREATE TABLE monitor_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monitor_id TEXT,
    monitor_label TEXT,
    priority TEXT,
    title TEXT,
    url TEXT,
    published_date TEXT,
    is_recent INTEGER,
    is_known INTEGER,
    alert INTEGER,
    highlight TEXT,
    raw_json TEXT NOT NULL
  );

  CREATE TABLE source_linkage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_layer TEXT,
    query_id TEXT,
    category TEXT,
    request_id TEXT,
    title TEXT,
    url TEXT,
    published_date TEXT,
    linkage_type TEXT,
    review_tier TEXT,
    review_decision TEXT,
    matched_entities TEXT,
    action TEXT,
    raw_json TEXT NOT NULL
  );

  CREATE TABLE coverage_gaps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gap_key TEXT,
    review_tier TEXT,
    review_decision TEXT,
    query_id TEXT,
    category TEXT,
    count INTEGER,
    priority TEXT,
    handling_status TEXT,
    unresolved_count INTEGER,
    next_action TEXT,
    examples_json TEXT NOT NULL,
    raw_json TEXT NOT NULL
  );

  CREATE TABLE audit_rows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id TEXT NOT NULL,
    subject TEXT,
    status TEXT,
    url TEXT,
    row_json TEXT NOT NULL
  );

  CREATE INDEX idx_funding_name ON funding_events(name);
  CREATE INDEX idx_funding_irl ON funding_events(irl_related);
  CREATE INDEX idx_monitor_url ON monitor_signals(url);
  CREATE INDEX idx_source_review ON source_linkage(review_tier, review_decision);
  CREATE INDEX idx_audit_dataset ON audit_rows(dataset_id);
`);

const insertMeta = db.prepare("INSERT INTO meta (key, value) VALUES (?, ?)");
[
  ["generated_at", new Date().toISOString()],
  ["source", "data/brief.json + data/monitor*.json"],
  ["products", String(brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0))],
  ["funding_events", String(rows(brief.fundingEventAudit).length)],
  ["monitor_recent_items", String(monitor.summary?.recentResults ?? monitor.recentItems?.length ?? 0)],
  ["monitor_new_alerts", String(monitor.summary?.newAlerts ?? 0)],
  ["monitor_history_runs", String(history.runs?.length ?? 0)],
  ["monitor_ledger_items", String(ledger.totalItems ?? ledger.items?.length ?? 0)],
].forEach(([key, value]) => insertMeta.run(key, value));

const insertProduct = db.prepare(`
  INSERT INTO products
  (name, cluster, signal, differentiator, channel, irl, evidence_grade, evidence_score, evidence_count, evidence_json, raw_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const cluster of brief.clusters) {
  for (const item of cluster.items) {
    insertProduct.run(
      item.name,
      cluster.title,
      text(item.signal),
      text(item.differentiator),
      text(item.channel),
      text(item.irl),
      text(item.evidenceScore?.grade),
      number(item.evidenceScore?.score),
      number(item.evidenceScore?.evidenceCount),
      text(item.evidence ?? []),
      JSON.stringify({ ...item, cluster: cluster.title }),
    );
  }
}

const insertFunding = db.prepare(`
  INSERT INTO funding_events
  (name, date, in_window, amount, amount_type, explicit_usd_m, lane, normalized_lane, irl_related, source_type, kept_in_unique_count, conclusion, url, raw_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const item of rows(brief.fundingEventAudit)) {
  insertFunding.run(
    text(item.name),
    text(item.date),
    bool(item.inWindow),
    text(item.amount),
    text(item.amountType),
    number(item.explicitUsdM),
    text(item.lane),
    text(item.normalizedLane),
    bool(item.irlRelated),
    text(item.sourceType),
    bool(item.keptInUniqueCount),
    text(item.conclusion),
    text(item.url),
    JSON.stringify(item),
  );
}

const insertMonitor = db.prepare(`
  INSERT INTO monitor_signals
  (monitor_id, monitor_label, priority, title, url, published_date, is_recent, is_known, alert, highlight, raw_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const item of monitor.recentItems ?? []) {
  insertMonitor.run(
    text(item.monitorId),
    text(item.monitorLabel),
    text(item.priority),
    text(item.title),
    text(item.url),
    text(item.publishedDate),
    bool(item.isRecent),
    bool(item.isKnown),
    bool(item.alert),
    text(item.highlight),
    JSON.stringify(item),
  );
}

const insertSource = db.prepare(`
  INSERT INTO source_linkage
  (source_layer, query_id, category, request_id, title, url, published_date, linkage_type, review_tier, review_decision, matched_entities, action, raw_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const item of rows(brief.sourceLinkageAudit)) {
  insertSource.run(
    text(item.sourceLayer),
    text(item.queryId),
    text(item.category),
    text(item.requestId),
    text(item.title),
    text(item.url),
    text(item.publishedDate),
    text(item.linkageType),
    text(item.reviewTier),
    text(item.reviewDecision),
    text(item.matchedEntities ?? []),
    text(item.action),
    JSON.stringify(item),
  );
}

const insertGap = db.prepare(`
  INSERT INTO coverage_gaps
  (gap_key, review_tier, review_decision, query_id, category, count, priority, handling_status, unresolved_count, next_action, examples_json, raw_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const item of brief.coverageGapRegister?.groups ?? []) {
  insertGap.run(
    text(item.key),
    text(item.reviewTier),
    text(item.reviewDecision),
    text(item.queryId),
    text(item.category),
    number(item.count),
    text(item.priority),
    text(item.handlingStatus),
    number(item.unresolvedCount),
    text(item.nextAction),
    text(item.examples ?? []),
    JSON.stringify(item),
  );
}

const auditDatasets = [
  ["growth_channel", brief.growthChannelAudit],
  ["paid_acquisition", brief.paidAcquisitionEvidenceAudit],
  ["functional_difference", brief.functionalDifferenceAudit],
  ["official_social", brief.officialSocialCoverageAudit],
  ["language_official", brief.languageOfficialEvidenceMap],
  ["funding_product_rollup", brief.fundingProductRollup],
  ["irl_offline", brief.irlOfflineEvidenceMap],
  ["company_background", brief.companyBackgroundCoverageAudit],
  ["funding_upgrade", brief.fundingUpgradeMap],
  ["candidate_deep_dive", brief.candidateDeepDive],
  ["residual_signal", brief.residualSignalReview],
  ["market_decision", brief.marketDecisionEvidenceMap],
  ["objective_evidence", brief.objectiveEvidenceMap],
];

const insertAudit = db.prepare("INSERT INTO audit_rows (dataset_id, subject, status, url, row_json) VALUES (?, ?, ?, ?, ?)");
for (const [datasetId, source] of auditDatasets) {
  for (const item of rows(source)) {
    insertAudit.run(
      datasetId,
      text(item.name ?? item.title ?? item.signalName ?? item.requirement ?? item.key),
      text(item.status ?? item.decision ?? item.reviewDecision ?? item.upgradeStatus ?? item.evidenceReadiness),
      text(item.url ?? item.seedUrl),
      JSON.stringify(item),
    );
  }
}

db.exec(`
  CREATE VIEW view_language_adjacent_products AS
    SELECT
      subject AS name,
      json_extract(row_json, '$.similarity') AS similarity,
      json_extract(row_json, '$.similarityScore') AS similarity_score,
      status AS evidence_readiness,
      json_extract(row_json, '$.officialStatus') AS official_status,
      json_extract(row_json, '$.growthSignal') AS growth_signal,
      json_extract(row_json, '$.functionalDifference') AS functional_difference,
      json_extract(row_json, '$.nextCheck') AS next_check,
      row_json
    FROM audit_rows
    WHERE dataset_id = 'language_official';

  CREATE VIEW view_irl_funding_news AS
    SELECT
      name,
      date,
      amount,
      normalized_lane,
      source_type,
      kept_in_unique_count,
      conclusion,
      url,
      raw_json
    FROM funding_events
    WHERE irl_related = 1
    ORDER BY date DESC;

  CREATE VIEW view_latest_monitor_signals AS
    SELECT
      monitor_label,
      priority,
      title,
      published_date,
      is_known,
      alert,
      url,
      highlight
    FROM monitor_signals
    ORDER BY published_date DESC;

  CREATE VIEW view_unresolved_coverage_gaps AS
    SELECT
      review_tier,
      review_decision,
      query_id,
      category,
      count,
      priority,
      unresolved_count,
      next_action,
      examples_json
    FROM coverage_gaps
    WHERE unresolved_count > 0
    ORDER BY priority DESC, count DESC;

  CREATE VIEW view_paid_acquisition_claims AS
    SELECT
      subject AS name,
      json_extract(row_json, '$.evidenceClass') AS evidence_class,
      json_extract(row_json, '$.paidSignalType') AS paid_signal_type,
      json_extract(row_json, '$.confidence') AS confidence,
      json_extract(row_json, '$.claimLevel') AS claim_level,
      json_extract(row_json, '$.safeClaim') AS safe_claim,
      json_extract(row_json, '$.primaryChannel') AS primary_channel,
      json_extract(row_json, '$.nextCheck') AS next_check,
      row_json
    FROM audit_rows
    WHERE dataset_id = 'paid_acquisition';
`);

db.exec("PRAGMA wal_checkpoint(TRUNCATE);");
db.close();

const tableCounts = {
  products: brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0),
  funding_events: rows(brief.fundingEventAudit).length,
  monitor_signals: monitor.recentItems?.length ?? 0,
  source_linkage: rows(brief.sourceLinkageAudit).length,
  coverage_gaps: brief.coverageGapRegister?.groups?.length ?? 0,
  audit_rows: auditDatasets.reduce((count, [, source]) => count + rows(source).length, 0),
};
const viewCounts = {
  view_language_adjacent_products: rows(brief.languageOfficialEvidenceMap).length,
  view_irl_funding_news: rows(brief.fundingEventAudit).filter((item) => item.irlRelated).length,
  view_latest_monitor_signals: monitor.recentItems?.length ?? 0,
  view_unresolved_coverage_gaps: (brief.coverageGapRegister?.groups ?? []).filter((item) => (item.unresolvedCount ?? 0) > 0).length,
  view_paid_acquisition_claims: rows(brief.paidAcquisitionEvidenceAudit).length,
};

const guide = [
  "# SQLite 数据库说明",
  "",
  `生成时间：${new Date().toISOString()}`,
  "",
  "## 文件",
  "",
  "- 数据库：`exports/exa-social-research.sqlite`",
  "- 生成脚本：`node scripts/export-sqlite.mjs`",
  "- 来源数据：`data/brief.json`、`data/monitor.json`、`data/monitor-history.json`、`data/monitor-ledger.json`",
  "",
  "## 表与行数",
  "",
  "| 表 | 行数 | 用途 |",
  "|---|---:|---|",
  `| products | ${tableCounts.products} | 竞品主表产品、赛道、增长信号、渠道、功能差异、IRL 强度和证据评分。 |`,
  `| funding_events | ${tableCounts.funding_events} | 近两年融资/新闻事件级审计，包含窗口、金额类型、IRL 相关性、去重和来源 URL。 |`,
  `| monitor_signals | ${tableCounts.monitor_signals} | 最近一次 Exa monitor 近窗信号。 |`,
  `| source_linkage | ${tableCounts.source_linkage} | Exa 原始/补充来源的 linked、候选、背景、低相关分流状态。 |`,
  `| coverage_gaps | ${tableCounts.coverage_gaps} | 未关联来源按复核层级分组后的覆盖缺口 Register。 |`,
  `| audit_rows | ${tableCounts.audit_rows} | 网页内明细表的通用审计行，保留完整 JSON。 |`,
  `| view_language_adjacent_products | ${viewCounts.view_language_adjacent_products} | HelloTalk / Tandem 相邻语言产品视图。 |`,
  `| view_irl_funding_news | ${viewCounts.view_irl_funding_news} | IRL / 线下真人相关融资与新闻视图。 |`,
  `| view_latest_monitor_signals | ${viewCounts.view_latest_monitor_signals} | 最近一次 monitor 信号视图。 |`,
  `| view_unresolved_coverage_gaps | ${viewCounts.view_unresolved_coverage_gaps} | 仍有 unresolved_count 的覆盖缺口视图。 |`,
  `| view_paid_acquisition_claims | ${viewCounts.view_paid_acquisition_claims} | 投放/付费获客安全表述视图。 |`,
  "",
  "## 常用查询",
  "",
  "### 1. 查看 HelloTalk / Tandem 相邻产品",
  "",
  "```sql",
  "select name, similarity, evidence_readiness, official_status, growth_signal, functional_difference",
  "from view_language_adjacent_products",
  "order by similarity_score desc;",
  "```",
  "",
  "### 2. 查看 IRL / 线下真人相关融资与新闻",
  "",
  "```sql",
  "select name, date, amount, normalized_lane, source_type, url",
  "from view_irl_funding_news;",
  "```",
  "",
  "### 3. 查看最新 monitor 信号",
  "",
  "```sql",
  "select monitor_label, priority, title, published_date, url",
  "from view_latest_monitor_signals;",
  "```",
  "",
  "### 4. 查看未完全闭环的覆盖缺口",
  "",
  "```sql",
  "select review_tier, review_decision, query_id, count, priority, unresolved_count, next_action",
  "from view_unresolved_coverage_gaps;",
  "```",
  "",
  "### 5. 查看某个网页明细表的完整 JSON 行",
  "",
  "```sql",
  "select subject, status, url, row_json",
  "from audit_rows",
  "where dataset_id = 'paid_acquisition'",
  "limit 10;",
  "```",
  "",
  "### 6. 查看投放/付费获客安全表述",
  "",
  "```sql",
  "select name, claim_level, evidence_class, confidence, safe_claim",
  "from view_paid_acquisition_claims",
  "order by claim_level;",
  "```",
  "",
  "## 说明",
  "",
  "- SQLite 是从当前 JSON 数据层派生的本地可查询数据库；刷新 JSON 后请重新运行 `node scripts/export-sqlite.mjs`。",
  "- CSV 仍保留为下载复核附件；网页内明细表和 SQLite 数据库用于不用下载 CSV 也能查看或查询核心审计数据。",
  "- `raw_json` / `row_json` 字段保留原始行，便于后续脚本继续解析。",
  "",
].join("\n");

await writeFile(new URL("../exports/sqlite-database-guide.md", import.meta.url), guide);

console.log(JSON.stringify({
  ok: true,
  output: "exports/exa-social-research.sqlite",
  guide: "exports/sqlite-database-guide.md",
  tables: tableCounts,
  views: viewCounts,
}, null, 2));
