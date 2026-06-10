# Exa AI Social Market Research - Completion Audit

Generated from current workspace data at 2026-06-07T09:04:36.717Z.

## Scope

Original objective: use Exa categories such as company, people, research paper, news, and financial report to judge app markets, company background, and product capability; find HelloTalk/Tandem-like social apps with growth signals, channels, feature differences, official/social evidence; summarize near-two-year AI social, AI entertainment, and related funding/news, especially products involving offline real-human social interaction.

## Current Evidence Snapshot

- Exa query matrix: 60 searches / 646 raw results.
- Categories covered: official/social profile: 24 queries / 262 results; company: 17 queries / 160 results; news: 11 queries / 128 results; financial report: 4 queries / 48 results; people: 2 queries / 24 results; research paper: 2 queries / 24 results.
- Product evidence cards: 42; language-exchange adjacent: 16; IRL/offline social: 14.
- Raw source linkage audit: 746 results, 643 linked to curated products/timeline/official evidence, 103 in review queue.
- Language coverage audit: 20 unique HelloTalk/Tandem-adjacent entries, 16 in core matrix, 0 in watchlist.
- Language official evidence map: 16 curated language products, 4 ready, 8 displayable, 4 thin.
- Language official/social deep-dive: 14 targeted Exa searches, 112 results.
- Language growth/channel deep-dive: 12 targeted Exa searches, 96 results, 3 strong and 9 usable product rows.
- IRL coverage audit: 30 unique offline-human/IRL entries, 8 core, 11 monitor-linked.
- IRL offline evidence map: 30 entries, 21 funding/news-linked, 14 monitor-linked, 7 strong.
- Candidate deep dive: 11 product candidates, 22 targeted Exa company/news searches, 132 results.
- Funding/news timeline: 25 core events plus 15 supplemental candidates from exact window 2024-06-02 - 2026-06-02 / month window 2024.06 - 2026.06; IRL events: 9; explicit USD funding total: $200M.
- Funding/news dedupe: 40 raw review rows, 37 unique events, 3 duplicate rows.
- Funding upgrade map: 15 supplemental rows, 12 retained candidates, 3 duplicate evidence rows, 5 retained IRL candidates.
- Discovery scan: 10 blind-spot scans / 100 supplementary results.
- Paid acquisition evidence audit: 42 products, 0 explicit paid-acquisition rows, 37 directional channel rows, 5 no-paid-evidence rows, 6 monitor paid-acquisition signals.
- Coverage gaps: 103 unmatched rows retained, 23 product-candidate gaps reviewed by candidate deep-dive, 80 still monitored or archived by lane.
- Monitor: 9 lanes, 34 recent high-signal items, 0 new alerts in latest run; recent signal review queue: 34.
- Exports: competitive matrix, funding timeline, latest alert review, monitor recent review, monitor recent signals.

## Requirement Audit

### 已覆盖: 使用 Exa company / people / research paper / news / financial report 等类别做市场、公司背景和产品能力判断

60 个 Exa 查询、646 条原始结果；主矩阵包含 company、news、research paper、financial report、people，另有 official/social profile pass。

Proof:
- Exa query matrix
- coverage grid
- requestId run log

### 已覆盖: 找 HelloTalk / Tandem 类似社交 app，并按增长信号、渠道、功能差异、官网/社媒证据整理成表

竞品主表 42 行、9 列；语言交换相邻产品 16 个；表格包含增长信号、渠道、功能差异、证据、官方/社媒、证据等级，并支持搜索/筛选/CSV 导出。

Proof:
- competitive matrix
- official/social evidence
- CSV export

### 已覆盖: 统计近两年 AI 社交、泛娱乐相关产品融资和新闻

2024-06-02 - 2026-06-02 对应月份窗口 2024.06 - 2026.06；主时间线 25 条，另有 discovery supplemental 15 条候选融资/新闻；funding summary 按年份、赛道、IRL 占比、明确美元融资口径统计，产品聚合覆盖 35 个产品/公司。

Proof:
- funding summary
- funding timeline
- supplemental funding/news
- product funding rollup
- timeline CSV export

### 已覆盖: 特别关注包含线下真人社交的产品

IRL 主表 14 个产品/边界样本；IRL 相关融资/新闻 9 条，占时间线 36%；线下真人筛选和机会排序均独立展示。

Proof:
- IRL showcase
- matrix filter
- opportunity ranking
- funding summary

### 已覆盖: 用 monitor 监控新的动向和内容

Codex automation 每日 09:00 运行 Exa monitor；monitor 当前 9 条 lane，历史运行 30 次，台账保留 75 条已发现 URL，最新新增 0 条。

Proof:
- daily monitor section
- monitor history
- alert ledger
- latest alert review

### 已覆盖: 前端网页友好展示，而不是表格文件

本地网页包含结论 shortlist、渠道观察、机会排序、筛选矩阵、融资统计、monitor、官方/社媒证据、query matrix、候选升级记录和 completion audit。

Proof:
- localhost page
- frontend structure validator
- browser validation

### 保守说明: “所有”相关产品的穷尽性

