# 当前状态锁定

生成时间：2026-06-06T09:05:28.086Z

## 状态

- 交付状态：presentation-ready-with-monitoring-boundary
- 严格完成判定：not-mathematically-complete
- presentationReady：true
- 边界：The deliverable is presentation-ready broad monitored coverage. It does not claim mathematical exhaustiveness for all products/news in a live consumer-social market.

## 核心数字

- 产品主表：42 个。
- HelloTalk/Tandem 相邻唯一覆盖：20 个，其中主表语言产品 16 个。
- 近两年融资/新闻：主时间线 25 条，补充候选 15 条，合并复核 40 行，去重唯一事件 37 个；窗口外 0 行，重复 3 行，IRL 唯一 15 行，产品聚合 35 行。
- IRL/线下真人证据地图：29 行，其中 monitor 链接 13 行。
- Exa 查询：60 组，646 条结果。
- Monitor：9 条 lane，34 条近窗信号，0 条新增提醒；历史运行 30 次，提醒台账 72 条，连续 2 次无新增提醒。
- 待复核：latest alert 0，recent signal 0。
- 投放/付费获客：产品级明确投放 0，方向性渠道 37，无投放证据 5；可声称付费投放 0，只能声称渠道线索 37，不能声称投放 5；monitor 候选 6，本轮新增 0。
- 原始目标逐条审计：9 行。

## 展示入口

- localWeb: `http://127.0.0.1:8000/#home`
- standaloneHtml: `exports/exa-ai-social-report.html`
- sqliteDatabase: `exports/exa-social-research.sqlite`
- sqliteDatabaseGuide: `exports/sqlite-database-guide.md`
- latestMonitorRun: `exports/latest-monitor-run.md`
- latestMonitorRunJson: `exports/latest-monitor-run.json`
- exaCategoryCoverageGuide: `exports/exa-category-coverage-guide.md`
- automationAudit: `exports/automation-audit.md`
- deliveryNote: `交付说明.md`
- originalObjectiveAudit: `exports/original-objective-audit.md`
- completionAudit: `exports/completion-audit.md`
- snapshots: `exports/snapshots/`

## 刷新命令

- Daily monitor: node scripts/run-all.mjs
- Weekly/full rebuild: node scripts/run-all.mjs --full
- Hard checks: node scripts/validate-brief.mjs && node scripts/validate-frontend.mjs && node scripts/validate-deliverable.mjs

