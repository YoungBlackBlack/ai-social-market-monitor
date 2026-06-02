# Browser QA Report

Generated: 2026-06-02 13:11 CST

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
| `#monitor` | 持续监控 | Loaded; daily Exa monitor digest visible with 9 lanes, 31 recent items, 1 new alert |
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

## Layout Checks

- In-app browser width check on `#playbook`: `scrollWidth = 510`, `clientWidth = 510`.
- No horizontal overflow was observed in the tested in-app browser viewport.
- `validate-deliverable` also passed for desktop `1440`, tablet `820`, and mobile `390` widths, each with `scrollWidth = clientWidth`.

## Screenshot Note

The in-app browser screenshot capture command timed out twice while the page itself remained navigable and readable. This report therefore records DOM, navigation, and layout evidence instead of attaching a screenshot.

## Boundary

This QA report verifies presentation readiness of the local webpage. It does not change the research completion boundary: the deliverable remains `presentation-ready / broad monitored coverage`, not a mathematically exhaustive proof of every live-market product.
