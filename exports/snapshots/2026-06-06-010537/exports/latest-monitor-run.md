# Latest Exa Monitor Run Receipt

Generated: 2026-06-06T01:04:30.743Z

## Summary

- Monitor generated at: 2026-06-06T01:02:30.679Z
- Lookback days: 14
- Source: https://api.exa.ai/search
- Lanes: 9; ok: 9; total results: 90; recent signals: 33; new alerts: 9
- Latest alert review: 65 rows, pending 0
- Recent signal review: 33 rows, pending 0
- Monitor history runs: 30
- Monitor ledger items: 68

## Exa Request IDs

- `3a10c7c815afb36c492f6acdacc1bfe0`
- `2cafb9cdbaa8d5041026830cb432003d`
- `fe1f643f1dc843686395f700a8cb8dad`
- `62d3079ddc26d40b88419e6de6fb9165`
- `98ecbe3874056bf16026d9190981d83b`
- `d6d0cdcb0108bfcb1a43a39bb9cff945`
- `14a2f7ef3939528cfad8c99c1cb9bbbe`
- `064de4a9b7522760c26bfd02862fab9b`
- `a65f5a0cb74ab737f59789c9e0440545`

## Lane Runs

| Lane | HTTP status | Recent signals | Request ID |
|---|---:|---:|---|
| 融资 / 商业化 | 200 | 6 | `3a10c7c815afb36c492f6acdacc1bfe0` |
| 线下真人社交 | 200 | 4 | `2cafb9cdbaa8d5041026830cb432003d` |
| 语言交换 / 跨文化社交 | 200 | 2 | `fe1f643f1dc843686395f700a8cb8dad` |
| 中国 AI 社交出海 | 200 | 2 | `62d3079ddc26d40b88419e6de6fb9165` |
| 研究 / 政策风险 | 200 | 0 | `98ecbe3874056bf16026d9190981d83b` |
| 新公司 / 新产品 | 200 | 1 | `d6d0cdcb0108bfcb1a43a39bb9cff945` |
| 投放 / 付费获客证据 | 200 | 8 | `14a2f7ef3939528cfad8c99c1cb9bbbe` |
| Residual IRL watchlist | 200 | 6 | `064de4a9b7522760c26bfd02862fab9b` |
| Coverage signal watchlist | 200 | 4 | `a65f5a0cb74ab737f59789c9e0440545` |

## Latest Handled Alerts

| Alert | Decision | Source |
|---|---|---|
| Dedicated Social Event Apps : TikTok Pro Events | 边界观察 | 2026-06-06 monitor · Residual IRL watchlist |
| TikTok's new Events app rewards users for generating buzz about big events - Tubefilter | 边界观察 | 2026-06-06 monitor · Residual IRL watchlist |
| Meta’s New Video-First Shopping Ads Are Doubling DTC Conversion Rates – Ecommerce Times | 投放证据候选 | 2026-06-06 monitor · 投放 / 付费获客证据 |
| ChatGPT Ads Manager now supports product feeds after checkout is killed | 投放证据候选 | 2026-06-06 monitor · 投放 / 付费获客证据 |
| YaraCircle | 候选升级 | 2026-06-06 monitor · 新公司 / 新产品 |

## SQLite Persistence Check

| Table / view | Rows |
|---|---:|
| `products` | 42 |
| `funding_events` | 40 |
| `monitor_signals` | 33 |
| `source_linkage` | 746 |
| `coverage_gaps` | 41 |
| `audit_rows` | 350 |
| `view_latest_monitor_signals` | 33 |

## Persisted Files

- `data/monitor.json`
- `data/monitor-history.json`
- `data/monitor-ledger.json`
- `data/brief.json`
- `exports/latest-alert-review.csv`
- `exports/monitor-recent-review.csv`
- `exports/monitor-recent-signals.csv`
- `exports/exa-social-research.sqlite`
- `exports/exa-ai-social-report.html`

## Boundary

This receipt proves the latest monitor run and its persisted handling status. It does not claim mathematical exhaustiveness for all live-market products or news.
