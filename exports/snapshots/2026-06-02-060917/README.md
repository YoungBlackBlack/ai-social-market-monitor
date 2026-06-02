# Exa AI Social Research Page

This folder contains an Exa-driven research page for AI social, AI entertainment, AI companions, language-exchange social products, and IRL social products.

## Files

- `index.html` - static presentation page, including a competitive matrix table plus narrative cards.
- `styles.css` - page styling.
- `app.js` - renders `data/brief.json` into the page.
- `data/exa-results.json` - raw Exa Search API output.
- `data/brief.json` - curated display brief built from Exa evidence.
- `data/monitor.json` - most recent Exa monitor run.
- `data/monitor-history.json` - retained monitor summaries for trend display.
- `data/monitor-ledger.json` - retained first-seen alert ledger for new monitor items.
- `data/monitor-digest.json` - human-friendly monitor interpretation and recommended actions.
- `data/exa-websets-monitor.json` - Exa Websets Monitor API access probe and fallback status.
- `data/exa-discovery-scan.json` - broad blind-spot scan for AI friend, AI dating, long-tail companion, IRL, and language-exchange candidates.
- `data/exa-official-gap-deep-dive.json` - targeted Exa official/social-profile gap pass for products missing store, LinkedIn, or social-community evidence.
- `data/exa-lingopraxis-deep-dive.json` - targeted Exa company/news evidence for the final LingoPraxis language-exchange watchlist item.
- `data/exa-residual-signal-deep-dive.json` - targeted Exa evidence for remaining medium-priority signal gaps after the promotion queue is cleared.
- `data/exa-company-background-deep-dive.json` - targeted Exa company background evidence for products that were still mostly covered by market-level context.
- `data/exa-language-growth-channel-deep-dive.json` - targeted Exa growth/channel evidence for thin HelloTalk/Tandem-adjacent language products.
- `data/exa-language-official-social-deep-dive.json` - targeted Exa official/social evidence for language products still missing LinkedIn, social, or store proof.
- `data/exa-synthesis.json` - raw structured Exa synthesis output.
- `exports/exa-social-research.sqlite` - local SQLite database generated from the JSON evidence layer for direct querying.
- `exports/sqlite-database-guide.md` - SQLite table dictionary and sample SQL queries.
- `exports/latest-monitor-run.md` / `exports/latest-monitor-run.json` - latest Exa monitor run receipt with lane request IDs, alert handling, and persistence counts.
- `exports/automation-audit.md` - verification note for the active daily monitor and weekly full-rebuild Codex automations.
- `exports/demo-checklist.md` - short live-demo checklist for showing the webpage, database, monitor receipt, and evidence boundary.
- `交付说明.md` - concise handoff note with display entrance, opening order, core numbers, and evidence boundary.
- `功能与版本记录.md` - living feature/version log for the webpage, Exa evidence layers, monitor, exports, and validators.
- `scripts/exa-research.mjs` - reruns the Exa query matrix.
- `scripts/exa-synthesis.mjs` - runs Exa `deep-lite` with `outputSchema` for structured synthesis and gap discovery.
- `scripts/exa-monitor.mjs` - runs recurring Exa monitor queries and writes `data/monitor.json`.
- `scripts/exa-websets-monitor.mjs` - checks whether the current Exa key can use native Websets Monitor endpoints.
- `scripts/exa-discovery-scan.mjs` - runs supplemental Exa scans for market blind spots and funding/news blind spots that are not yet promoted to the main table.
- `scripts/exa-social-profiles.mjs` - reruns the official website, app-store, LinkedIn, social-handle, and community evidence pass, including targeted gap queries for thin official evidence.
- `scripts/exa-official-gap-deep-dive.mjs` - reruns targeted Exa official/social gap searches for products still missing store, LinkedIn, or social-community evidence.
- `scripts/exa-lingopraxis-deep-dive.mjs` - reruns the targeted Exa pass that resolves LingoPraxis as a language-exchange long-tail item rather than a main-matrix upgrade.
- `scripts/exa-residual-signal-deep-dive.mjs` - reruns targeted Exa searches for remaining residual signal gaps such as AI companion long tail and IRL social long tail.
- `scripts/exa-company-background-deep-dive.mjs` - reruns targeted Exa company searches for product-level company, team, revenue, employee, and growth context.
- `scripts/exa-language-growth-channel-deep-dive.mjs` - reruns targeted Exa searches for language-exchange growth, channel, app-store, PR, and community evidence.
- `scripts/exa-language-official-social-deep-dive.mjs` - reruns targeted Exa searches for language official, store, LinkedIn, and social/community evidence.
- `scripts/refresh-derived.mjs` - refreshes computed `brief.json` fields after reruns, including coverage, query matrix, funding summary, and evidence scoring.
- `scripts/export-csv.mjs` - exports CSV attachments for the competitive matrix, funding timeline, monitor recent signals, monitor recent review queue, and latest alert review.
- `scripts/export-sqlite.mjs` - exports `exports/exa-social-research.sqlite` with products, funding events, monitor signals, source linkage, coverage gaps, generic audit rows, and query-ready views.
- `scripts/export-completion-audit.mjs` - exports a Markdown requirement-by-requirement completion audit and a machine-readable completion manifest.
- `scripts/export-objective-audit.mjs` - exports the original-objective audit as Markdown, CSV, and JSON so the initial scope can be checked requirement by requirement.
- `scripts/export-current-state.mjs` - exports the current-state lock as Markdown and JSON for quick handoff checks.
- `scripts/export-monitor-receipt.mjs` - exports the latest monitor run receipt as Markdown and JSON for requestId and alert-handling audits.
- `scripts/export-standalone-html.mjs` - exports a single-file HTML report with current CSS, JS, and data embedded.
- `scripts/snapshot-current.mjs` - saves a timestamped copy of the current page, JSON data, exports, and a manifest under `exports/snapshots/`.
- `scripts/run-all.mjs` - orchestrates either the daily monitor refresh or the full Exa evidence rebuild.
- `scripts/validate-brief.mjs` - validates that the brief stays aligned with raw Exa results and required coverage.
- `scripts/validate-frontend.mjs` - validates that the static page still contains the required presentation sections and interactive controls.
- `scripts/validate-deliverable.mjs` - opens the standalone HTML report in desktop, tablet, and mobile browser viewports and checks counts, exports, automation disclosure, and horizontal overflow.