消费社交产品持续变化，页面用 broad evidence pass + watchlist + monitor 逼近覆盖，但不声称数学穷尽；另有 10 组盲区扫描、100 条补充结果覆盖 AI friend/wearable、AI-native social、AI dating、companion 长尾、IRL 长尾和语言交换长尾。

Proof:
- coverage audit
- discovery scan
- candidate review
- monitor policy

## Conservative Boundary

Exa evidence pass across company, news, research paper, financial report, and people categories, now with added AI dating, group travel, local activity, language exchange, and China export专项 queries. It is broad coverage, not a mathematical guarantee of every product in market.

The page treats 'all' as a broad, monitored evidence pass rather than a mathematically exhaustive claim. New URLs are captured by monitor, retained in the alert ledger, and classified in the latest alert review workflow.

## Strict Completion Verdict

Status: not-mathematically-complete.

The current evidence set satisfies the presentation deliverable and has no blocking candidate or pending alert-review rows, but the original word 'all' cannot be proven mathematically for a live consumer-social market. The goal remains active through monitor and full rebuild workflows.

- Presentation ready: yes.
- Blocking product-candidate rows: 0.
- Monitored signal rows: 19.
- Latest alert pending rows: 0.
- Recent signal pending rows: 0.

## Local Artifacts

- index.html - presentation webpage
- 功能与版本记录.md - living feature and version log
- 交付说明.md - concise handoff note for presentation entrance, core numbers, and evidence boundary
- exports/current-state.md - concise current-state lock for handoff
- exports/latest-monitor-run.md - latest Exa monitor run receipt with lane requestIds and alert handling
- data/brief.json - curated display brief
- data/exa-results.json - raw Exa category search output
- data/exa-language-growth-channel-deep-dive.json - targeted language growth/channel Exa evidence
- data/exa-language-official-social-deep-dive.json - targeted language official/social Exa evidence
- data/monitor.json - latest Exa monitor output
- exports/executive-brief.md - presentation talk track attachment
- exports/competitive-matrix.csv - table attachment
- exports/source-coverage.csv - Exa query/source coverage attachment
- exports/exa-category-evidence-audit.csv - Exa category to downstream judgment mapping attachment
- exports/source-linkage-audit.csv - raw Exa result linkage/review audit attachment
- exports/coverage-gap-register.csv - unmatched raw-result coverage gap register
- exports/candidate-deep-dive.csv - targeted candidate补证 attachment
- exports/language-coverage-audit.csv - combined HelloTalk/Tandem-adjacent coverage audit attachment
- exports/language-similarity-audit.csv - HelloTalk/Tandem adjacency and differentiation scoring attachment
- exports/language-official-evidence-map.csv - language official/store/social evidence map attachment
- exports/language-growth-channel-deep-dive.csv - targeted language growth/channel evidence attachment
- exports/language-official-social-deep-dive.csv - targeted language official/social evidence attachment
- exports/irl-coverage-audit.csv - combined IRL/offline-human coverage audit attachment
- exports/product-capability-score.csv - derived product capability scoring attachment
- exports/growth-channel-audit.csv - per-product growth signal and GTM channel audit attachment
- exports/acquisition-channel-map.csv - per-product acquisition channel, paid/organic mode, and next evidence check attachment
- exports/paid-acquisition-evidence-audit.csv - explicit paid-acquisition versus directional channel evidence attachment
- exports/functional-difference-audit.csv - per-product mechanism and interaction-mode audit attachment
- exports/official-social-coverage-audit.csv - per-product official, store, LinkedIn, and social evidence coverage attachment
- exports/official-gap-deep-dive.csv - targeted official/social gap evidence attachment
- exports/company-background-review.csv - combined people, company, and financial-report background attachment
- exports/company-background-deep-dive.csv - targeted product-level company background attachment
- exports/company-background-coverage-audit.csv - per-product company background coverage attachment
- exports/market-decision-evidence-map.csv - research/financial evidence to market/product judgment mapping attachment
- exports/funding-timeline.csv - funding/news attachment
- exports/funding-news-review.csv - combined main plus supplemental funding/news review attachment
- exports/funding-news-dedup-audit.csv - combined funding/news dedupe audit attachment
- exports/funding-event-audit.csv - event-level funding/news methodology audit attachment
- exports/funding-product-rollup.csv - product-level funding/news aggregation attachment
- exports/funding-discovery-candidates.csv - discovery funding/news blind-spot candidate attachment
- exports/candidate-promotion-queue.csv - unified language and funding candidate upgrade queue
- exports/latest-alert-review.csv - alert classification attachment
- exports/monitor-recent-review.csv - recent monitor review queue attachment
- exports/monitor-lane-routing.csv - monitor signal lane routing attachment
- exports/monitor-recent-signals.csv - monitor signal attachment
- exports/objective-evidence-map.csv - objective-to-data/export/validator evidence map
- exports/original-objective-audit.md - original objective requirement-by-requirement audit
- exports/original-objective-audit.csv - original objective audit table
- exports/browser-qa-report.md - in-app browser route, viewport, DOM, and layout QA evidence
- exports/completion-manifest.json - machine-readable completion evidence manifest

