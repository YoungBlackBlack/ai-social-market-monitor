# Exa Category Coverage Guide

Generated: 2026-06-02T06:17:45Z

This guide explains how the current deliverable uses Exa search categories to support app-market, company-background, product-capability, funding/news, and IRL-social judgments. It is a presentation handoff, not a new search run.

## Category Coverage

| Exa category | Searches | Results | Main judgment supported | Where to inspect |
|---|---:|---:|---|---|
| official/social profile | 24 | 262 | Official website, app store, LinkedIn, social/community evidence | `#evidence`, `#playbook`, `exports/official-social-coverage-audit.csv` |
| company | 17 | 160 | Product discovery, positioning, capability, growth/channel clues | `#matrix`, `#evidence`, `exports/competitive-matrix.csv` |
| news | 11 | 128 | Funding/news timeline, launches, growth signals, IRL movement | `#funding`, `#monitor`, `exports/funding-news-review.csv` |
| financial report | 4 | 48 | Revenue/download/market-size/app-ranking context | `#evidence`, `exports/market-decision-evidence-map.csv` |
| people | 2 | 24 | Founder/team/GTM/company-background signals | `#evidence`, `exports/company-background-review.csv` |
| research paper | 2 | 24 | AI companion, loneliness, youth/safety, offline social boundary | `#evidence`, `exports/market-decision-evidence-map.csv` |

## How The Categories Map To The Original Goal

- `company` finds and validates product/company surfaces for HelloTalk/Tandem-like apps, AI companion products, and IRL/social discovery products.
- `news` powers the near-two-year funding/news timeline and the ongoing monitor review queue.
- `official/social profile` answers the user's request for official/social evidence without forcing readers to download CSV first.
- `financial report` is used conservatively for market, revenue, download, and app-ranking context; it is not counted as product funding unless the event-level funding audit supports that.
- `people` is used for founder, team, partnerships, and GTM execution signals, especially for IRL products where local operations matter.
- `research paper` is used for risk and product-boundary reasoning around AI companions, loneliness, teens, and whether AI can substitute or augment real human relationships.

## Current Evidence Boundary

The current state is `presentation-ready-with-monitoring-boundary`: the page, SQLite database, CSV exports, monitor receipt, and snapshots are consistent and verified. It still does not claim mathematical exhaustiveness across a live consumer-social market.

Current hard gates:

- Blocking product-candidate gaps: 0.
- Latest alert pending rows: 0.
- Recent signal pending rows: 0.
- Daily monitor and weekly full rebuild remain the mechanism for newly appearing products, news, financing, and IRL/social signals.

## Fast Demo Path

1. Open `http://127.0.0.1:8000/#home` for the presentation.
2. Use `#matrix` for the HelloTalk/Tandem-adjacent product table.
3. Use `#funding` for the two-year funding/news window and IRL focus.
4. Use `#monitor` for newly detected movement and review status.
5. Use `#playbook` for Exa category/requestId coverage and SQLite query handoff.