## Recommended Refresh Flow

For the daily workflow, update the monitor and then refresh derived display fields:

```bash
node scripts/run-all.mjs
```

This runs:

1. `scripts/exa-websets-monitor.mjs`
2. `scripts/exa-monitor.mjs`
3. `scripts/refresh-derived.mjs`
4. `scripts/export-csv.mjs`
5. `scripts/export-sqlite.mjs`
6. `scripts/export-completion-audit.mjs`
7. `scripts/export-objective-audit.mjs`
8. `scripts/export-current-state.mjs`
9. `scripts/export-monitor-receipt.mjs`
10. `scripts/export-standalone-html.mjs`
11. `scripts/validate-brief.mjs`
12. `scripts/validate-frontend.mjs`
13. `scripts/validate-deliverable.mjs`
14. `scripts/snapshot-current.mjs`
15. `scripts/validate-snapshot.mjs`

The Codex app also has an active cron automation named `Exa AI social market monitor`, scheduled daily at 09:00 for `/Users/youngzhou/Documents/exa`. It runs `node scripts/run-all.mjs`, so the monitor data, exports, standalone report, and timestamped snapshot are refreshed together.

There is also an active weekly cron automation named `Exa AI social weekly full rebuild`, scheduled Mondays at 09:30 for `/Users/youngzhou/Documents/exa`. It runs `node scripts/run-all.mjs --full`, including the full Exa category research, official/social evidence pass, targeted official/social gap pass, discovery blind-spot scan, company background pass, language growth/channel pass, language official/social pass, source-linkage candidate pool, targeted candidate deep-dive, LingoPraxis targeted resolution pass, residual signal deep-dive, exports, validators, and timestamped snapshot.

