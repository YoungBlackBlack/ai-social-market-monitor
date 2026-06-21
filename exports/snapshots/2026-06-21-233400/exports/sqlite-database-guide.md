# SQLite 数据库说明

生成时间：2026-06-21T23:34:00.546Z

## 文件

- 数据库：`exports/exa-social-research.sqlite`
- 生成脚本：`node scripts/export-sqlite.mjs`
- 来源数据：`data/brief.json`、`data/monitor.json`、`data/monitor-history.json`、`data/monitor-ledger.json`

## 表与行数

| 表 | 行数 | 用途 |
|---|---:|---|
| products | 42 | 竞品主表产品、赛道、增长信号、渠道、功能差异、IRL 强度和证据评分。 |
| funding_events | 37 | 近两年融资/新闻事件级审计，包含窗口、金额类型、IRL 相关性、去重和来源 URL。 |
| monitor_signals | 18 | 最近一次 Exa monitor 近窗信号。 |
| source_linkage | 723 | Exa 原始/补充来源的 linked、候选、背景、低相关分流状态。 |
| coverage_gaps | 47 | 未关联来源按复核层级分组后的覆盖缺口 Register。 |
| audit_rows | 341 | 网页内明细表的通用审计行，保留完整 JSON。 |
| view_language_adjacent_products | 16 | HelloTalk / Tandem 相邻语言产品视图。 |
| view_irl_funding_news | 17 | IRL / 线下真人相关融资与新闻视图。 |
| view_latest_monitor_signals | 18 | 最近一次 monitor 信号视图。 |
| view_unresolved_coverage_gaps | 36 | 仍有 unresolved_count 的覆盖缺口视图。 |
| view_paid_acquisition_claims | 42 | 投放/付费获客安全表述视图。 |

## 常用查询

### 1. 查看 HelloTalk / Tandem 相邻产品

```sql
select name, similarity, evidence_readiness, official_status, growth_signal, functional_difference
from view_language_adjacent_products
order by similarity_score desc;
```

### 2. 查看 IRL / 线下真人相关融资与新闻

```sql
select name, date, amount, normalized_lane, source_type, url
from view_irl_funding_news;
```

### 3. 查看最新 monitor 信号

```sql
select monitor_label, priority, title, published_date, url
from view_latest_monitor_signals;
```

### 4. 查看未完全闭环的覆盖缺口

```sql
select review_tier, review_decision, query_id, count, priority, unresolved_count, next_action
from view_unresolved_coverage_gaps;
```

### 5. 查看某个网页明细表的完整 JSON 行

```sql
select subject, status, url, row_json
from audit_rows
where dataset_id = 'paid_acquisition'
limit 10;
```

### 6. 查看投放/付费获客安全表述

```sql
select name, claim_level, evidence_class, confidence, safe_claim
from view_paid_acquisition_claims
order by claim_level;
```

## 说明

- SQLite 是从当前 JSON 数据层派生的本地可查询数据库；刷新 JSON 后请重新运行 `node scripts/export-sqlite.mjs`。
- CSV 仍保留为下载复核附件；网页内明细表和 SQLite 数据库用于不用下载 CSV 也能查看或查询核心审计数据。
- `raw_json` / `row_json` 字段保留原始行，便于后续脚本继续解析。
