# Browser QA Report

Generated: 2026-06-02 13:56 CST

## Scope

This QA pass verified the local presentation website for the Exa AI social research deliverable:

- URL: `http://127.0.0.1:8000/#home`
- Browser surface: Codex in-app browser
- Viewport used for in-app browser QA: `510 x 760`
- Main page title: `AI 社交与线下真人连接机会图谱`

## Routes Checked

| Route | Navigation label | Result |
|---|---|---|
| `#home` | 总览 | Loaded; executive summary, thesis, priority shortlist, and channel sections visible |
| `#matrix` | 对照表 | Loaded; competitive matrix visible with 42 / 42 products |
| `#funding` | 融资新闻 | Loaded; funding/news timeline and near-two-year summary visible |
| `#monitor` | 持续监控 | Loaded; daily Exa monitor digest visible with 9 lanes, 37 recent items, 4 new alerts |
| `#evidence` | 证据审计 | Loaded; company/team background and evidence audit sections visible |
| `#playbook` | Exa 检索 | Loaded; Exa category run log, refresh workflow, export pack, and SQLite query handoff visible |

## SQLite Query Handoff Check

The Playbook route now exposes the local SQLite database handoff directly in the webpage:

- Browser URL checked: `http://127.0.0.1:8000/#playbook`
- SQLite guide section present: yes
- SQLite guide cards: 5
- SQL snippets present on every card: yes
- Views displayed:
  - `view_language_adjacent_products`
  - `view_irl_funding_news`
  - `view_latest_monitor_signals`
  - `view_unresolved_coverage_gaps`
  - `view_paid_acquisition_claims`

## Demo Checklist Live Route Check

The Playbook route now exposes the short live-demo handoff checklist directly in the export pack:

- Browser URL checked: `http://127.0.0.1:8000/?v=demo-checklist-20260602#playbook`
- Browser URL re-checked after asset versioning: `http://127.0.0.1:8000/#playbook`
- Route hash: `#playbook`
- Demo checklist export card present: `现场演示清单 MD`
- Demo checklist description present: `3 分钟打开路径`
- Demo checklist link target: `exports/demo-checklist.md`
- Latest snapshot pointer cards present: `最新快照指针 MD`, `最新快照指针 JSON`
- Latest snapshot pointer targets: `exports/latest-snapshot.md`, `exports/latest-snapshot.json`
- Exa category coverage guide card present: `Exa 类别覆盖说明 MD`
- Exa category coverage guide target: `exports/exa-category-coverage-guide.md`
- Export cards visible: 62
- Versioned assets loaded: `styles.css?v=20260602-v96`, `app.js?v=20260602-v96`
- In-app browser width check on `#playbook`: `scrollWidth = 510`, `clientWidth = 510`
- Note: asset-level versioning was added after this check, so the plain route now loads the updated Playbook without requiring a page-level cache-bust parameter.

## Monitor Alert Closure Check

The Monitor route now exposes the alert review closure directly in the webpage:

- Browser URL checked: `http://127.0.0.1:8000/?v=<cache-bust>#monitor`
- Monitor closure card present: yes
- Closure headline: `新增提醒已闭环`
- Latest alert review: 38 rows, pending 0
- Recent signal review: 37 rows, pending 0
- Latest handled alert: `Meta is building an AI Pendant and this time it has a working wearables business behind it — TFN`
- Latest decision: `市场口径佐证`

## Evidence Data Display Check

The Evidence route now records that the work is not only a CSV export bundle. Core data is persisted locally and visible in the webpage:

- Browser URL checked: `http://127.0.0.1:8000/?v=<cache-bust>#evidence`
- Browser skill re-check: `http://127.0.0.1:8000/#evidence`
- In-app browser route hash: `#evidence`
- In-app browser title: `AI 社交与线下真人连接机会图谱`
- Data persistence cards present: 5
- Local data layer statement present: `本地 JSON + SQLite 数据层`
- Frontend display statement present: `网页内可直接查看`
- CSV boundary statement present: `CSV 不是唯一数据源`
- SQLite artifact visible: `exports/exa-social-research.sqlite`
- In-page detail datasets exposed: 16 tabs
- In-app browser visible controls/buttons: 36
- In-page detail table rendered: yes
- Monitor/snapshot persistence statement present: `监控与快照已持久化`
- Snapshot artifact visible: `exports/snapshots/`
- Original objective audit card present: yes
- Original objective audit summary: `9 行验收索引`
- Original objective audit links present:
  - `exports/original-objective-audit.md`
  - `exports/original-objective-audit.csv`
  - `exports/original-objective-audit.json`
- Strict boundary preserved on the page: `not-mathematically-complete`
- Presentation readiness visible on the page: `presentationReady = true`

## Layout Checks

- In-app browser skill re-check on `#evidence`: `scrollWidth = 510`, `clientWidth = 510`.
- In-app browser skill re-check on `#playbook`: `scrollWidth = 510`, `clientWidth = 510`.
- In-app browser width check on `#playbook`: `scrollWidth = 510`, `clientWidth = 510`.
- In-app browser width check on `#monitor`: `scrollWidth = 510`, `clientWidth = 510`.
- `validate-deliverable` checked `#evidence` in standalone HTML across desktop `1440`, tablet `820`, and mobile `390`; each viewport returned `scrollWidth = clientWidth`.
- No horizontal overflow was observed in the tested in-app browser viewport.
- `validate-deliverable` also passed for desktop `1440`, tablet `820`, and mobile `390` widths, each with `scrollWidth = clientWidth`.

## Screenshot Note

The in-app browser screenshot capture command timed out twice while the page itself remained navigable and readable. This report therefore records DOM, navigation, and layout evidence instead of attaching a screenshot.

## Boundary

This QA report verifies presentation readiness of the local webpage. It does not change the research completion boundary: the deliverable remains `presentation-ready / broad monitored coverage`, not a mathematically exhaustive proof of every live-market product.