`scripts/exa-websets-monitor.mjs` probes Exa's native Websets Monitor API. If the API key does not have Websets access, the page transparently shows the fallback mode: Exa Search API lanes plus the Codex daily cron automation.

For a full evidence rebuild, rerun all Exa search layers:

```bash
node scripts/run-all.mjs --full
```

This runs the main category research, structured synthesis, official/social profile pass, targeted official/social gap pass, broad discovery blind-spot scan, monitor, derived-field refresh, and validator. Full mode uses more Exa API calls and may surface candidates that still need human promotion into `data/brief.json`. The official/social passes are dynamically rematched into `brief.officialSocialEvidence`, so new Exa results can improve the coverage audit without hand-editing product cards.

## Export Attachments

For the complete handoff/export set, use the daily workflow:

```bash
node scripts/run-all.mjs
```

For a partial manual refresh of CSV, SQLite, and the standalone HTML only, run:

```bash
node scripts/export-csv.mjs
node scripts/export-sqlite.mjs
node scripts/export-standalone-html.mjs
```

The current handoff pack includes:

- `exports/exa-ai-social-report.html`
- `exports/exa-social-research.sqlite`
- `exports/sqlite-database-guide.md`
- `exports/current-state.md`
- `exports/current-state.json`
- `exports/latest-monitor-run.md`
- `exports/latest-monitor-run.json`
- `exports/automation-audit.md`
- `exports/demo-checklist.md`
- `exports/executive-brief.md`
- `exports/objective-evidence-map.csv`
- `exports/goal-readiness.csv`
- `exports/competitive-matrix.csv`
- `exports/source-coverage.csv`
- `exports/source-linkage-audit.csv`
- `exports/candidate-deep-dive.csv`
- `exports/product-capability-score.csv`
- `exports/growth-channel-audit.csv`
- `exports/acquisition-channel-map.csv`
- `exports/paid-acquisition-evidence-audit.csv`
- `exports/official-social-coverage-audit.csv`
- `exports/official-gap-deep-dive.csv`
- `exports/company-background-review.csv`
- `exports/company-background-deep-dive.csv`
- `exports/market-decision-evidence-map.csv`
- `exports/funding-timeline.csv`
- `exports/funding-news-review.csv`
- `exports/funding-news-dedup-audit.csv`
- `exports/funding-upgrade-map.csv`
- `exports/funding-product-rollup.csv`
- `exports/funding-discovery-candidates.csv`
- `exports/candidate-promotion-queue.csv`
- `exports/latest-alert-review.csv`
- `exports/monitor-recent-review.csv`
- `exports/monitor-lane-routing.csv`
- `exports/monitor-recent-signals.csv`
- `exports/discovery-candidates.csv`
- `exports/language-long-tail-review.csv`
- `exports/language-coverage-audit.csv`
- `exports/language-official-evidence-map.csv`
- `exports/language-growth-channel-deep-dive.csv`
- `exports/language-official-social-deep-dive.csv`
- `exports/irl-coverage-audit.csv`
- `exports/irl-offline-evidence-map.csv`
- `exports/supplemental-funding-news.csv`
- `exports/browser-qa-report.md`
- `exports/completion-audit.md`
- `exports/completion-manifest.json`
- `exports/original-objective-audit.md`
- `exports/original-objective-audit.csv`
- `exports/original-objective-audit.json`

