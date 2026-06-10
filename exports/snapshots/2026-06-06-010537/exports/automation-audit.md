# Exa AI 社交研究自动化核对

更新时间：2026-06-02 14:07 CST

## 当前自动化

### 每日市场 Monitor

- ID：`exa-ai-social-market-monitor`
- 名称：`Exa AI social market monitor`
- 类型：`cron`
- 状态：`ACTIVE`
- 排期：每日 09:00
- RRULE：`FREQ=DAILY;BYHOUR=9;BYMINUTE=0;BYSECOND=0`
- 模型：`gpt-5`
- 推理强度：`medium`
- 执行环境：`local`
- 工作目录：`/Users/youngzhou/Documents/exa`
- 命令目标：`node scripts/run-all.mjs`
- 任务目标：刷新 Exa monitor、derived brief、CSV/Markdown 导出、standalone HTML、validator 和快照，并总结新增融资、产品上线、app-market 信号、研究/政策风险和 IRL/线下真人社交信号。

### 每周全量 Full Rebuild

- ID：`exa-ai-social-weekly-full-rebuild`
- 名称：`Exa AI social weekly full rebuild`
- 类型：`cron`
- 状态：`ACTIVE`
- 排期：每周一 09:30
- RRULE：`FREQ=WEEKLY;BYDAY=MO;BYHOUR=9;BYMINUTE=30;BYSECOND=0`
- 模型：`gpt-5`
- 推理强度：`medium`
- 执行环境：`local`
- 工作目录：`/Users/youngzhou/Documents/exa`
- 命令目标：`node scripts/run-all.mjs --full`
- 任务目标：重跑 Exa category research、structured synthesis、official/social pass、discovery blind-spot scan、company background pass、language growth/channel pass、language official/social pass、candidate deep-dive、residual signal deep-dive、exports、validators 和 timestamped snapshot。

## 已核对证据

- 本地配置文件存在：
  - `/Users/youngzhou/.codex/automations/exa-ai-social-market-monitor/automation.toml`
  - `/Users/youngzhou/.codex/automations/exa-ai-social-weekly-full-rebuild/automation.toml`
- Codex automation 工具 `view` 能渲染两条 automation card。
- 每日 automation memory 记录 2026-06-02 首次运行：初次 DNS 失败后使用网络权限重跑成功；Exa Websets/Monitor native API 仍为 401，因此采用 `codex-cron-search-api-fallback`；成功刷新 standalone 报告和快照，并让 latest alert / recent signal pending 维持为 0。

## 展示口径

- “Monitor” 不是只在网页里写了一个概念，而是有 ACTIVE 的 Codex cron 自动化。
- 原生 Exa Websets Monitor 当前账号无权限，因此采用 Exa Search API lane + Codex cron fallback。
- 每日刷新适合捕捉新动向；每周全量适合重新扩面、补候选和刷新 Exa category evidence。
- 新 URL 不会直接升级为结论，会先进入 latest alert review、recent signal review、coverage gap 或 candidate deep-dive。

## 相关入口

- 最新 monitor 回执：[latest-monitor-run.md](latest-monitor-run.md)
- Monitor 近期复核：[monitor-recent-review.csv](monitor-recent-review.csv)
- 提醒处理：[latest-alert-review.csv](latest-alert-review.csv)
- 当前状态锁定：[current-state.md](current-state.md)
- 现场演示清单：[demo-checklist.md](demo-checklist.md)
