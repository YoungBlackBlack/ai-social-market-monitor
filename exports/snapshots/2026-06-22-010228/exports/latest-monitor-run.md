# Latest Exa Monitor Run Receipt

Generated: 2026-06-22T01:02:28.528Z

## Summary

- Monitor generated at: 2026-06-22T01:02:20.593Z
- Lookback days: 14
- Source: https://api.exa.ai/search
- Lanes: 9; ok: 9; total results: 89; recent signals: 15; new alerts: 2
- Latest alert review: 173 rows, pending 0
- Recent signal review: 15 rows, pending 0
- Monitor history runs: 30
- Monitor ledger items: 176

## Exa Request IDs

- `76fcf8e67c221b034920a2871bfe945d`
- `26adf4689bc6196bb7ecae15e4948991`
- `1502e0d5a6f3636d6d7ee3bdcf573c09`
- `ea9b3ee8507eb92e2edbed28ad10e3a7`
- `06b07728ae91e786dac0c0e5a89481b9`
- `74a1d4ef6b74ddc6185b2a0f6ae68233`
- `1bc0a8421dfce97fe0c06bcdf544ce10`
- `9d5d4c7165f3533b27c3b7beb2449be0`
- `a03f70940cc6ebaffbe0eeae863322e2`

## Lane Runs

| Lane | HTTP status | Recent signals | Request ID |
|---|---:|---:|---|
| 融资 / 商业化 | 200 | 3 | `76fcf8e67c221b034920a2871bfe945d` |
| 线下真人社交 | 200 | 1 | `26adf4689bc6196bb7ecae15e4948991` |
| 语言交换 / 跨文化社交 | 200 | 1 | `1502e0d5a6f3636d6d7ee3bdcf573c09` |
| 中国 AI 社交出海 | 200 | 1 | `ea9b3ee8507eb92e2edbed28ad10e3a7` |
| 研究 / 政策风险 | 200 | 1 | `06b07728ae91e786dac0c0e5a89481b9` |
| 新公司 / 新产品 | 200 | 0 | `74a1d4ef6b74ddc6185b2a0f6ae68233` |
| 投放 / 付费获客证据 | 200 | 6 | `1bc0a8421dfce97fe0c06bcdf544ce10` |
| Residual IRL watchlist | 200 | 0 | `9d5d4c7165f3533b27c3b7beb2449be0` |
| Coverage signal watchlist | 200 | 2 | `a03f70940cc6ebaffbe0eeae863322e2` |

## Latest Handled Alerts

| Alert | Decision | Source |
|---|---|---|
| 一款“放弃美国市场”的AI社交App，月流水碾压C.ai-36氪 | 市场口径佐证 | 2026-06-22 monitor · 投放 / 付费获客证据 |
| HelloTalk - Learn Languages – Apps on Google Play | 边界观察 | 2026-06-22 monitor · 语言交换 / 跨文化社交 |
| OpenAI Launches ChatGPT Advertising Business in Japan Amid Rising AI Costs \| AJU PRESS | 投放证据候选 | 2026-06-21 monitor · 投放 / 付费获客证据 |
| ‎Timeleft: Make New Friends IRL App - App Store | 边界观察 | 2026-06-21 monitor · 线下真人社交 |
| Tryll Engine Raises $600K Pre-Seed at $6M Valuation to Bring On-Device AI Characters and Conversations to Games – Unite.AI | 边界观察 | 2026-06-21 monitor · 融资 / 商业化 |

## SQLite Persistence Check

| Table / view | Rows |
|---|---:|
| `products` | 42 |
| `funding_events` | 37 |
| `monitor_signals` | 15 |
| `source_linkage` | 723 |
| `coverage_gaps` | 47 |
| `audit_rows` | 339 |
| `view_latest_monitor_signals` | 15 |

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