The single-file HTML is the easiest presentation artifact to share or open offline. `交付说明.md` is the shortest handoff note for what to open first and how to explain the evidence boundary. The SQLite database is the local queryable store for products, funding events, monitor signals, source linkage, coverage gaps, audit rows, and query-ready views; `exports/sqlite-database-guide.md` documents its tables, views, and sample SQL queries. The CSVs and Markdown audit are supporting attachments for deeper review.

`功能与版本记录.md` records the current feature set and version history for this deliverable. It is included in timestamped snapshots so presentation state, data state, and implementation history can be recovered together.

## Save a Point-in-Time Snapshot

Before or after a monitor/full rebuild, preserve the current report state:

```bash
node scripts/snapshot-current.mjs
```

Snapshots are written to `exports/snapshots/<timestamp>/` and include the live page files, all current `data/*.json` evidence files, exported CSV/HTML/Markdown attachments, and a `manifest.json` with product, funding, monitor, and Exa query counts. This protects a presentation-ready version from later Exa refreshes.

By default the snapshot script keeps the latest 30 timestamped snapshots and prunes older ones. Override this with `SNAPSHOT_KEEP=<number>` when needed.

## Rerun Exa Research

The script reads `EXA_API_KEY` from `.env`.

```bash
node scripts/exa-research.mjs
```

It runs Exa Search API queries across:

- `company`
- `news`
- `research paper`
- `financial report`
- `people`

## Run Exa Synthesis

```bash
node scripts/exa-synthesis.mjs
```

This uses `deep-lite` and `outputSchema` to produce:

- a Chinese synthesis summary,
- core product candidates,
- IRL product candidates,
- watchlist gaps,
- risk notes.

Treat this as a gap-discovery layer. Promote claims into the main product cards only after checking raw evidence quality.

## Run Exa Monitor

```bash
node scripts/exa-monitor.mjs
```

The monitor checks recent movement across:

- funding and monetization,
- IRL/offline social products,
- residual IRL watchlist items promoted by the residual signal deep-dive,
- unresolved coverage-gap signal candidates such as Status, Soul AI, Locpats, Pie app, AI wearable/friend signals, and official profile gaps,
- language exchange social products,
- China AI companion exports,
- research and policy risks,
- new companies and products.

It writes `data/monitor.json`, appends a summary snapshot to `data/monitor-history.json`, and stores first-seen new alert items in `data/monitor-ledger.json`. These files power the page's "持续监控" section. A Codex automation named `Exa AI social market monitor` is configured to run this project daily at 09:00.

The monitor page distinguishes:

- `近期高相关信号`: recent results inside the lookback window, including known items.
- `新增提醒`: recent URLs that were not in the baseline or previous monitor runs.
- `提醒台账`: first-seen new alert URLs retained across future runs.
- `监控解读`: headline, bullets, and recommended actions derived from the latest monitor run.

## Refresh Derived Fields

After rerunning research, synthesis, social profiles, or editing curated products, refresh computed fields:

```bash
node scripts/refresh-derived.mjs
```

This updates:

- `coverage` and hero metrics,
- `requestIds` and query matrix,
- funding/news summary,
- product evidence scores.

## Validate

```bash
node scripts/validate-brief.mjs
node scripts/validate-frontend.mjs
```

The validator checks:

