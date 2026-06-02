# Exa AI 社交研究现场演示清单

更新时间：2026-06-02 14:02 CST

## 3 分钟打开路径

1. 打开 `http://127.0.0.1:8000/#home`。
   先讲结论：这是 AI 社交、AI 泛娱乐、语言交换和线下真人社交的机会图谱，不是单张 CSV 表。
2. 切到 `#matrix`。
   展示 42 个产品主表，重点看增长信号、渠道、功能差异和证据等级。
3. 切到 `#funding`。
   展示 `2024-06-02 - 2026-06-02` 窗口内的融资/新闻，说明 40 行合并复核、37 个去重唯一事件、15 个 IRL/线下真人唯一事件。
4. 切到 `#monitor`。
   展示 9 条 Exa monitor lane、33 条近窗信号、1 条新增提醒，以及 latest alert 和 recent signal 待复核均为 0。
5. 切到 `#evidence`。
   回答“数据是不是只能下载 CSV”：不是。这里有网页内明细表、证据链接、原始目标审计、数据存储状态和覆盖边界。
6. 切到 `#playbook`。
   回答“是否有数据库”：有。SQLite 在 `exports/exa-social-research.sqlite`，页面直接展示 5 个常用 view 和 SQL 示例；Monitor 运行回执也在这里。

## 现场可直接引用的口径

- 数据库存储：核心数据保存在 `data/*.json`，并导出为 `exports/exa-social-research.sqlite`。
- 前端展示：`#evidence` 已展示 16 张网页内明细表，`#playbook` 已展示 SQLite 查询手册和导出入口。
- CSV 定位：CSV 是复核和二次分析附件，不是主要阅读入口。
- Monitor 定位：当前 Exa Websets Monitor 权限不可用，采用 Exa Search API lane + Codex 定时任务 fallback；最新回执在 `exports/latest-monitor-run.md`。
- 严格边界：当前是 `presentation-ready / broad monitored coverage`，不声明数学穷尽；新产品、新融资和新投放信号会继续进入 monitor 和候选复核。

## 核心数字

- 产品主表：42 个。
- HelloTalk / Tandem 相邻语言条目：20 个唯一覆盖条目，16 个进入主表语言产品。
- 融资/新闻：25 条主时间线事件，40 条合并复核行，37 个去重唯一事件。
- IRL / 线下真人：27 行线下真人证据地图，15 个 IRL/线下真人唯一融资/新闻事件。
- Exa evidence：60 组查询，646 条结果，覆盖 company、people、research paper、news、financial report 和 official/social profile。
- SQLite：`products` 42、`funding_events` 40、`monitor_signals` 33、`source_linkage` 746、`coverage_gaps` 41、`audit_rows` 348。
- Monitor：9 条 lane，33 条近窗信号，1 条新增提醒；latest alert pending 0，recent signal pending 0。

## 常见追问

**有没有数据库？**

有。数据库是 `exports/exa-social-research.sqlite`，不是只有 CSV。`#playbook` 页面有 5 个常用 view 的 SQL 示例，`exports/sqlite-database-guide.md` 有完整表说明。

**网页上是否展示了这些内容？**

有。`#matrix`、`#funding`、`#products`、`#monitor`、`#evidence` 和 `#playbook` 都是前端展示页面。特别是 `#evidence` 已经把关键审计表渲染在网页里，来源链接可直接点开。

**为什么还说不是数学穷尽？**

因为消费社交、AI companion、IRL 社交和融资新闻是持续变化市场。当前可展示和可交接，但不能证明“所有未来和所有实时市场变化”已经穷尽；因此用 monitor 承接新动向。

**要看真实 Exa 调用证据怎么办？**

打开 `exports/latest-monitor-run.md`。里面记录了最近一次 9 条 monitor lane 的 Exa requestId、HTTP 状态、近窗信号数和分流结论。

## 收口检查

- 先看 [交付说明.md](../交付说明.md)。
- 再看 [功能与版本记录.md](../功能与版本记录.md)。
- 需要浏览器实测证据时看 [browser-qa-report.md](browser-qa-report.md)。
- 需要机器可读状态时看 [current-state.json](current-state.json) 和 [completion-manifest.json](completion-manifest.json)。
