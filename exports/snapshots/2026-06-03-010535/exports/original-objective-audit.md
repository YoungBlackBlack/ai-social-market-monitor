# 原始目标逐条审计

生成时间：2026-06-03T01:04:38.359Z

## 总结

- 产品主表：42 个；HelloTalk/Tandem 相邻唯一覆盖：20 个。
- 近两年融资/新闻：25 条主时间线、40 行合并复核、37 个去重唯一事件。
- IRL/线下真人证据地图：26 行。
- Monitor：9 条 lane、30 条近窗信号、0 条新增提醒；待复核为 0。
- 严格边界：not-mathematically-complete；presentationReady = true。

## 逐条审计

### exa-categories

- 需求：使用 Exa company / people / research paper / news / financial report 等类别支撑市场、公司背景和产品能力判断
- 状态：proved-for-current-evidence
- 证据：60 组 Exa 查询、646 条结果；类别审计覆盖 6 类，市场判断映射含 13 条 research/financial 证据。
- 工件：data/brief.json; exports/exa-category-evidence-audit.csv; exports/market-decision-evidence-map.csv; exports/source-coverage.csv
- 边界：类别证据已用于当前页面判断；后续新增类别或新结果继续通过 full rebuild 进入同一审计层。
- 下一步检查：运行 node scripts/run-all.mjs --full 后复核 category audit 与 source coverage 行数。

### hellotalk-tandem-products

- 需求：找 HelloTalk / Tandem 类似社交 app，并形成可展示竞品表
- 状态：proved-for-current-evidence-with-monitor-boundary
- 证据：42 个产品进入主矩阵；HelloTalk/Tandem 相邻语言条目 20 个唯一覆盖，其中 16 个在主表语言产品。
- 工件：exports/competitive-matrix.csv; exports/language-coverage-audit.csv; exports/language-similarity-audit.csv
- 边界：不能证明全球市场永久穷尽；但当前阻塞型候选为 0，新增相邻产品进入 monitor/full rebuild。
- 下一步检查：检查 candidate-promotion-queue.csv 与 coverage-gap-register.csv 是否出现新的 product-candidate。

### growth-channel-function-evidence

- 需求：按增长信号、投放/获客渠道、功能差异、官网/社媒证据整理
- 状态：proved-for-current-evidence
- 证据：增长渠道审计覆盖 42 个产品，功能差异审计覆盖 42 个产品，官方/社媒覆盖审计覆盖 42 个产品；投放证据审计覆盖 42 个产品。
- 工件：exports/growth-channel-audit.csv; exports/acquisition-channel-map.csv; exports/paid-acquisition-evidence-audit.csv; exports/functional-difference-audit.csv; exports/official-social-coverage-audit.csv
- 边界：当前产品级明确付费投放证据 0 个，方向性渠道证据 37 个；不把广告生态新闻误升级为具体产品买量结论。
- 下一步检查：优先复核 paid-acquisition monitor lane 的新 URL，再决定是否升级产品级付费投放证据。

### company-background-capability

- 需求：补公司背景与产品能力判断
- 状态：proved-for-current-evidence
- 证据：公司背景 deep-dive 38 组查询、304 条结果，42 个产品均达到产品级部分覆盖；产品能力评分覆盖 42 个产品。
- 工件：exports/company-background-deep-dive.csv; exports/company-background-coverage-audit.csv; exports/product-capability-score.csv
- 边界：部分公司仍是产品级部分覆盖，未强行伪造团队、收入或融资细节。
- 下一步检查：公司新融资、招聘、收入和团队变动继续通过 company/news/financial report 查询补证。

### two-year-funding-news

- 需求：统计近两年 AI 社交、AI 泛娱乐相关产品融资和新闻
- 状态：proved-for-current-evidence
- 证据：精确窗口 2024-06-02 - 2026-06-02；主时间线 25 条，补充候选 15 条，合并复核 40 行，去重唯一事件 37 个，窗口外事件 0 条。
- 工件：exports/funding-timeline.csv; exports/funding-news-review.csv; exports/funding-news-dedup-audit.csv; exports/funding-event-audit.csv; exports/funding-product-rollup.csv
- 边界：月份级和新闻级事件保留日期精度说明；补充候选不直接混入主时间线结论。
- 下一步检查：每次 full rebuild 后检查 funding-discovery-candidates.csv 待复核行是否为 0。

### irl-offline-emphasis

- 需求：特别统计包含线下真人社交的产品和融资/新闻
- 状态：proved-for-current-evidence-with-monitor-boundary
- 证据：IRL/线下真人覆盖 26 个唯一条目，主表 IRL 样本 14 个；线下真人证据地图 26 行，其中融资/新闻链接 20 行、monitor 链接 10 行、强证据 7 行。
- 工件：exports/irl-coverage-audit.csv; exports/irl-offline-evidence-map.csv; exports/funding-product-rollup.csv
- 边界：IRL/watchlist 新信号保持 monitor 观察，不把普通社交、旅游或广告平台新闻直接升级为线下真人社交产品。
- 下一步检查：优先复核 residual-irl-watchlist 与 irl monitor lane 的新增 URL。

### monitor-new-movement

- 需求：用 Exa 能力监控新的动向和内容，并在前端友好展示
- 状态：proved-with-search-api-fallback
- 证据：当前 Exa Websets Monitor 权限不可用，使用 Search API + Codex automation fallback；最近 monitor 9 条 lane、30 条近窗高相关信号、0 条新增提醒；latest alert 待复核 0，recent signal 待复核 0。
- 工件：data/monitor.json; data/monitor-history.json; data/monitor-ledger.json; exports/latest-alert-review.csv; exports/monitor-recent-review.csv; exports/monitor-recent-signals.csv
- 边界：这是 Exa Search API monitor fallback，不是原生 Websets Monitor；页面和文档已披露该边界。
- 下一步检查：每日运行 node scripts/run-all.mjs，并保持新增提醒复核为 0。

### presentation-web

- 需求：不要只给表格，要做方便展示的网页
- 状态：proved-for-current-deliverable
- 证据：网页拆分首页、竞品矩阵、产品图谱、融资/新闻、monitor、证据审计和 playbook；交付验证显示桌面/平板/手机均无横向溢出，前端渲染 49 个导出卡。
- 工件：index.html; app.js; styles.css; exports/exa-ai-social-report.html; exports/browser-qa-report.md
- 边界：网页保留真实表格和 CSV，但展示主体验是多页面研究工作台。
- 下一步检查：运行 node scripts/validate-deliverable.mjs 复核桌面/移动端。

### all-scope-boundary

- 需求：覆盖所有相关产品与新闻
- 状态：not-mathematically-proved
- 证据：当前 strictCompletionVerdict.status = not-mathematically-complete，presentationReady = true；阻塞型候选 0，monitor 观察型缺口 19，背景/低相关留档 61。
- 工件：exports/completion-audit.md; exports/completion-manifest.json; exports/goal-readiness.csv; exports/coverage-gap-register.csv
- 边界：消费社交和 AI companion 市场持续变化，不能把 broad coverage 伪装成数学穷尽；通过 monitor 与 full rebuild 持续逼近。
- 下一步检查：只有在新市场动向持续监控、候选队列清零且仍保持边界披露时，才可声明展示版可用；不能声明数学穷尽。

## 使用说明

这个审计文件用于回答“原始目标哪些已被当前证据证明，哪些仍只能通过 monitor 边界持续逼近”。它不替代网页展示，而是给网页、CSV、completion manifest 和快照之间建立验收索引。