- Exa raw result counts match `data/brief.json`.
- Every Exa request id is represented in the page run log.
- Core products such as HelloTalk, Tandem, Character.AI, Replika, Talkie, PolyBuzz, HiWaifu, 222, Pie, Timeleft, and Partiful are covered.
- The HelloTalk/Tandem adjacent cluster remains broad enough to include newer and boundary language-social products such as SewaYou, Hilokal, Linguado, Slowly, and Conversation Exchange.
- Language similarity audit scores every HelloTalk/Tandem-adjacent row by baseline similarity, shared features, differences, and next evidence checks.
- The IRL social cluster includes AI matching, events infrastructure, dating, 40+ local activities, and group travel boundary cases such as 222, Pie, Timeleft, Meet5, Breeze, WeRoad, Aglow Life, Paxmeet, MeetMux, Weekend, and Thursday.
- The Exa query matrix includes dedicated lanes for AI dating, group travel, local activity social products, newer language exchange products, and AI social revenue/download reports.
- Each product card has growth/signal, channel, differentiator, and evidence links.
- The frontend renders the same product data into a competitive matrix table for comparison.
- People category signals include team/founder/GTM evidence links.
- Financial report signals include revenue/download/MAU benchmarks and evidence links.
- Company background coverage audit maps people and financial-report evidence to every product, separating direct product proof from market-level context.
- Market decision evidence map converts research-paper and financial-report signals into explicit product capability, commercial, market, and risk judgments.
- Market-level financial signals, such as AI companion consumer spend or public dating-company revenue pressure, are mapped into financial/market judgment instead of being counted as product funding.
- Funding/news timeline and research/safety signals meet the current minimum coverage.
- Funding summary matches the timeline, including year breakdown, lane breakdown, IRL event count, explicit USD funding count, and a caveat for mixed amount types.
- Funding event audit tracks every core plus supplemental funding/news row by date precision, amount type, source type, dedupe inclusion, and IRL relevance.
- Funding product rollup aggregates deduped funding/news events by product/company, including event count, explicit USD total, latest date, and IRL relevance.
- Funding discovery candidates retain funding, acquisition, revenue, download, and user-scale signals from discovery scans, separating already-covered supporting evidence from pending review candidates.
- Candidate promotion queue unifies language watchlist products and pending funding/news candidates into one priority list with missing evidence, promotion decision, next action, and proof links.
- Exa synthesis request id and structured fields are present.
- Monitor lanes, request ids, and alert data are present.
- Recent monitor items are present and consistent with recent result counts.
- Monitor history exists and the latest history run matches the current monitor run.
- Monitor alert ledger exists and can retain first-seen new items across runs.
- Monitor digest exists and is timestamp-aligned with the current monitor run.
- Candidate review records promoted candidates, deferred candidates, and the monitor-to-main-table upgrade policy.
- Official/social evidence groups include request ids plus official website, app-store, LinkedIn, social-handle, and community evidence links, and the derived coverage audit must cover every product.
- Exa query matrix exposes every query id, source layer, category, result count, and request id used by the page.
- Exa category evidence audit maps company, news, research paper, financial report, people, and official/social profile categories to downstream judgments and exports.
- Coverage gap register groups every unlinked Exa result by review tier, priority, examples, and next action.
- Growth/channel audit converts each product's narrative growth signal and channel field into GTM tags, growth strength, and next checks.
- Acquisition channel map classifies every product by primary acquisition channel, organic/paid/PR/city-ops mode, confidence, and next channel-efficiency checks.
- Functional difference audit converts product differentiators into mechanism tags, AI role, human interaction mode, and next checks.
- Official/social coverage audit tracks per-product official web, app-store, LinkedIn, social/community, third-party evidence, and remaining gaps.
- Priority shortlist provides four decision lanes with grounded picks and suggested next checks.
- Product cards include an evidence score grade, label, reasons, and scoring method.
- Completion audit maps the original objective to current evidence, including a conservative note on exhaustive coverage.
- Objective evidence map persists each user-facing goal to its webpage route, source data, CSV/HTML exports, and validation gate.
- Refresh-derived script can recompute the derived fields without hand-editing them.
- Run-all script exposes both daily monitor refresh and full Exa evidence rebuild modes.
- Frontend structure includes the required presentation sections, export controls, monitor blocks, completion audit, and Exa query matrix.

## Preview

```bash
python3 -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000
```

## Scope Note

This is a broad Exa evidence pass, not a mathematical guarantee that every consumer social product in the market has been found. The page separates:

- core covered products,
- boundary products,
- watchlist gaps,
- method assumptions.
