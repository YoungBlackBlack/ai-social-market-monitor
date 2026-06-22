const accentClasses = ["accent-blue", "accent-green", "accent-coral", "accent-yellow"];
// Single source of truth for the export-entry count, set when the export pack renders.
let exportEntryCount = 0;
const routeAliases = {
  "": "feed",
  feed: "feed",
  home: "home",
  executive: "home",
  thesis: "home",
  shortlist: "home",
  channels: "home",
  opportunities: "home",
  matrix: "matrix",
  funding: "funding",
  products: "products",
  synthesis: "products",
  language: "products",
  irl: "products",
  monitor: "monitor",
  evidence: "evidence",
  people: "evidence",
  financial: "evidence",
  official: "evidence",
  risk: "evidence",
  decision: "evidence",
  "decision-map": "evidence",
  audit: "evidence",
  discovery: "evidence",
  completion: "evidence",
  review: "evidence",
  "detail-tables": "evidence",
  playbook: "playbook",
};

let toastTimer = null;
function showToast(message) {
  let toast = document.querySelector(".export-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "export-toast";
    toast.setAttribute("role", "status");
    document.body.append(toast);
  }
  toast.textContent = message;
  // force reflow so the transition replays on repeated calls
  void toast.offsetWidth;
  toast.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function debounce(fn, wait = 160) {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

// A single ASCII char (e.g. "a") matches almost everything and is just noise;
// a single CJK char is meaningful, so only ASCII single-char queries are treated as "too short".
function tooShortQuery(query) {
  return query.length === 1 && /[a-z0-9]/i.test(query);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

// Show the Chinese translation as the title; keep the English original on hover to avoid clutter.
function appendItemTitle(card, item) {
  const h4 = el("h4", null, item.titleZh || item.title || "");
  if (item.titleZh && item.title && item.titleZh !== item.title) {
    h4.title = item.title;
  }
  card.append(h4);
  // One-line "why this is recommended to you" note.
  if (item.whyZh) {
    const why = el("p", "why-line");
    why.append(el("span", "why-label", "为什么看"));
    why.append(el("span", "why-text", item.whyZh));
    card.append(why);
  }
}

// Prefer the Chinese highlight when present, else the original, else a fallback string.
function localizedHighlight(item, fallback) {
  return item.highlightZh || item.highlight || fallback;
}

function linkList(items) {
  const wrap = el("div", "evidence-links");
  items.forEach((item) => {
    const link = el("a", null, item.labelZh || item.label);
    // Keep the English headline available on hover when we show the translation.
    if (item.labelZh && item.label && item.labelZh !== item.label) link.title = item.label;
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    wrap.append(link);
  });
  return wrap;
}

function currentRoute() {
  const key = window.location.hash.replace("#", "");
  return routeAliases[key] ?? "home";
}

function applyRoute() {
  const route = currentRoute();
  document.body.dataset.activeView = route;
  document.querySelectorAll(".route-section").forEach((section) => {
    const visible = section.dataset.view === route;
    section.hidden = !visible;
    section.setAttribute("aria-hidden", String(!visible));
  });
  document.querySelectorAll("[data-route]").forEach((link) => {
    const active = link.dataset.route === route;
    link.classList.toggle("active", active);
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
  renderViewToc(route);
}

let viewTocObserver = null;

function renderViewToc(route) {
  const toc = document.querySelector("#view-toc");
  if (!toc) return;
  toc.replaceChildren();
  if (viewTocObserver) {
    viewTocObserver.disconnect();
    viewTocObserver = null;
  }
  const sections = [...document.querySelectorAll(".route-section")].filter(
    (section) => section.dataset.view === route,
  );
  // Only show in-view sub-nav when a view stacks multiple sections.
  if (sections.length <= 1) return;
  const chipBySection = new Map();
  sections.forEach((section) => {
    const heading =
      section.querySelector(".section-head h2")?.textContent ||
      section.querySelector("h2")?.textContent ||
      section.querySelector(".section-label")?.textContent ||
      section.id;
    const label = heading.trim().replace(/[：:].*$/, "").slice(0, 14);
    const chip = el("button", null, label);
    chip.type = "button";
    chip.addEventListener("click", () => {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    toc.append(chip);
    chipBySection.set(section, chip);
  });

  // Highlight the chip for whichever stacked section is currently in view.
  if ("IntersectionObserver" in window) {
    viewTocObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            chipBySection.forEach((chip) => chip.classList.remove("active"));
            chipBySection.get(entry.target)?.classList.add("active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((section) => viewTocObserver.observe(section));
  }
}

function scrollToActiveView() {
  if (currentRoute() === "home") {
    window.scrollTo({ top: 0 });
    return;
  }
  const first = document.querySelector(".route-section:not([hidden])");
  if (first) {
    first.scrollIntoView({ block: "start" });
  } else {
    window.scrollTo({ top: 0 });
  }
}

function setupRouting() {
  applyRoute();
  window.addEventListener("hashchange", () => {
    applyRoute();
    scrollToActiveView();
    const main = document.querySelector("main");
    if (main) {
      main.classList.remove("route-enter");
      void main.offsetWidth; // restart the animation
      main.classList.add("route-enter");
      main.addEventListener("animationend", () => main.classList.remove("route-enter"), { once: true });
    }
  });
}

function setupBackToTop() {
  const button = document.querySelector("#back-to-top");
  if (!button) return;
  const toggle = () => {
    button.hidden = window.scrollY < 600;
  };
  toggle();
  window.addEventListener("scroll", toggle, { passive: true });
  button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function setupSignalMap() {
  const dotFilters = {
    "dot-a": "language",
    "dot-b": "ai-entertainment",
    "dot-c": "companions",
    "dot-d": "irl",
  };
  const dots = Array.from(document.querySelectorAll(".signal-map .dot"));
  dots.forEach((dot) => {
    const matchedClass = Object.keys(dotFilters).find((cls) => dot.classList.contains(cls));
    const target = matchedClass ? dotFilters[matchedClass] : null;
    if (!target) return;
    const label = dot.dataset.label ? `${dot.dataset.label} · 在对照表中筛选` : "在对照表中筛选";
    dot.setAttribute("aria-label", label);
    dot.setAttribute("title", label);
    dot.addEventListener("click", () => {
      const alreadyOnMatrix = window.location.hash === "#matrix";
      if (!alreadyOnMatrix) {
        window.location.hash = "#matrix"; // hashchange handler scrolls to the matrix view
      }
      const matrixSearch = document.querySelector("#matrix-search-input");
      if (matrixSearch) matrixSearch.value = "";
      const filterButton = document.querySelector(`#matrix-controls button[data-filter="${target}"]`);
      if (filterButton) filterButton.click();
      dots.forEach((other) => other.classList.toggle("selected", other === dot));
      // If already on the matrix view no hashchange fires, so bring it into view here.
      if (alreadyOnMatrix) {
        document.querySelector("#matrix")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

function renderHero(data) {
  const metrics = document.querySelectorAll(".metric-row div");
  const heroMetrics = data?.heroMetrics ?? [];
  metrics.forEach((box, index) => {
    const metric = heroMetrics[index];
    // Hide any metric box that has no data so the hero never shows an empty placeholder.
    if (!metric || (!metric.value && !metric.label)) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    box.querySelector("strong").textContent = metric.value ?? "";
    box.querySelector("span").textContent = metric.label ?? "";
  });
}

// Persistent "data freshness" marker in the sidebar so every view shows how current the data is.
function renderDataFreshness(monitor, history) {
  const host = document.querySelector("#sidebar-fresh");
  if (!host) return;
  host.replaceChildren();
  const generatedAt = monitor?.generatedAt;
  if (!generatedAt) {
    host.hidden = true;
    return;
  }
  host.hidden = false;
  host.append(el("span", "fresh-dot"));
  const wrap = el("div", "fresh-text");
  wrap.append(el("strong", null, `数据更新于 ${fmtDate(generatedAt)}`));
  const runs = history?.runs?.length ?? 0;
  wrap.append(el("span", null, `回看 ${monitor?.lookbackDays ?? "—"} 天 · 每日 09:00 自动刷新${runs ? ` · 累计 ${runs} 次` : ""}`));
  host.append(wrap);
}

const SVG_NS = "http://www.w3.org/2000/svg";
function svg(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs || {})) node.setAttribute(key, value);
  return node;
}

function donutChart(segments, size = 140, stroke = 20) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const root = svg("svg", { viewBox: `0 0 ${size} ${size}`, width: size, height: size });
  root.append(svg("circle", { cx: size / 2, cy: size / 2, r, fill: "none", stroke: "#eef2f7", "stroke-width": stroke }));
  let offset = 0;
  segments.forEach((seg) => {
    if (!seg.value) return;
    const len = (circumference * seg.value) / total;
    root.append(svg("circle", {
      cx: size / 2, cy: size / 2, r, fill: "none",
      stroke: seg.color, "stroke-width": stroke,
      "stroke-dasharray": `${len} ${circumference - len}`,
      "stroke-dashoffset": `${-offset}`,
      transform: `rotate(-90 ${size / 2} ${size / 2})`,
    }));
    offset += len;
  });
  return root;
}

function sparkline(values, color, w = 460, h = 96) {
  const root = svg("svg", { viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: "none" });
  root.classList.add("spark-svg");
  if (!values.length) return root;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = values.length > 1 ? (i / (values.length - 1)) * w : w / 2;
    const y = h - ((v - min) / range) * (h - 12) - 6;
    return [Math.round(x), Math.round(y)];
  });
  const area = svg("polygon", {
    fill: color, "fill-opacity": "0.12", stroke: "none",
    points: `0,${h} ${pts.map((p) => p.join(",")).join(" ")} ${w},${h}`,
  });
  const line = svg("polyline", {
    fill: "none", stroke: color, "stroke-width": "2.5",
    "stroke-linejoin": "round", "stroke-linecap": "round",
    points: pts.map((p) => p.join(",")).join(" "),
  });
  root.append(area, line);
  return root;
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

function renderDashboard(data, monitor, history, triage) {
  const kpiRoot = document.querySelector("#dashboard-kpis");
  const gridRoot = document.querySelector("#dashboard-grid");
  if (!kpiRoot || !gridRoot) return;
  kpiRoot.replaceChildren();
  gridRoot.replaceChildren();

  const productCount = (data.clusters ?? []).reduce((sum, c) => sum + (c.items?.length ?? 0), 0);
  const mSummary = monitor?.summary ?? {};
  // Compare against the previous run so monitor KPIs show change-over-time, not just a static number.
  const kpiRuns = history?.runs ?? [];
  const prev = kpiRuns.length > 1 ? kpiRuns[1]?.summary ?? {} : null;
  const deltaOf = (current, previous) => {
    if (prev == null || typeof current !== "number" || typeof previous !== "number") return null;
    return current - previous;
  };
  const kpis = [
    { label: "覆盖产品 / 公司", value: productCount, sub: `${data.clusters?.length ?? 0} 个赛道簇`, accent: true },
    { label: "Exa 查询组", value: data.coverage?.queries ?? "—", sub: `${data.coverage?.results ?? "—"} 条原始结果` },
    { label: "来源域名", value: data.coverage?.uniqueDomains ?? "—", sub: `${data.coverage?.uniqueUrls ?? "—"} 个唯一 URL` },
    { label: "监控主题", value: mSummary.monitors ?? "—", sub: `本次返回 ${mSummary.totalResults ?? "—"} 条`, delta: deltaOf(mSummary.totalResults, prev?.totalResults) },
    { label: "近窗高相关", value: mSummary.recentResults ?? "—", sub: `回看 ${monitor?.lookbackDays ?? "—"} 天`, accent: true, delta: deltaOf(mSummary.recentResults, prev?.recentResults) },
    { label: "新增提醒", value: mSummary.newAlerts ?? "—", sub: triage?.summary ? `升级队列 ${triage.summary.promotionQueueSize ?? 0} 条` : "待人工复核", accent: true, delta: deltaOf(mSummary.newAlerts, prev?.newAlerts) },
  ];
  kpis.forEach((kpi) => {
    const tile = el("article", kpi.accent ? "kpi-tile kpi-accent" : "kpi-tile");
    const labelRow = el("div", "kpi-label-row");
    labelRow.append(el("p", "kpi-label", kpi.label));
    if (kpi.delta != null) {
      const dir = kpi.delta > 0 ? "up" : kpi.delta < 0 ? "down" : "flat";
      const arrow = dir === "up" ? "↑" : dir === "down" ? "↓" : "→";
      const trend = el("span", `kpi-trend ${dir}`, `${arrow} ${kpi.delta > 0 ? "+" : ""}${kpi.delta}`);
      trend.title = "较上一次监控的变化";
      labelRow.append(trend);
    }
    tile.append(labelRow);
    tile.append(el("div", "kpi-value", String(kpi.value)));
    tile.append(el("p", "kpi-sub", kpi.sub));
    kpiRoot.append(tile);
  });

  // 证据等级分布 donut
  const grades = data.evidenceScoring?.counts ?? {};
  const gradeSegments = [
    { label: "A 强证据", value: grades.A ?? 0, color: "#0c8f6e" },
    { label: "B 可展示", value: grades.B ?? 0, color: "#2353ff" },
    { label: "C 边界 / watch", value: grades.C ?? 0, color: "#bd8410" },
    { label: "D 仅观察", value: grades.D ?? 0, color: "#d8442c" },
  ];
  const gradeCard = el("article", "dash-card");
  gradeCard.append(el("h3", null, "证据等级分布"));
  gradeCard.append(el("p", "dash-sub", "按证据规则给每个产品打分（A/B/C/D），类似情绪分布的健康度视角。"));
  const donutRow = el("div", "donut-row");
  donutRow.append(donutChart(gradeSegments));
  const legend = el("div", "donut-legend");
  gradeSegments.forEach((seg) => {
    const item = el("div", "legend-item");
    const sw = el("span", "legend-swatch");
    sw.style.background = seg.color;
    item.append(sw);
    item.append(el("span", null, seg.label));
    item.append(el("b", null, String(seg.value)));
    legend.append(item);
  });
  donutRow.append(legend);
  gradeCard.append(donutRow);
  gridRoot.append(gradeCard);

  // 监控趋势 sparkline
  const runs = [...(history?.runs ?? [])].slice(0, 12).reverse();
  const trendCard = el("article", "dash-card");
  trendCard.append(el("h3", null, "监控趋势"));
  trendCard.append(el("p", "dash-sub", `最近 ${runs.length} 次监控运行的近窗高相关数量。`));
  if (runs.length) {
    trendCard.append(sparkline(runs.map((run) => run.summary?.recentResults ?? 0), "#2353ff"));
    const last = runs[runs.length - 1]?.summary ?? {};
    trendCard.append(el("p", "kpi-sub", `最新：近窗 ${last.recentResults ?? "—"} 条 · 新增提醒 ${last.newAlerts ?? "—"} 条`));
  } else {
    trendCard.append(el("p", "empty-state", "暂无历史运行数据。"));
  }
  gridRoot.append(trendCard);

  // 主题/赛道近窗占比 bars
  const lanes = [...(monitor?.runs ?? [])].sort((a, b) => (b.recentCount ?? 0) - (a.recentCount ?? 0));
  const maxRecent = Math.max(1, ...lanes.map((l) => l.recentCount ?? 0));
  const laneCard = el("article", "dash-card dash-wide");
  laneCard.append(el("h3", null, "监控主题近窗占比"));
  laneCard.append(el("p", "dash-sub", "各监控主题在回看窗口内的高相关信号量，类似社媒监听的来源/话题分布。"));
  const bars = el("div", "lane-bars");
  lanes.forEach((lane) => {
    const row = el("div", "lane-bar");
    row.append(el("span", "lane-name", lane.label ?? lane.id));
    const track = el("div", "lane-track");
    const fill = el("div", "lane-fill");
    fill.style.width = `${Math.round(((lane.recentCount ?? 0) / maxRecent) * 100)}%`;
    track.append(fill);
    row.append(track);
    row.append(el("span", "lane-count", String(lane.recentCount ?? 0)));
    bars.append(row);
  });
  laneCard.append(bars);
  gridRoot.append(laneCard);

  // 最新信号 mentions feed
  const feedCard = el("article", "dash-card dash-wide");
  feedCard.append(el("h3", null, "最新信号"));
  feedCard.append(el("p", "dash-sub", "最近一次监控的高相关条目（mentions 流），点击查看原始证据。"));
  const feed = el("div", "mentions-feed");
  const items = (monitor?.recentItems ?? []).slice(0, 6);
  if (!items.length) {
    feed.append(el("p", "empty-state", "近窗内暂无高相关信号。"));
  }
  items.forEach((item) => {
    const m = el("article", "mention-item");
    const top = el("div", "mention-top");
    top.append(el("span", "mention-source", hostnameOf(item.url)));
    top.append(el("span", null, `${item.monitorLabel ?? ""} · ${fmtDate(item.publishedDate)}`));
    m.append(top);
    if (item.url) {
      const link = el("a", null, item.title ?? "Untitled");
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      m.append(link);
    } else {
      m.append(el("p", null, item.title ?? "Untitled"));
    }
    feed.append(m);
  });
  feedCard.append(feed);
  gridRoot.append(feedCard);
}

function renderExecutiveSummary(data) {
  const root = document.querySelector("#executive-summary");
  const productCount = data.clusters.reduce((count, cluster) => count + cluster.items.length, 0);
  const shortlistCount = document.querySelector("#shortlist-product-count");
  if (shortlistCount) shortlistCount.textContent = `${productCount} 个产品`;
  const languageCount = data.clusters.find((cluster) => cluster.id === "language")?.items.length ?? 0;
  const irlCount = data.clusters.find((cluster) => cluster.id === "irl")?.items.length ?? 0;
  const cards = [
    {
      label: "产品覆盖",
      value: `${productCount}`,
      body: `${languageCount} 个 HelloTalk/Tandem 相邻产品，${irlCount} 个线下真人/IRL 样本。`,
    },
    {
      label: "融资新闻",
      value: `${data.fundingSummary.totalEvents}+${data.fundingSummary.supplementalEvents}`,
      body: `${data.fundingSummary.yearRange} 主时间线 ${data.fundingSummary.totalEvents} 条，盲区候选 ${data.fundingSummary.supplementalEvents} 条。`,
    },
    {
      label: "IRL 机会",
      value: data.fundingSummary.irlShare,
      body: `主时间线 ${data.fundingSummary.irlEvents} 条 IRL 相关事件，优先看 222 / Pie / Timeleft / WeRoad / Breeze。`,
    },
    {
      label: "持续监控",
      value: "Daily + Weekly",
      body: "每日 monitor 盯新增 URL，每周 full rebuild 重跑 Exa category、官方/社媒和 discovery 扫描。",
    },
  ];

  cards.forEach((item) => {
    const card = el("article", "executive-card");
    card.append(el("span", "tag", item.label));
    card.append(el("strong", null, item.value));
    card.append(el("p", null, item.body));
    root.append(card);
  });

  const takeaway = el("article", "executive-card executive-takeaway");
  takeaway.append(el("span", "tag", "核心判断"));
  takeaway.append(el("h3", null, "AI 本身不是终点，真人连接才是更稀缺的兑现层。"));
  takeaway.append(el("p", null, "语言交换、AI dating 和 IRL social 的共同点，是用明确目的降低陌生人互动成本；纯 AI companion 更像内容和情绪消费，需要单独看留存、安全和商业化。"));
  root.append(takeaway);
}

function renderThesis(data) {
  const root = document.querySelector("#thesis-list");
  data.thesis.forEach((text, index) => {
    const item = el("article", "thesis-item");
    item.append(el("span", null, `0${index + 1}`));
    item.append(el("p", null, text));
    root.append(item);
  });
}

function renderPriorityShortlist(data) {
  const root = document.querySelector("#priority-shortlist");
  data.priorityShortlist.forEach((group) => {
    const card = el("article", "shortlist-card");
    card.append(el("span", "tag", group.lane));
    card.append(el("h3", null, group.thesis));
    group.picks.forEach((pick) => {
      const item = el("div", "shortlist-item");
      item.append(el("h4", null, pick.name));
      item.append(el("p", "signal", pick.reason));
      item.append(el("p", null, pick.action));
      card.append(item);
    });
    root.append(card);
  });
}

function renderChannelSummary(data) {
  const root = document.querySelector("#channel-summary");
  if (data.growthChannelAudit) {
    const audit = el("article", "channel-card channel-audit-card");
    const head = el("div", "channel-card-head");
    head.append(el("span", "tag", `${data.growthChannelAudit.totalProducts} products`));
    head.append(el("h3", null, "增长 / 渠道审计"));
    audit.append(head);
    audit.append(el("p", "signal", data.growthChannelAudit.method));
    const stats = el("div", "proof-list");
    data.growthChannelAudit.byGrowthLevel.forEach((item) => {
      stats.append(el("span", null, `${item.level}: ${item.count}`));
    });
    data.growthChannelAudit.byChannelTag.slice(0, 4).forEach((item) => {
      stats.append(el("span", null, `${item.label}: ${item.count}`));
    });
    audit.append(stats);
    const link = el("a", null, "下载增长/渠道审计 CSV");
    link.href = "exports/growth-channel-audit.csv";
    link.target = "_blank";
    link.rel = "noreferrer";
    audit.append(link);
    root.append(audit);
  }

  if (data.acquisitionChannelMap) {
    const acquisition = el("article", "channel-card channel-audit-card");
    const head = el("div", "channel-card-head");
    head.append(el("span", "tag", `${data.acquisitionChannelMap.totalProducts} products`));
    head.append(el("h3", null, "获客渠道地图"));
    acquisition.append(head);
    acquisition.append(el("p", "signal", data.acquisitionChannelMap.method));
    const stats = el("div", "proof-list");
    data.acquisitionChannelMap.byPaidOrOrganic.forEach((item) => {
      stats.append(el("span", null, `${item.mode}: ${item.count}`));
    });
    data.acquisitionChannelMap.byPrimaryChannel.slice(0, 4).forEach((item) => {
      stats.append(el("span", null, `${item.channel}: ${item.count}`));
    });
    acquisition.append(stats);
    const link = el("a", null, "下载获客渠道地图 CSV");
    link.href = "exports/acquisition-channel-map.csv";
    link.target = "_blank";
    link.rel = "noreferrer";
    acquisition.append(link);
    root.append(acquisition);
  }

  if (data.paidAcquisitionEvidenceAudit) {
    const paidAudit = el("article", "channel-card channel-audit-card");
    const head = el("div", "channel-card-head");
    head.append(el("span", "tag", `${data.paidAcquisitionEvidenceAudit.totalProducts} products`));
    head.append(el("h3", null, "投放渠道证据审计"));
    paidAudit.append(head);
    paidAudit.append(el("p", "signal", data.paidAcquisitionEvidenceAudit.method));
    const stats = el("div", "proof-list");
    stats.append(el("span", null, `明确投放 ${data.paidAcquisitionEvidenceAudit.explicitPaidRows}`));
    stats.append(el("span", null, `方向性渠道 ${data.paidAcquisitionEvidenceAudit.directionalRows}`));
    stats.append(el("span", null, `无投放证据 ${data.paidAcquisitionEvidenceAudit.noPaidEvidenceRows}`));
    stats.append(el("span", null, `高置信 ${data.paidAcquisitionEvidenceAudit.highConfidenceRows}`));
    const claimCounts = (data.paidAcquisitionEvidenceAudit.rows ?? []).reduce((acc, row) => {
      acc[row.claimLevel] = (acc[row.claimLevel] ?? 0) + 1;
      return acc;
    }, {});
    stats.append(el("span", null, `可声称投放 ${claimCounts["可声称付费投放"] ?? 0}`));
    stats.append(el("span", null, `只能声称渠道 ${claimCounts["只能声称渠道线索"] ?? 0}`));
    stats.append(el("span", null, `不能声称投放 ${claimCounts["不能声称投放"] ?? 0}`));
    stats.append(el("span", null, `monitor 信号 ${data.paidAcquisitionEvidenceAudit.monitorPaidSignalRows ?? 0}`));
    paidAudit.append(stats);
    if (data.paidAcquisitionEvidenceAudit.monitorPaidExamples?.length) {
      const examples = el("div", "channel-examples");
      data.paidAcquisitionEvidenceAudit.monitorPaidExamples.slice(0, 3).forEach((item) => {
        const block = el("div", "channel-example");
        block.append(el("strong", null, item.name));
        block.append(el("p", null, `${item.source} · ${item.decision}`));
        examples.append(block);
      });
      paidAudit.append(examples);
    }
    const link = el("a", null, "下载投放渠道证据审计 CSV");
    link.href = "exports/paid-acquisition-evidence-audit.csv";
    link.target = "_blank";
    link.rel = "noreferrer";
    paidAudit.append(link);
    root.append(paidAudit);
  }

  data.channelSummary.groups.forEach((group) => {
    const card = el("article", "channel-card");
    const head = el("div", "channel-card-head");
    head.append(el("span", "tag", `${group.count} / ${data.channelSummary.totalProducts}`));
    head.append(el("h3", null, group.label));
    card.append(head);
    card.append(el("p", "signal", group.takeaway));

    const laneLine = el("p", "channel-lanes", group.lanes.slice(0, 3).join(" · "));
    card.append(laneLine);

    const list = el("div", "channel-examples");
    group.examples.forEach((item) => {
      const block = el("div", "channel-example");
      block.append(el("h4", null, item.name));
      block.append(el("p", null, item.channel));
      list.append(block);
    });
    card.append(list);
    root.append(card);
  });
}

function renderOpportunityRanking(data) {
  const root = document.querySelector("#opportunity-ranking");
  data.opportunityRanking.groups.forEach((group) => {
    const card = el("article", "opportunity-card");
    card.append(el("span", "tag", group.label));
    card.append(el("h3", null, group.takeaway));

    const list = el("div", "opportunity-list");
    group.items.forEach((item, index) => {
      const row = el("div", "opportunity-item");
      row.append(el("strong", "opportunity-rank", String(index + 1).padStart(2, "0")));
      const body = el("div", "opportunity-body");
      body.append(el("h4", null, item.name));
      body.append(el("p", "signal", `${item.evidenceGrade} · IRL ${item.irl} · ${item.cluster}`));
      body.append(el("p", null, item.differentiator));
      body.append(el("p", "muted-line", item.why));
      if (item.evidence?.length) body.append(linkList(item.evidence.slice(0, 2)));
      row.append(body);
      list.append(row);
    });
    card.append(list);
    root.append(card);
  });
}

function renderSynthesis(data) {
  const root = document.querySelector("#synthesis-grid");
  const groups = [
    ["summary", "综合摘要", [data.synthesis.summary]],
    ["coreProducts", "核心产品候选", data.synthesis.coreProducts],
    ["irlProducts", "IRL 候选", data.synthesis.irlProducts],
    ["watchlist", "下一轮 Watchlist", data.synthesis.watchlist],
    ["risks", "风险提示", data.synthesis.risks],
  ];

  groups.forEach(([key, title, items]) => {
    const card = el("article", key === "summary" ? "synthesis-card synthesis-summary" : "synthesis-card");
    card.append(el("h3", null, title));
    if (key === "summary") {
      card.append(el("p", null, items[0]));
    } else {
      const list = el("ul", null);
      items.forEach((item) => list.append(el("li", null, item)));
      card.append(list);
    }
    root.append(card);
  });

  const log = el("article", "synthesis-card synthesis-log");
  log.append(el("h3", null, "Exa synthesis request"));
  log.append(el("p", null, data.synthesis.note));
  log.append(el("code", null, data.synthesis.requestId));
  root.append(log);
}

function renderProductCapability(data) {
  const root = document.querySelector("#product-capability");
  if (!root || !data.productCapability) return;

  const summary = el("article", "capability-card capability-summary");
  summary.append(el("h3", null, "评分方法"));
  summary.append(el("p", null, data.productCapability.method));
  const tierRow = el("div", "tier-row");
  data.productCapability.tiers.forEach((item) => {
    tierRow.append(el("span", "tier-chip", `${item.tier}: ${item.count}`));
  });
  summary.append(tierRow);
  root.append(summary);

  if (data.functionalDifferenceAudit) {
    const featureCard = el("article", "capability-card capability-summary");
    featureCard.append(el("h3", null, "功能差异审计"));
    featureCard.append(el("p", null, data.functionalDifferenceAudit.method));
    const featureStats = el("div", "tier-row");
    data.functionalDifferenceAudit.byHumanMode.forEach((item) => {
      featureStats.append(el("span", "tier-chip", `${item.mode}: ${item.count}`));
    });
    data.functionalDifferenceAudit.byMechanism.slice(0, 5).forEach((item) => {
      featureStats.append(el("span", "tier-chip", `${item.label}: ${item.count}`));
    });
    featureCard.append(featureStats);
    const link = el("a", null, "下载功能差异审计 CSV");
    link.href = "exports/functional-difference-audit.csv";
    link.target = "_blank";
    link.rel = "noreferrer";
    featureCard.append(link);
    root.append(featureCard);
  }

  data.productCapability.rows.slice(0, 12).forEach((item) => {
    const card = el("article", "capability-card");
    card.append(el("span", "tag", `${item.tier} · ${item.score}`));
    card.append(el("h3", null, item.name));
    card.append(el("p", "signal", `${item.cluster} · IRL ${item.irl} · ${item.evidenceScore}`));
    const list = el("ul", null);
    item.reasons.forEach((reason) => list.append(el("li", null, reason)));
    card.append(list);
    card.append(el("p", null, `功能差异：${item.differentiator}`));
    card.append(linkList(item.evidence));
    root.append(card);
  });
}

function renderComparisonTable(data) {
  const body = document.querySelector("#comparison-body");
  const controls = document.querySelector("#matrix-controls");
  const count = document.querySelector("#matrix-count");
  const searchInput = document.querySelector("#matrix-search-input");
  const clearSearch = document.querySelector("#matrix-search-clear");
  const exportCsv = document.querySelector("#matrix-export-csv");
  const rows = [];
  let currentFilter = "all";
  const officialItems = (data.officialSocialEvidence?.groups ?? []).flatMap((group) => group.items);

  function officialEvidenceFor(name) {
    const normalized = name.toLowerCase();
    const matches = officialItems.filter((item) => {
      const itemName = item.name.toLowerCase();
      return normalized.includes(itemName) || itemName.includes(normalized);
    });
    return matches.flatMap((item) => item.evidence).slice(0, 4);
  }

  data.clusters.forEach((cluster) => {
    cluster.items.forEach((item) => {
      const officialEvidence = officialEvidenceFor(item.name);
      const officialDisplayEvidence = officialEvidence.length > 0 ? officialEvidence : item.evidence.slice(0, 2);
      const row = document.createElement("tr");
      row.dataset.clusterId = cluster.id;
      row.dataset.irl = item.irl;
      row.record = {
        name: item.name,
        cluster: cluster.title,
        irl: item.irl,
        evidenceScore: item.evidenceScore.label,
        evidenceReasons: item.evidenceScore.reasons.join(" / "),
        signal: item.signal,
        channel: item.channel,
        differentiator: item.differentiator,
        evidence: item.evidence.map((evidence) => `${evidence.label}: ${evidence.url}`).join(" | "),
        official: officialDisplayEvidence.map((evidence) => `${evidence.label}: ${evidence.url}`).join(" | "),
      };
      row.dataset.searchText = [
        item.name,
        cluster.title,
        item.irl,
        item.evidenceScore.label,
        ...item.evidenceScore.reasons,
        item.signal,
        item.channel,
        item.differentiator,
        ...item.evidence.map((evidence) => `${evidence.label} ${evidence.url}`),
        ...officialDisplayEvidence.map((evidence) => `${evidence.label} ${evidence.url}`),
      ].join(" ").toLowerCase();
      [
        item.name,
        cluster.title,
        item.irl,
        item.evidenceScore.label,
        item.signal,
        item.channel,
        item.differentiator,
      ].forEach((text, index) => {
        const cell = document.createElement(index === 0 ? "th" : "td");
        if (index === 0) cell.scope = "row";
        if (index === 3) {
          cell.title = item.evidenceScore.reasons.join(" / ");
          cell.className = `score-cell score-${item.evidenceScore.grade.toLowerCase()}`;
        }
        cell.textContent = text;
        row.append(cell);
      });

      const evidenceCell = document.createElement("td");
      evidenceCell.append(linkList(item.evidence.slice(0, 3)));
      row.append(evidenceCell);

      const officialCell = document.createElement("td");
      if (officialDisplayEvidence.length > 0) {
        officialCell.append(linkList(officialDisplayEvidence));
      } else {
        officialCell.append(el("span", "muted-cell", "未收录"));
      }
      row.append(officialCell);

      body.append(row);
      rows.push(row);
    });
  });

  // Empty-state lives outside the table body so it never inflates row counts.
  const emptyState = el("p", "empty-state matrix-empty", "");
  emptyState.hidden = true;
  const matrixShell = body.closest(".matrix-shell");
  (matrixShell?.parentNode ?? body.parentNode).insertBefore(emptyState, matrixShell ? matrixShell.nextSibling : null);

  const filters = [
    ["all", "全部"],
    ["language", "语言交换"],
    ["ai-entertainment", "AI 泛娱乐"],
    ["companions", "AI 伴侣"],
    ["irl", "线下真人"],
    ["irl-strong", "IRL 高/最高"],
  ];

  function applyFilter(filter = currentFilter) {
    currentFilter = filter;
    const raw = searchInput.value.trim().toLowerCase();
    const isTooShort = tooShortQuery(raw);
    const query = isTooShort ? "" : raw;
    let visible = 0;
    rows.forEach((row) => {
      const matchesFilter =
        filter === "all" ||
        row.dataset.clusterId === filter ||
        (filter === "irl-strong" && /高|最高/.test(row.dataset.irl));
      const matchesSearch = !query || row.dataset.searchText.includes(query);
      const isVisible = matchesFilter && matchesSearch;
      row.hidden = !isVisible;
      if (isVisible) visible += 1;
    });

    controls.querySelectorAll("button").forEach((button) => {
      const selected = button.dataset.filter === filter;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    if (isTooShort) {
      count.textContent = "搜索关键词太短，请至少输入 2 个字符（中文 1 个字也可）。";
    } else {
      count.textContent = query
        ? `当前显示 ${visible} / ${rows.length} 个产品或公司 · 搜索：“${searchInput.value.trim()}”`
        : `当前显示 ${visible} / ${rows.length} 个产品或公司`;
    }

    if (visible === 0) {
      emptyState.textContent = query
        ? `没有匹配“${searchInput.value.trim()}”的产品，换个更短的关键词或切换赛道筛选。`
        : "当前筛选下没有产品。";
    }
    emptyState.hidden = visible !== 0;
  }

  filters.forEach(([filter, label]) => {
    const button = el("button", "filter-button", label);
    button.type = "button";
    button.dataset.filter = filter;
    button.setAttribute("aria-label", `筛选：${label}`);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => applyFilter(filter));
    controls.append(button);
  });

  searchInput.addEventListener("input", debounce(() => applyFilter()));
  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.focus();
    applyFilter();
  });

  exportCsv.addEventListener("click", () => {
    const headers = ["产品/公司", "赛道", "IRL", "证据等级", "增长信号", "渠道", "功能差异", "证据", "官方/社媒"];
    const visibleRecords = rows.filter((row) => !row.hidden).map((row) => row.record);
    const values = visibleRecords.map((record) => [
      record.name,
      record.cluster,
      record.irl,
      record.evidenceScore,
      record.signal,
      record.channel,
      record.differentiator,
      record.evidence,
      record.official,
    ]);
    const csv = [headers, ...values]
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const suffix = currentFilter === "all" ? "all" : currentFilter;
    link.href = url;
    link.download = `exa-social-competitors-${suffix}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`已导出 ${visibleRecords.length} 行到 CSV`);
  });

  applyFilter("all");
}

function fmtDate(value) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const FEED_LAST_VISIT_KEY = "exa-feed-last-visit";
const FEED_STATUS_KEY = "exa-feed-status";

// Per-item triage state (keyed by URL), persisted locally so it survives reloads and daily refreshes.
const FEED_STATUSES = {
  read: { label: "已读", short: "已读" },
  promote: { label: "升级进主表", short: "升级" },
  watch: { label: "仅观察", short: "观察" },
  ignore: { label: "忽略", short: "忽略" },
};

function loadFeedStatusMap() {
  try {
    const raw = window.localStorage.getItem(FEED_STATUS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveFeedStatusMap(map) {
  try {
    window.localStorage.setItem(FEED_STATUS_KEY, JSON.stringify(map));
  } catch {
    /* localStorage unavailable — triage just won't persist */
  }
}

const FEED_WATCH_KEY = "exa-feed-watch-keywords";

// User-defined watch keywords (e.g. a competitor name) so they can pin the topics they care about.
function loadWatchKeywords() {
  try {
    const raw = window.localStorage.getItem(FEED_WATCH_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((k) => typeof k === "string" && k.trim()) : [];
  } catch {
    return [];
  }
}

function saveWatchKeywords(list) {
  try {
    window.localStorage.setItem(FEED_WATCH_KEY, JSON.stringify(list));
  } catch {
    /* localStorage unavailable — watch keywords just won't persist */
  }
}

function itemMatchesKeywords(item, keywords) {
  if (!keywords.length) return false;
  const haystack = `${item.title ?? ""} ${item.titleZh ?? ""} ${item.highlight ?? ""} ${item.highlightZh ?? ""} ${item.monitorLabel ?? ""}`.toLowerCase();
  return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

function feedDayBucket(value, now) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { key: "unknown", label: "未知时间" };
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayMs = 86400000;
  const diffDays = Math.round((startOfDay(new Date(now)) - startOfDay(date)) / dayMs);
  const dayLabel = new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(date);
  let rel = "";
  if (diffDays <= 0) rel = "今天";
  else if (diffDays === 1) rel = "昨天";
  else if (diffDays <= 7) rel = `${diffDays} 天前`;
  return {
    key: startOfDay(date),
    label: rel ? `${dayLabel} · ${rel}` : dayLabel,
  };
}

function renderFeed(ledger, monitor, digest) {
  const stream = document.querySelector("#feed-stream");
  if (!stream) return;
  const banner = document.querySelector("#feed-banner");
  const controls = document.querySelector("#feed-controls");
  const countLine = document.querySelector("#feed-count");

  const items = (ledger.items ?? [])
    .filter((item) => item.firstSeenAt)
    .map((item) => ({ ...item, firstSeenTime: new Date(item.firstSeenAt).getTime() }))
    .filter((item) => !Number.isNaN(item.firstSeenTime))
    .sort((a, b) => b.firstSeenTime - a.firstSeenTime);

  // "Since last visit" — read the previous visit BEFORE overwriting it.
  let lastVisitTime = null;
  try {
    const stored = window.localStorage.getItem(FEED_LAST_VISIT_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) lastVisitTime = parsed;
    }
  } catch {
    lastVisitTime = null;
  }
  const isNew = (item) => lastVisitTime != null && item.firstSeenTime > lastVisitTime;
  const monitorRecentUrls = new Set((monitor?.recentItems ?? []).map((item) => item.url).filter(Boolean));
  const monitorAlertUrls = new Set((monitor?.alertItems ?? []).map((item) => item.url).filter(Boolean));
  const newSinceVisit = () => (lastVisitTime != null ? items.filter(isNew).length : 0);

  const renderBanner = () => {
    if (!banner) return;
    const count = newSinceVisit();
    banner.replaceChildren();
    banner.classList.toggle("is-new", count > 0);
    const latestRun = monitor.generatedAt ? fmtDate(monitor.generatedAt) : "—";
    let title;
    if (lastVisitTime == null) {
      title = `已为你整理 ${items.length} 条监控动向（按发现时间倒序）`;
    } else if (count > 0) {
      title = `自你上次访问以来，新发现 ${count} 条动向`;
    } else {
      title = "自你上次访问以来暂无新动向";
    }
    banner.append(el("strong", "feed-banner-title", title));
    if (lastVisitTime != null) {
      banner.append(el("span", "feed-banner-sub", `上次访问：${fmtDate(new Date(lastVisitTime).toISOString())}`));
    }
    banner.append(el("span", "feed-banner-sub", `最近一次监控：${latestRun} · ${digest?.headline ?? ""}`));
  };
  renderBanner();

  // Lane + priority filters so the user can zoom into the competitor/track they care about.
  const laneOrder = [];
  const laneSeen = new Set();
  items.forEach((item) => {
    if (!laneSeen.has(item.monitorLabel)) {
      laneSeen.add(item.monitorLabel);
      laneOrder.push(item.monitorLabel);
    }
  });

  let activeLane = "all";
  // Default to the full ledger in reverse-chronological order so the feed opens as a news stream.
  let activeSegment = "history";
  let keyOnly = false;
  let hideProcessed = false;
  let watchOnly = false;
  const statusMap = loadFeedStatusMap();
  let watchKeywords = loadWatchKeywords();

  const setStatus = (url, status) => {
    if (!url) return;
    if (statusMap[url] === status) {
      delete statusMap[url];
    } else {
      statusMap[url] = status;
    }
    saveFeedStatusMap(statusMap);
    renderStream();
  };

  const buildActions = (item) => {
    const row = el("div", "feed-actions");
    const current = statusMap[item.url];
    Object.entries(FEED_STATUSES).forEach(([key, meta]) => {
      const btn = el("button", `feed-action-btn${current === key ? " active" : ""}`, meta.short);
      btn.type = "button";
      btn.title = meta.label;
      btn.setAttribute("aria-pressed", String(current === key));
      btn.addEventListener("click", () => setStatus(item.url, key));
      row.append(btn);
    });
    return row;
  };

  const buildCard = (item) => {
    const fresh = isNew(item);
    const status = statusMap[item.url];
    const isWatchHit = itemMatchesKeywords(item, watchKeywords);
    const classes = ["feed-card", `priority-${item.priority}`];
    if (fresh) classes.push("is-new");
    if (status) classes.push(`status-${status}`, "is-processed");
    if (isWatchHit) classes.push("feed-watch-hit");
    const card = el("article", classes.join(" "));
    const tagRow = el("div", "feed-tag-row");
    tagRow.append(el("span", "tag", item.monitorLabel));
    if (fresh) tagRow.append(el("span", "badge-new", "NEW"));
    if (isWatchHit) tagRow.append(el("span", "badge-watch", "★ 关注"));
    if (status) tagRow.append(el("span", "badge-status", FEED_STATUSES[status].label));
    card.append(tagRow);
    appendItemTitle(card, item);
    const dateLine = el("p", "date-line", `发现于 ${fmtDate(item.firstSeenAt)}`);
    if (item.publishedDate) {
      dateLine.append(el("span", "date-sub", ` · 发布 ${fmtDate(item.publishedDate)}`));
    }
    card.append(dateLine);
    card.append(el("p", "feed-summary", localizedHighlight(item, "Exa monitor 捕捉到的新动向。")));
    if (item.url) {
      const link = el("a", null, "查看证据");
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      card.append(link);
    }
    card.append(buildActions(item));
    return card;
  };

  // Incremental rendering: render in batches and load more as the user scrolls,
  // keeping day groups continuous across batches so the long list stays light.
  const FEED_BATCH = 30;
  let feedFiltered = [];
  let renderedCount = 0;
  let lastBucketKey = null;
  let lastGroup = null;
  let sentinel = null;
  let feedObserver = null;

  const appendBatch = () => {
    if (sentinel?.parentNode) sentinel.remove();
    const now = Date.now();
    const end = Math.min(renderedCount + FEED_BATCH, feedFiltered.length);
    for (; renderedCount < end; renderedCount += 1) {
      const item = feedFiltered[renderedCount];
      const bucket = feedDayBucket(item.firstSeenAt, now);
      if (bucket.key !== lastBucketKey) {
        lastBucketKey = bucket.key;
        const head = el("div", "feed-day-head");
        const dayCount = feedFiltered.filter(
          (other) => feedDayBucket(other.firstSeenAt, now).key === bucket.key,
        ).length;
        head.append(el("h3", null, bucket.label));
        head.append(el("span", null, `${dayCount} 条`));
        stream.append(head);
        lastGroup = el("div", "feed-list");
        stream.append(lastGroup);
      }
      lastGroup.append(buildCard(item));
    }
    if (renderedCount < feedFiltered.length) {
      stream.append(sentinel);
    } else if (feedObserver) {
      feedObserver.disconnect();
    }
  };

  const renderStream = () => {
    if (feedObserver) feedObserver.disconnect();
    stream.replaceChildren();
    renderedCount = 0;
    lastBucketKey = null;
    lastGroup = null;
    feedFiltered = items.filter((item) => {
      if (activeSegment === "run-new" && !monitorAlertUrls.has(item.url)) return false;
      if (activeSegment === "recent" && !monitorRecentUrls.has(item.url)) return false;
      if (activeLane !== "all" && item.monitorLabel !== activeLane) return false;
      if (keyOnly && item.priority !== "high" && item.priority !== "critical") return false;
      if (hideProcessed && statusMap[item.url]) return false;
      if (watchOnly && !itemMatchesKeywords(item, watchKeywords)) return false;
      return true;
    });

    if (countLine) {
      const newInView = feedFiltered.filter(isNew).length;
      const processed = items.filter((item) => statusMap[item.url]).length;
      countLine.textContent =
        `当前显示 ${feedFiltered.length} 条` +
        (newInView > 0 ? ` · 其中 ${newInView} 条为新增` : "") +
        (processed > 0 ? ` · 已处理 ${processed} 条` : "");
    }

    if (feedFiltered.length === 0) {
      stream.append(el("p", "empty-state", "没有符合当前筛选的动向，换个赛道或调整上面的筛选试试。"));
      return;
    }

    sentinel = el("div", "feed-sentinel");
    if ("IntersectionObserver" in window) {
      feedObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) appendBatch();
        },
        { rootMargin: "600px 0px" },
      );
    }
    appendBatch();
    if (feedObserver && sentinel.parentNode) feedObserver.observe(sentinel);
  };

  if (controls) {
    controls.replaceChildren();

    // Primary row: compact segment pills + lane dropdown + a disclosure for advanced filters.
    const primaryRow = el("div", "feed-control-row");

    const segmentRow = el("div", "feed-segment-row");
    const segmentDefinitions = [
      ["history", "全部动向", items.length, "全部已发现 URL，按发现时间倒序"],
      ["run-new", "本轮新增", monitorAlertUrls.size, "本次 monitor 新发现的 URL"],
      ["recent", "近窗高相关", monitorRecentUrls.size, `回看 ${monitor?.lookbackDays ?? "—"} 天内的高相关结果`],
    ];
    segmentDefinitions.forEach(([key, label, value, description]) => {
      const btn = el("button", `feed-segment${activeSegment === key ? " selected" : ""}`);
      btn.type = "button";
      btn.title = description;
      btn.append(el("span", "feed-seg-label", label));
      btn.append(el("span", "feed-seg-count", String(value)));
      btn.addEventListener("click", () => {
        activeSegment = key;
        segmentRow.querySelectorAll(".feed-segment").forEach((item) => item.classList.remove("selected"));
        btn.classList.add("selected");
        renderStream();
      });
      segmentRow.append(btn);
    });
    primaryRow.append(segmentRow);

    const laneSelect = el("select", "feed-lane-select");
    laneSelect.setAttribute("aria-label", "按赛道筛选");
    const allOption = el("option", null, "全部赛道");
    allOption.value = "all";
    laneSelect.append(allOption);
    laneOrder.forEach((lane) => {
      const option = el("option", null, lane);
      option.value = lane;
      laneSelect.append(option);
    });
    laneSelect.value = activeLane;
    laneSelect.addEventListener("change", () => {
      activeLane = laneSelect.value;
      renderStream();
    });
    primaryRow.append(laneSelect);

    const advanced = el("div", "feed-advanced");
    advanced.hidden = true;
    const moreToggle = el("button", "filter-button feed-more-toggle", "更多筛选 ▾");
    moreToggle.type = "button";
    moreToggle.setAttribute("aria-expanded", "false");
    moreToggle.addEventListener("click", () => {
      advanced.hidden = !advanced.hidden;
      moreToggle.classList.toggle("selected", !advanced.hidden);
      moreToggle.setAttribute("aria-expanded", String(!advanced.hidden));
      moreToggle.textContent = advanced.hidden ? "更多筛选 ▾" : "更多筛选 ▴";
    });
    primaryRow.append(moreToggle);
    controls.append(primaryRow);

    // Priority legend so the left color bars have meaning.
    const legend = el("div", "feed-legend");
    legend.append(el("span", "section-label", "优先级"));
    [["lg-critical", "关键"], ["lg-high", "重点"], ["lg-medium", "一般"]].forEach(([cls, label]) => {
      const item = el("span", "feed-legend-item");
      item.append(el("span", `feed-legend-dot ${cls}`));
      item.append(document.createTextNode(label));
      legend.append(item);
    });
    controls.append(legend);

    // Advanced (collapsed by default): key-only / hide-processed / mark-read / watch keywords.
    const keyToggle = el("button", "filter-button feed-key-toggle", "只看重点");
    keyToggle.type = "button";
    keyToggle.addEventListener("click", () => {
      keyOnly = !keyOnly;
      keyToggle.classList.toggle("selected", keyOnly);
      renderStream();
    });
    const hideToggle = el("button", "filter-button", "隐藏已处理");
    hideToggle.type = "button";
    hideToggle.addEventListener("click", () => {
      hideProcessed = !hideProcessed;
      hideToggle.classList.toggle("selected", hideProcessed);
      renderStream();
    });
    const markVisited = el("button", "filter-button", "标记本轮已读");
    markVisited.type = "button";
    markVisited.addEventListener("click", () => {
      lastVisitTime = Date.now();
      try {
        window.localStorage.setItem(FEED_LAST_VISIT_KEY, String(lastVisitTime));
      } catch {
        /* localStorage unavailable — feed still works, just without the since-visit highlight */
      }
      renderBanner();
      renderStream();
    });
    const toggleRow = el("div", "feed-control-row");
    toggleRow.append(keyToggle, hideToggle, markVisited);
    advanced.append(toggleRow);

    const watchRow = el("div", "feed-watch-row");
    watchRow.append(el("label", "feed-watch-label", "关注关键词（逗号分隔，如 Timeleft, AI dating）"));
    const inputWrap = el("div", "feed-watch-input");
    const input = el("input");
    input.type = "text";
    input.placeholder = "输入竞品名或关键词，回车保存";
    input.value = watchKeywords.join(", ");
    const watchOnlyToggle = el("button", "filter-button", "只看关注");
    watchOnlyToggle.type = "button";
    const commit = () => {
      watchKeywords = input.value
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean);
      saveWatchKeywords(watchKeywords);
      renderStream();
    };
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commit();
      }
    });
    input.addEventListener("blur", commit);
    watchOnlyToggle.addEventListener("click", () => {
      if (!watchKeywords.length) return;
      watchOnly = !watchOnly;
      watchOnlyToggle.classList.toggle("selected", watchOnly);
      renderStream();
    });
    inputWrap.append(input, watchOnlyToggle);
    watchRow.append(inputWrap);
    advanced.append(watchRow);
    controls.append(advanced);
  }

  renderStream();
}

function renderMonitor(monitor, history, ledger, digest, data) {
  const digestRoot = document.querySelector("#monitor-digest");
  const digestCard = el("article", "digest-card");
  digestCard.append(el("span", "tag", "monitor digest"));
  digestCard.append(el("h3", null, digest.headline));

  const bulletList = el("ul", "digest-list");
  digest.bullets.forEach((item) => bulletList.append(el("li", null, item)));
  digestCard.append(bulletList);

  const actionWrap = el("div", "action-list");
  digest.recommendedActions.forEach((item) => {
    actionWrap.append(el("p", null, item));
  });
  digestCard.append(actionWrap);
  digestRoot.append(digestCard);

  const summary = document.querySelector("#monitor-summary");
  const historyRuns = history.runs ?? [];
  const zeroNewAlertStreakIndex = historyRuns.findIndex((run) => (run.summary?.newAlerts ?? 0) > 0);
  const zeroNewAlertStreak = zeroNewAlertStreakIndex === -1 ? historyRuns.length : zeroNewAlertStreakIndex;
  const stats = [
    [monitor.summary.monitors, "监控主题"],
    [monitor.summary.totalResults, "本次结果"],
    [monitor.summary.recentResults, "近窗内容"],
    [monitor.summary.newAlerts, "新增提醒"],
    [historyRuns.length, "历史运行"],
    [ledger.totalItems ?? ledger.items?.length ?? 0, "提醒台账"],
    [zeroNewAlertStreak, "连续无新增"],
  ];
  stats.forEach(([value, label]) => {
    const card = el("article", "monitor-stat");
    card.append(el("strong", null, String(value)));
    card.append(el("span", null, label));
    summary.append(card);
  });

  const meta = el("article", "monitor-meta");
  meta.append(el("h3", null, "最近一次监控"));
  meta.append(el("p", null, `生成时间：${fmtDate(monitor.generatedAt)} · 回看窗口：${monitor.lookbackDays} 天`));
  meta.append(el("p", null, `自动化：${monitor.automationName} · ${monitor.automationSchedule ?? "Daily 09:00"}`));
  if (monitor.nativeMonitor) {
    const available = monitor.nativeMonitor.status === "available";
    const statusRow = el("p", available ? "native-monitor-status" : "native-monitor-status is-fallback");
    const badge = el("span", available ? "native-badge ok" : "native-badge warn", available ? "可用" : "降级 fallback");
    statusRow.append(badge);
    if (available) {
      statusRow.append(el("span", null, `Exa Websets Monitor 已探测 ${monitor.nativeMonitor.monitors?.length ?? 0} 个 monitor。`));
    } else {
      // Make the long-standing 401 explicit instead of a quiet "unavailable".
      const reason = monitor.nativeMonitor.reason ? `（${monitor.nativeMonitor.reason}）` : "";
      statusRow.append(
        el(
          "span",
          null,
          `Exa Websets Monitor 不可用${reason}——这是预期降级：当前由 Search API + 每日 09:00 Codex 定时刷新兜底，功能不受影响。`,
        ),
      );
    }
    meta.append(statusRow);
    const docs = el("a", null, "Exa Websets Monitor 文档");
    docs.href = monitor.nativeMonitor.docsUrl;
    docs.target = "_blank";
    docs.rel = "noreferrer";
    meta.append(docs);
  }
  summary.append(meta);

  if (data.candidateReview?.alertClosure) {
    const closure = data.candidateReview.alertClosure;
    const closureCard = el("article", "monitor-closure");
    closureCard.append(el("span", "tag", "alert closure"));
    closureCard.append(el("h3", null, closure.status === "closed" ? "新增提醒已闭环" : "新增提醒仍需复核"));
    closureCard.append(
      el(
        "p",
        null,
        `latest alert ${closure.latestAlertReviewRows} 条，待复核 ${closure.latestAlertPendingRows} 条；recent signal ${closure.recentSignalReviewRows} 条，待复核 ${closure.recentSignalPendingRows} 条。`,
      ),
    );
    const latestDecision = data.candidateReview.latestAlertReview?.[0];
    if (latestDecision) {
      closureCard.append(el("p", "monitor-closure-decision", `最近处理：${latestDecision.name} · ${latestDecision.decision}`));
    }
    const link = el("a", null, "打开提醒处理 CSV");
    link.href = "exports/latest-alert-review.csv";
    link.target = "_blank";
    link.rel = "noreferrer";
    closureCard.append(link);
    summary.append(closureCard);
  }

  const historyRoot = document.querySelector("#monitor-history");
  const historyHead = el("div", "monitor-block-head");
  historyHead.append(el("p", "section-label", "history"));
  historyHead.append(el("h3", null, "历史运行趋势"));
  historyRoot.append(historyHead);

  const historyGrid = el("div", "history-grid");
  (history.runs ?? []).slice(0, 6).forEach((run) => {
    const card = el("article", "history-card");
    card.append(el("strong", null, String(run.summary.newAlerts)));
    card.append(el("span", null, `新增提醒 · ${fmtDate(run.generatedAt)}`));
    card.append(el("p", null, `近窗 ${run.summary.recentResults} / 结果 ${run.summary.totalResults}`));
    historyGrid.append(card);
  });
  historyRoot.append(historyGrid);

  const recentRoot = document.querySelector("#monitor-recent");
  const recentHead = el("div", "monitor-block-head");
  recentHead.append(el("p", "section-label", "recent signals"));
  recentHead.append(el("h3", null, "近期高相关信号"));
  recentRoot.append(recentHead);

  // Surface the genuinely new signals first; within each group, most recent published date first.
  const recentItems = (monitor.recentItems ?? [])
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aNew = a.item.isKnown ? 1 : 0;
      const bNew = b.item.isKnown ? 1 : 0;
      if (aNew !== bNew) return aNew - bNew;
      const aTime = new Date(a.item.publishedDate).getTime() || 0;
      const bTime = new Date(b.item.publishedDate).getTime() || 0;
      if (bTime !== aTime) return bTime - aTime;
      return a.index - b.index;
    })
    .map((entry) => entry.item)
    .slice(0, 8);
  if (recentItems.length === 0) {
    recentRoot.append(el("p", "empty-state", "近窗内没有返回高相关结果。"));
  } else {
    const recentGrid = el("div", "recent-grid");
    recentItems.forEach((item) => {
      const isFresh = !item.isKnown;
      const card = el("article", `recent-card priority-${item.priority}${isFresh ? " is-new" : ""}`);
      const status = item.isKnown ? "已知" : "新增";
      const tagRow = el("div", "feed-tag-row");
      tagRow.append(el("span", "tag", `${item.monitorLabel} · ${status}`));
      if (isFresh) tagRow.append(el("span", "badge-new", "NEW"));
      card.append(tagRow);
      appendItemTitle(card, item);
      card.append(el("p", "date-line", fmtDate(item.publishedDate)));
      card.append(el("p", null, localizedHighlight(item, "Exa returned this as a recent relevant item.")));
      if (item.url) {
        const link = el("a", null, "查看证据");
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noreferrer";
        card.append(link);
      }
      recentGrid.append(card);
    });
    recentRoot.append(recentGrid);
  }

  const alerts = document.querySelector("#monitor-alerts");
  const head = el("div", "monitor-block-head");
  head.append(el("p", "section-label", "new alerts"));
  head.append(el("h3", null, "新增提醒"));
  alerts.append(head);

  const alertItems = monitor.alertItems.slice(0, 8);
  if (alertItems.length === 0) {
    alerts.append(el("p", "empty-state", "这次没有发现新的高相关结果。"));
  } else {
    const grid = el("div", "alert-grid");
    alertItems.forEach((item) => {
      const review = data.candidateReview?.latestAlertReview?.find((entry) =>
        (entry.evidence ?? []).some((evidence) => evidence.url === item.url),
      );
      const card = el("article", `alert-card priority-${item.priority}`);
      card.append(el("span", "tag", item.monitorLabel));
      appendItemTitle(card, item);
      card.append(el("p", "date-line", fmtDate(item.publishedDate)));
      if (review) {
        const decision = el("div", "alert-decision");
        decision.append(el("strong", null, review.decision));
        decision.append(el("p", null, review.reason));
        card.append(decision);
      }
      card.append(el("p", null, localizedHighlight(item, "Exa returned this as a relevant recent item.")));
      if (item.url) {
        const link = el("a", null, "查看证据");
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noreferrer";
        card.append(link);
      }
      grid.append(card);
    });
    alerts.append(grid);
  }

  const ledgerRoot = document.querySelector("#monitor-ledger");
  const ledgerHead = el("div", "monitor-block-head");
  ledgerHead.append(el("p", "section-label", "alert ledger"));
  ledgerHead.append(el("h3", null, "提醒台账"));
  ledgerRoot.append(ledgerHead);

  const ledgerItems = (ledger.items ?? []).slice(0, 8);
  if (ledgerItems.length === 0) {
    ledgerRoot.append(el("p", "empty-state", "台账还没有累计新提醒；下一次发现新 URL 会自动保留在这里。"));
  } else {
    const ledgerGrid = el("div", "ledger-grid");
    ledgerItems.forEach((item) => {
      const card = el("article", `ledger-card priority-${item.priority}`);
      card.append(el("span", "tag", item.monitorLabel));
      appendItemTitle(card, item);
      card.append(el("p", "date-line", `首次发现：${fmtDate(item.firstSeenAt)}`));
      card.append(el("p", null, localizedHighlight(item, "Monitor alert retained in ledger.")));
      if (item.url) {
        const link = el("a", null, "查看证据");
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noreferrer";
        card.append(link);
      }
      ledgerGrid.append(card);
    });
    ledgerRoot.append(ledgerGrid);
  }

  const runs = document.querySelector("#monitor-runs");
  const runHead = el("div", "monitor-block-head");
  runHead.append(el("p", "section-label", "monitor lanes"));
  runHead.append(el("h3", null, "主题状态"));
  runs.append(runHead);

  const laneGrid = el("div", "lane-grid");
  monitor.runs.forEach((run) => {
    const card = el("article", "lane-card");
    card.append(el("h4", null, run.label));
    card.append(el("p", null, `优先级：${run.priority} · 结果：${run.items.length} · 近窗：${run.recentCount} · 新提醒：${run.alertCount}`));
    if (run.watchlist?.length) {
      card.append(el("p", "muted", `追踪对象：${run.watchlist.map((item) => item.name).join(" · ")}`));
    }
    card.append(el("code", null, run.requestId || "no request id"));
    laneGrid.append(card);
  });
  runs.append(laneGrid);
}

function renderAlertTriage(triage) {
  const root = document.querySelector("#alert-triage");
  if (!root) return;
  root.replaceChildren();
  if (!triage || !Array.isArray(triage.candidates)) return;

  const head = el("div", "monitor-block-head");
  head.append(el("p", "section-label", "alert triage"));
  head.append(el("h3", null, "监控 → 升级队列（自动评分）"));
  head.append(
    el(
      "p",
      null,
      "每日 monitor 抓到的近窗/新增条目，用证据规则自动打分、与对照表去重，并路由到 brief 对应位置。这是连接动态监测与存量对照的闭环入口。",
    ),
  );
  root.append(head);

  const s = triage.summary ?? {};
  const stats = [
    [s.totalCandidates ?? 0, "候选总数"],
    [s.newUrls ?? 0, "新增 URL"],
    [s.promotionQueueSize ?? 0, "升级队列"],
    [s.alreadyTracked ?? 0, "已在对照表"],
  ];
  const statRow = el("div", "monitor-summary");
  stats.forEach(([value, label]) => {
    const card = el("article", "monitor-stat");
    card.append(el("strong", null, String(value)));
    card.append(el("span", null, label));
    statRow.append(card);
  });
  root.append(statRow);

  const queue = (triage.promotionQueue ?? []).slice(0, 8);
  if (queue.length === 0) {
    root.append(el("p", "empty-state", "本次没有达到 A/B 级的升级候选；其余条目保留为 watchlist。"));
    return;
  }

  const grid = el("div", "recent-grid");
  queue.forEach((c) => {
    const card = el("article", `recent-card priority-${c.lanePriority ?? "medium"}`);
    const newFlag = c.isNewUrl ? " · 🆕新增" : "";
    card.append(el("span", "tag", `${c.grade}·${c.triageScore} · ${c.monitorLabel}${newFlag}`));
    card.append(el("h4", null, c.candidateName));
    card.append(el("p", "date-line", `路由：${c.routeTo}`));
    card.append(el("p", null, `待补证据：${c.missingEvidence}`));
    card.append(el("p", null, c.suggestedAction));
    if (c.url) {
      const link = el("a", null, "查看证据");
      link.href = c.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      card.append(link);
    }
    grid.append(card);
  });
  root.append(grid);
}

function renderClusters(data) {
  const root = document.querySelector("#cluster-stack");
  data.clusters.forEach((cluster) => {
    const section = el("article", "cluster");
    const head = el("div", "cluster-head");
    head.append(el("p", "section-label", cluster.exaCategory));
    head.append(el("h3", null, cluster.title));
    head.append(el("p", null, cluster.takeaway));
    section.append(head);

    const grid = el("div", "evidence-grid");
    if (cluster.id === "language" && data.languageSimilarityAudit) {
      const audit = el("article", "evidence-card language-similarity-card");
      audit.append(el("span", "tag", "similarity audit"));
      audit.append(el("h4", null, "HelloTalk / Tandem 相似度审计"));
      audit.append(
        el(
          "p",
          "signal",
          `${data.languageSimilarityAudit.totalRows} 个相邻条目：高度相似 ${data.languageSimilarityAudit.highlySimilar} 个，相邻变体 ${data.languageSimilarityAudit.adjacentVariants} 个，边界 ${data.languageSimilarityAudit.boundaryRows} 个。`,
        ),
      );
      const stats = el("div", "proof-list");
      data.languageSimilarityAudit.bySimilarity.forEach((item) => {
        stats.append(el("span", null, `${item.similarity}: ${item.count}`));
      });
      audit.append(stats);
      const link = el("a", null, "下载语言相似度审计 CSV");
      link.href = "exports/language-similarity-audit.csv";
      link.target = "_blank";
      link.rel = "noreferrer";
      audit.append(link);
      grid.append(audit);
    }
    if (cluster.id === "language" && data.languageOfficialEvidenceMap) {
      const evidenceMap = el("article", "evidence-card language-evidence-map-card");
      evidenceMap.append(el("span", "tag", "official evidence map"));
      evidenceMap.append(el("h4", null, "语言交换官网 / 商店 / 社媒证据地图"));
      evidenceMap.append(
        el(
          "p",
          "signal",
          `${data.languageOfficialEvidenceMap.totalRows} 个主表语言产品：ready ${data.languageOfficialEvidenceMap.readyRows} 个，displayable ${data.languageOfficialEvidenceMap.displayableRows} 个，thin ${data.languageOfficialEvidenceMap.thinRows} 个。`,
        ),
      );
      const stats = el("div", "proof-list");
      stats.append(el("span", null, `商店覆盖 ${data.languageOfficialEvidenceMap.withStoreRows}`));
      stats.append(el("span", null, `LinkedIn ${data.languageOfficialEvidenceMap.withLinkedInRows}`));
      stats.append(el("span", null, `社媒/社区 ${data.languageOfficialEvidenceMap.withSocialCommunityRows}`));
      evidenceMap.append(stats);
      const link = el("a", null, "下载语言官方证据地图 CSV");
      link.href = "exports/language-official-evidence-map.csv";
      link.target = "_blank";
      link.rel = "noreferrer";
      evidenceMap.append(link);
      grid.append(evidenceMap);
    }
    if (cluster.id === "language" && data.languageGrowthChannelDeepDive) {
      const growthDive = el("article", "evidence-card language-similarity-card");
      growthDive.append(el("span", "tag", "targeted Exa pass"));
      growthDive.append(el("h4", null, "语言增长 / 渠道深挖"));
      growthDive.append(
        el(
          "p",
          "signal",
          `${data.languageGrowthChannelDeepDive.searches} 组 targeted 查询、${data.languageGrowthChannelDeepDive.resultRows} 条结果；strong ${data.languageGrowthChannelDeepDive.strongRows} 个，usable ${data.languageGrowthChannelDeepDive.usableRows} 个，thin ${data.languageGrowthChannelDeepDive.thinRows} 个。`,
        ),
      );
      const tags = el("div", "proof-list");
      (data.languageGrowthChannelDeepDive.byChannelTag ?? []).slice(0, 5).forEach((item) => {
        tags.append(el("span", null, `${item.tag}: ${item.count}`));
      });
      growthDive.append(tags);
      const link = el("a", null, "下载语言增长/渠道深挖 CSV");
      link.href = "exports/language-growth-channel-deep-dive.csv";
      link.target = "_blank";
      link.rel = "noreferrer";
      growthDive.append(link);
      grid.append(growthDive);
    }
    if (cluster.id === "language" && data.languageCoverageAudit) {
      const boundaryRows = data.languageCoverageAudit.rows.filter((item) => item.status !== "core" && item.status !== "covered-core");
      if (boundaryRows.length) {
        const longTail = el("article", "evidence-card language-similarity-card");
        longTail.append(el("span", "tag", "long-tail audit"));
        longTail.append(el("h4", null, "语言交换长尾 / 边界样本"));
        longTail.append(
          el(
            "p",
            "signal",
            `${boundaryRows.length} 个非主表条目已留档；watchlist ${data.languageCoverageAudit.watchlistCount} 个，边界 ${data.languageCoverageAudit.boundaryCount} 个。`,
          ),
        );
        boundaryRows.slice(0, 5).forEach((item) => {
          const row = el("div", "mini-proof");
          row.append(el("strong", null, item.name));
          row.append(el("span", null, `${item.status} · ${item.decision}`));
          longTail.append(row);
        });
        const link = el("a", null, "下载语言覆盖审计 CSV");
        link.href = "exports/language-coverage-audit.csv";
        link.target = "_blank";
        link.rel = "noreferrer";
        longTail.append(link);
        grid.append(longTail);
      }
    }
    cluster.items.forEach((item, index) => {
      const card = el("article", `evidence-card ${accentClasses[index % accentClasses.length]}`);
      const top = el("div", "card-top");
      top.append(el("span", "tag", `IRL: ${item.irl}`));
      top.append(el("h4", null, item.name));
      card.append(top);
      card.append(el("p", "signal", item.signal));
      card.append(el("p", null, `功能差异：${item.differentiator}`));
      card.append(el("p", null, `渠道信号：${item.channel}`));
      card.append(linkList(item.evidence));
      grid.append(card);
    });

    section.append(grid);
    root.append(section);
  });
}

function renderFunding(data) {
  const root = document.querySelector("#funding-timeline");
  const summaryRoot = document.querySelector("#funding-summary");
  const controls = document.querySelector("#timeline-controls");
  const count = document.querySelector("#timeline-count");
  const searchInput = document.querySelector("#timeline-search-input");
  const clearSearch = document.querySelector("#timeline-search-clear");
  const exportCsv = document.querySelector("#timeline-export-csv");
  const summary = data.fundingSummary;
  const cards = [];

  const statGrid = el("div", "funding-stat-grid");
  [
    [summary.totalEvents, "融资/新闻事件"],
    [summary.supplementalEvents ?? 0, "补充候选事件"],
    [summary.irlEvents, "IRL 相关事件"],
    [summary.irlShare, "IRL 占比"],
    [`$${summary.explicitUsdFundingM}M`, "明确美元融资"],
  ].forEach(([value, label]) => {
    const card = el("article", "funding-stat");
    card.append(el("strong", null, String(value)));
    card.append(el("span", null, label));
    statGrid.append(card);
  });
  summaryRoot.append(statGrid);

  const breakdown = el("div", "funding-breakdown");
  const yearCard = el("article", "funding-breakdown-card");
  yearCard.append(el("h3", null, "按年份"));
  summary.byYear.forEach((item) => yearCard.append(el("p", null, `${item.year}: ${item.count} 条`)));
  breakdown.append(yearCard);

  const laneCard = el("article", "funding-breakdown-card");
  laneCard.append(el("h3", null, "按赛道"));
  summary.byLane.forEach((item) => laneCard.append(el("p", null, `${item.lane}: ${item.count} 条`)));
  breakdown.append(laneCard);

  const topCard = el("article", "funding-breakdown-card");
  topCard.append(el("h3", null, "最大美元融资"));
  summary.topUsdRounds.slice(0, 4).forEach((item) => {
    const link = el("a", null, `${item.name}: ${item.label}`);
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    topCard.append(link);
  });
  breakdown.append(topCard);

  const reviewCard = el("article", "funding-breakdown-card");
  reviewCard.append(el("h3", null, "总复核口径"));
  reviewCard.append(
    el(
      "p",
      null,
      `${summary.combinedEvents} 条合并复核 = ${summary.totalEvents} 条主时间线 + ${summary.supplementalEvents ?? 0} 条补充候选；去重后 ${summary.uniqueCombinedEvents} 条唯一事件，${summary.duplicateCombinedEvents} 条重复行。`,
    ),
  );
  if (data.fundingIntegritySummary) {
    const integrity = data.fundingIntegritySummary;
    const integrityStats = el("div", "proof-list");
    integrityStats.append(el("span", null, integrity.status));
    integrityStats.append(el("span", null, `窗口外 ${integrity.outOfWindowRows}`));
    integrityStats.append(el("span", null, `唯一 ${integrity.uniqueRows}`));
    integrityStats.append(el("span", null, `重复 ${integrity.duplicateRows}`));
    integrityStats.append(el("span", null, `IRL ${integrity.irlUniqueRows}`));
    integrityStats.append(el("span", null, `产品聚合 ${integrity.productRollupRows}`));
    reviewCard.append(integrityStats);
    reviewCard.append(el("p", "muted", integrity.claim));
  }
  const reviewLink = el("a", null, "下载融资/新闻总复核 CSV");
  reviewLink.href = "exports/funding-news-review.csv";
  reviewLink.target = "_blank";
  reviewLink.rel = "noreferrer";
  reviewCard.append(reviewLink);
  const dedupLink = el("a", null, "下载去重审计 CSV");
  dedupLink.href = "exports/funding-news-dedup-audit.csv";
  dedupLink.target = "_blank";
  dedupLink.rel = "noreferrer";
  reviewCard.append(dedupLink);
  if (data.fundingEventAudit) {
    const eventAuditLink = el("a", null, "下载事件级审计 CSV");
    eventAuditLink.href = "exports/funding-event-audit.csv";
    eventAuditLink.target = "_blank";
    eventAuditLink.rel = "noreferrer";
    reviewCard.append(eventAuditLink);
    reviewCard.append(
      el(
        "p",
        null,
        `事件级审计 ${data.fundingEventAudit.totalRows} 行，唯一计入 ${data.fundingEventAudit.uniqueRows} 行，IRL/线下真人相关 ${data.fundingEventAudit.irlRows} 行，明确美元融资 ${data.fundingEventAudit.explicitUsdRows} 行。`,
      ),
    );
  }
  if (data.fundingUpgradeMap) {
    const upgradeLink = el("a", null, "下载补充候选升级映射 CSV");
    upgradeLink.href = "exports/funding-upgrade-map.csv";
    upgradeLink.target = "_blank";
    upgradeLink.rel = "noreferrer";
    reviewCard.append(upgradeLink);
    reviewCard.append(
      el(
        "p",
        null,
        `补充候选升级映射 ${data.fundingUpgradeMap.totalRows} 行：保留候选 ${data.fundingUpgradeMap.retainedCandidates} 行，重复佐证 ${data.fundingUpgradeMap.duplicateEvidenceRows} 行，IRL 候选 ${data.fundingUpgradeMap.irlCandidateRows} 行。`,
      ),
    );
    const statusList = el("div", "proof-list");
    data.fundingUpgradeMap.byStatus.forEach((item) => {
      statusList.append(el("span", null, `${item.status}: ${item.count}`));
    });
    reviewCard.append(statusList);
  }
  breakdown.append(reviewCard);

  if (data.fundingProductRollup) {
    const rollupCard = el("article", "funding-breakdown-card");
    rollupCard.append(el("h3", null, "按产品聚合"));
    rollupCard.append(
      el(
        "p",
        null,
        `${data.fundingProductRollup.totalProducts} 个产品/公司有近两年融资或新闻事件，其中 IRL/线下真人相关 ${data.fundingProductRollup.irlProducts} 个，明确美元融资产品 ${data.fundingProductRollup.productsWithExplicitUsd} 个，合计 $${data.fundingProductRollup.explicitUsdFundingM}M。`,
      ),
    );
    data.fundingProductRollup.topProducts.slice(0, 5).forEach((item) => {
      rollupCard.append(
        el(
          "p",
          null,
          `${item.name}: ${item.eventCount} 条事件${item.explicitUsdM ? ` · $${item.explicitUsdM}M` : ""}${item.irlRelated ? " · IRL" : ""}`,
        ),
      );
    });
    const rollupLink = el("a", null, "下载按产品聚合 CSV");
    rollupLink.href = "exports/funding-product-rollup.csv";
    rollupLink.target = "_blank";
    rollupLink.rel = "noreferrer";
    rollupCard.append(rollupLink);
    breakdown.append(rollupCard);
  }

  if (summary.dateWindowAudit) {
    const dateCard = el("article", "funding-breakdown-card");
    dateCard.append(el("h3", null, "近两年窗口"));
    dateCard.append(
      el(
        "p",
        null,
        `${summary.dateWindowAudit.exactWindowStart ?? summary.dateWindowAudit.windowStart} - ${summary.dateWindowAudit.exactWindowEnd ?? summary.dateWindowAudit.windowEnd}: 月份归档 ${summary.dateWindowAudit.windowStart} - ${summary.dateWindowAudit.windowEnd}，主时间线 ${summary.dateWindowAudit.main.inWindow}/${summary.dateWindowAudit.main.total} 条在窗内，补充候选 ${summary.dateWindowAudit.supplemental.inWindow}/${summary.dateWindowAudit.supplemental.total} 条在窗内。`,
      ),
    );
    if (summary.dateWindowAudit.precisionNote) {
      dateCard.append(el("p", "muted", summary.dateWindowAudit.precisionNote));
    }
    dateCard.append(
      el(
        "p",
        null,
        summary.dateWindowAudit.outOfWindowTotal
          ? `${summary.dateWindowAudit.outOfWindowTotal} 条需要移出或复核。`
          : "当前无窗口外事件；年份级日期单独保留为低精度标记。",
      ),
    );
    breakdown.append(dateCard);
  }

  const note = el("p", "funding-caveat", summary.caveat);
  summaryRoot.append(breakdown, note);

  if (data.discoveryScan?.supplementalFundingNews?.length) {
    const supplemental = el("div", "funding-breakdown-card supplemental-events");
    supplemental.append(el("h3", null, "补充融资/新闻候选"));
    data.discoveryScan.supplementalFundingNews.forEach((item) => {
      const link = el("a", null, `${item.date} · ${item.name}: ${item.amount}`);
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      supplemental.append(link);
    });
    summaryRoot.append(supplemental);
  }

  if (data.discoveryScan?.fundingCandidateReview?.length) {
    const candidateCard = el("div", "funding-breakdown-card funding-candidate-events");
    candidateCard.append(el("h3", null, "融资新闻盲区候选"));
    candidateCard.append(
      el(
        "p",
        null,
        `${data.discoveryScan.fundingCandidateRows} 条 discovery 融资/规模信号，其中 ${data.discoveryScan.fundingCandidatePendingRows} 条仍待复核是否升级。`,
      ),
    );
    const candidateLink = el("a", null, "下载融资盲区候选 CSV");
    candidateLink.href = "exports/funding-discovery-candidates.csv";
    candidateLink.target = "_blank";
    candidateLink.rel = "noreferrer";
    candidateCard.append(candidateLink);
    data.discoveryScan.fundingCandidateReview.slice(0, 5).forEach((item) => {
      const link = el("a", null, `${item.handlingStatus} · ${item.candidateName}: ${item.amountMention}`);
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      candidateCard.append(link);
    });
    summaryRoot.append(candidateCard);
  }

  data.fundingTimeline.forEach((item) => {
    const card = el("article", item.lane.includes("IRL") ? "event irl-event" : "event");
    card.dataset.lane = item.lane;
    card.dataset.searchText = `${item.date} ${item.name} ${item.amount} ${item.lane} ${item.url}`.toLowerCase();
    card.record = item;
    card.append(el("time", null, item.date));
    card.append(el("h3", null, item.name));
    card.append(el("p", "amount", item.amount));
    card.append(el("p", null, item.lane));
    const link = el("a", null, "Exa 证据");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    card.append(link);
    root.append(card);
    cards.push(card);
  });

  const timelineEmpty = el("p", "empty-state", "");
  timelineEmpty.hidden = true;
  root.append(timelineEmpty);

  const filters = [
    ["all", "全部"],
    ["ai-social", "AI 社交/泛娱乐"],
    ["companion", "AI 伴侣/角色"],
    ["irl", "IRL / 线下真人"],
    ["china", "中国出海"],
  ];

  function matchesTimelineFilter(card, filter) {
    const lane = card.dataset.lane.toLowerCase();
    if (filter === "all") return true;
    if (filter === "ai-social") return /ai social|entertainment|messaging|cross-cultural/.test(lane);
    if (filter === "companion") return /companion|roleplay|character/.test(lane);
    if (filter === "irl") return /irl/.test(lane);
    if (filter === "china") return /china/.test(lane);
    // Unknown filter → match nothing, so a typo surfaces instead of silently showing everything.
    return false;
  }

  function applyTimelineFilter(filter = "all") {
    const raw = searchInput.value.trim().toLowerCase();
    const isTooShort = tooShortQuery(raw);
    const query = isTooShort ? "" : raw;
    let visible = 0;
    cards.forEach((card) => {
      const isVisible = matchesTimelineFilter(card, filter) && (!query || card.dataset.searchText.includes(query));
      card.hidden = !isVisible;
      if (isVisible) visible += 1;
    });

    controls.querySelectorAll("button").forEach((button) => {
      const selected = button.dataset.filter === filter;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    controls.dataset.currentFilter = filter;
    if (isTooShort) {
      count.textContent = "搜索关键词太短，请至少输入 2 个字符（中文 1 个字也可）。";
    } else {
      count.textContent = query
        ? `当前显示 ${visible} / ${cards.length} 条融资/新闻 · 搜索：“${searchInput.value.trim()}”`
        : `当前显示 ${visible} / ${cards.length} 条融资/新闻`;
    }

    if (visible === 0) {
      timelineEmpty.textContent = query
        ? `没有匹配“${searchInput.value.trim()}”的融资/新闻，换个关键词或切换赛道筛选。`
        : "当前筛选下没有融资/新闻条目。";
    }
    timelineEmpty.hidden = visible !== 0;
  }

  filters.forEach(([filter, label]) => {
    const button = el("button", "filter-button", label);
    button.type = "button";
    button.dataset.filter = filter;
    button.setAttribute("aria-label", `筛选时间线：${label}`);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => applyTimelineFilter(filter));
    controls.append(button);
  });

  searchInput.addEventListener("input", debounce(() => applyTimelineFilter(controls.dataset.currentFilter ?? "all")));
  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.focus();
    applyTimelineFilter(controls.dataset.currentFilter ?? "all");
  });

  exportCsv.addEventListener("click", () => {
    const headers = ["日期", "产品/公司", "金额/事件", "赛道", "证据"];
    const visibleRecords = cards.filter((card) => !card.hidden).map((card) => card.record);
    const values = visibleRecords.map((record) => [record.date, record.name, record.amount, record.lane, record.url]);
    const csv = [headers, ...values]
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `exa-ai-social-funding-${controls.dataset.currentFilter ?? "all"}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`已导出 ${visibleRecords.length} 行融资/新闻到 CSV`);
  });

  applyTimelineFilter("all");
}

function renderIrl(data) {
  const root = document.querySelector("#irl-showcase");
  const cluster = data.clusters.find((item) => item.id === "irl");
  if (data.irlCoverageAudit) {
    const summary = el("article", "irl-card lead-irl");
    summary.append(el("span", "tag", "IRL coverage audit"));
    summary.append(el("h3", null, `${data.irlCoverageAudit.totalUnique} 个线下真人/IRL 相邻条目`));
    summary.append(
      el(
        "p",
        null,
        `核心 ${data.irlCoverageAudit.coreCount} 个，边界 ${data.irlCoverageAudit.boundaryCount} 个，融资/新闻覆盖 ${data.irlCoverageAudit.fundingNewsCount} 个，monitor 近窗覆盖 ${data.irlCoverageAudit.monitorCount} 个。`,
      ),
    );
    const link = el("a", null, "下载 IRL 覆盖审计 CSV");
    link.href = "exports/irl-coverage-audit.csv";
    link.target = "_blank";
    link.rel = "noreferrer";
    summary.append(link);
    root.append(summary);
  }
  if (data.irlOfflineEvidenceMap) {
    const mapCard = el("article", "irl-card lead-irl");
    mapCard.append(el("span", "tag", "offline evidence map"));
    mapCard.append(el("h3", null, "线下真人证据地图"));
    mapCard.append(
      el(
        "p",
        null,
        `${data.irlOfflineEvidenceMap.totalRows} 个条目按线下模式分层：融资/新闻链接 ${data.irlOfflineEvidenceMap.fundingLinkedRows} 个，monitor 近窗链接 ${data.irlOfflineEvidenceMap.monitorLinkedRows} 个，强证据 ${data.irlOfflineEvidenceMap.strongRows} 个。`,
      ),
    );
    const modeList = el("div", "proof-list");
    data.irlOfflineEvidenceMap.byMode.forEach((item) => {
      modeList.append(el("span", null, `${item.mode}: ${item.count}`));
    });
    mapCard.append(modeList);
    const link = el("a", null, "下载线下真人证据地图 CSV");
    link.href = "exports/irl-offline-evidence-map.csv";
    link.target = "_blank";
    link.rel = "noreferrer";
    mapCard.append(link);
    root.append(mapCard);
  }
  cluster.items.forEach((item, index) => {
    const card = el("article", index === 0 && !data.irlCoverageAudit && !data.irlOfflineEvidenceMap ? "irl-card lead-irl" : "irl-card");
    card.append(el("span", "tag", item.name));
    card.append(el("h3", null, item.differentiator));
    card.append(el("p", null, item.signal));
    card.append(el("p", null, item.channel));
    card.append(linkList(item.evidence));
    root.append(card);
  });
}

function renderPeople(data) {
  const backgroundRoot = document.querySelector("#company-background-review");
  if (backgroundRoot && data.companyBackgroundReview) {
    const summary = el("article", "company-background-card company-background-summary");
    summary.append(el("h3", null, "公司背景复核口径"));
    summary.append(
      el(
        "p",
        null,
        `${data.companyBackgroundReview.totalSignals} 条 people / company / financial report 信号，其中 ${data.companyBackgroundReview.linkedSignals} 条明确链接到主表产品。`,
      ),
    );
    summary.append(el("p", null, data.companyBackgroundReview.method));
    backgroundRoot.append(summary);

    if (data.companyBackgroundCoverageAudit) {
      const coverage = el("article", "company-background-card company-background-summary");
      coverage.append(el("h3", null, "产品级公司背景覆盖"));
      coverage.append(el("p", null, data.companyBackgroundCoverageAudit.method));
      const stats = el("div", "proof-list");
      data.companyBackgroundCoverageAudit.summary.forEach((item) => {
        stats.append(el("span", null, `${item.status}: ${item.count}`));
      });
      coverage.append(stats);
      const link = el("a", null, "下载公司背景覆盖审计 CSV");
      link.href = "exports/company-background-coverage-audit.csv";
      link.target = "_blank";
      link.rel = "noreferrer";
      coverage.append(link);
      backgroundRoot.append(coverage);
    }

    data.companyBackgroundReview.rows.slice(0, 10).forEach((item) => {
      const card = el("article", "company-background-card");
      card.append(el("span", "tag", item.sourceCategory));
      card.append(el("h3", null, item.subject));
      card.append(el("p", "signal", item.linkedProducts.length ? `关联产品：${item.linkedProducts.join(" / ")}` : item.lane));
      card.append(el("p", null, item.dimension));
      card.append(el("p", null, item.interpretation));
      card.append(linkList(item.evidence));
      backgroundRoot.append(card);
    });
  }

  const root = document.querySelector("#people-signals");
  (data.peopleSignals ?? []).forEach((item) => {
    const card = el("article", "people-card");
    card.append(el("span", "tag", item.role));
    card.append(el("h3", null, item.name));
    card.append(el("p", "signal", item.signal));
    card.append(el("p", null, item.whyItMatters));
    card.append(linkList(item.evidence));
    root.append(card);
  });
}

function renderFinancial(data) {
  const root = document.querySelector("#financial-signals");
  (data.financialSignals ?? []).forEach((item) => {
    const card = el("article", "financial-card");
    card.append(el("span", "tag", item.metric));
    card.append(el("h3", null, item.name));
    card.append(el("p", "signal", item.signal));
    card.append(el("p", null, item.interpretation));
    card.append(linkList(item.evidence));
    root.append(card);
  });
}

function renderMarketDecisionMap(data) {
  const summaryRoot = document.querySelector("#decision-summary");
  const root = document.querySelector("#market-decision-map");
  if (!summaryRoot || !root || !data.marketDecisionEvidenceMap) return;

  [
    [data.marketDecisionEvidenceMap.totalRows, "判断映射"],
    [data.marketDecisionEvidenceMap.researchRows, "research paper"],
    [data.marketDecisionEvidenceMap.financialRows, "financial report"],
  ].forEach(([value, label]) => {
    const card = el("article", "decision-stat");
    card.append(el("strong", null, String(value)));
    card.append(el("span", null, label));
    summaryRoot.append(card);
  });

  const exportCard = el("article", "decision-stat decision-export");
  exportCard.append(el("strong", null, "CSV"));
  exportCard.append(el("span", null, "决策证据映射"));
  const exportLink = el("a", null, "下载 market decision CSV");
  exportLink.href = "exports/market-decision-evidence-map.csv";
  exportLink.target = "_blank";
  exportLink.rel = "noreferrer";
  exportCard.append(exportLink);
  summaryRoot.append(exportCard);

  data.marketDecisionEvidenceMap.rows.forEach((item) => {
    const card = el("article", "decision-card");
    card.append(el("span", "tag", item.sourceCategory));
    card.append(el("h3", null, item.signalName));
    card.append(el("p", "signal", item.decisionArea));
    card.append(el("p", null, item.judgment));
    card.append(el("p", "muted-line", item.businessImpact));
    const meta = el("div", "proof-list");
    meta.append(el("span", null, item.evidenceStrength));
    meta.append(el("span", null, item.linkedProducts.length ? `关联：${item.linkedProducts.join(" / ")}` : "市场级背景"));
    card.append(meta);
    card.append(el("p", null, item.nextAction));
    card.append(linkList(item.evidence));
    root.append(card);
  });
}

function renderOfficialEvidence(data) {
  const summaryRoot = document.querySelector("#official-summary");
  const evidenceRoot = document.querySelector("#official-evidence");
  const summary = data.officialSocialEvidence.summary;
  const coverage = data.officialSocialCoverageAudit;

  [
    [summary.searches, "Exa profile 查询"],
    [summary.results, "profile 原始结果"],
    [summary.officialOrStoreLinks, "官网/应用商店"],
    [summary.linkedinLinks + summary.socialOrCommunityLinks, "社媒/社区证据"],
  ].forEach(([value, label]) => {
    const card = el("article", "official-stat");
    card.append(el("strong", null, String(value)));
    card.append(el("span", null, label));
    summaryRoot.append(card);
  });

  if (coverage) {
    const auditCard = el("article", "official-card official-audit-card");
    auditCard.append(el("h3", null, "官方 / 社媒覆盖审计"));
    auditCard.append(
      el(
        "p",
        null,
        `${coverage.totalProducts} 个产品中，${coverage.summary.complete} 个证据类型较完整，${coverage.summary.displayable} 个可展示但待补，${coverage.summary.needsOfficial} 个需补官方证据。`,
      ),
    );
    const stats = el("div", "proof-list");
    [
      `官网 ${coverage.summary.withOfficialWeb}`,
      `商店 ${coverage.summary.withStore}`,
      `LinkedIn ${coverage.summary.withLinkedIn}`,
      `社区/社媒 ${coverage.summary.withSocialCommunity}`,
    ].forEach((text) => stats.append(el("span", null, text)));
    auditCard.append(stats);
    const link = el("a", null, "下载官方/社媒覆盖审计 CSV");
    link.href = "exports/official-social-coverage-audit.csv";
    link.target = "_blank";
    link.rel = "noreferrer";
    auditCard.append(link);
    coverage.gapRows.slice(0, 5).forEach((item) => {
      const block = el("div", "official-item");
      block.append(el("span", "tag", item.status));
      block.append(el("h4", null, item.name));
      block.append(el("p", null, item.nextCheck));
      auditCard.append(block);
    });
    evidenceRoot.append(auditCard);
  }

  data.officialSocialEvidence.groups.forEach((group) => {
    const card = el("article", "official-card");
    card.append(el("h3", null, group.title));
    group.items.forEach((item) => {
      const block = el("div", "official-item");
      block.append(el("span", "tag", item.type));
      block.append(el("h4", null, item.name));
      block.append(linkList(item.evidence));
      card.append(block);
    });
    evidenceRoot.append(card);
  });
}

function renderResearch(data) {
  const root = document.querySelector("#research-signals");
  data.researchSignals.forEach((item) => {
    const card = el("article", null);
    card.append(el("h3", null, item.title));
    card.append(el("p", null, item.body));
    const link = el("a", null, "论文证据");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    card.append(link);
    root.append(card);
  });
}

function renderCoverageAudit(data) {
  const scoringRoot = document.querySelector("#evidence-scoring");
  if (scoringRoot && data.evidenceScoring) {
    const methodCard = el("article", "scoring-card");
    methodCard.append(el("h3", null, "证据评分方法"));
    const methodList = el("ul", null);
    data.evidenceScoring.method.forEach((text) => methodList.append(el("li", null, text)));
    methodCard.append(methodList);
    scoringRoot.append(methodCard);

    const gradeCard = el("article", "scoring-card");
    gradeCard.append(el("h3", null, "A/B/C/D 解释"));
    Object.entries(data.evidenceScoring.grades).forEach(([grade, text]) => {
      const row = el("p", "grade-row");
      row.append(el("span", `score-cell score-${grade.toLowerCase()}`, grade));
      row.append(el("span", null, text));
      gradeCard.append(row);
    });
    scoringRoot.append(gradeCard);

    const countCard = el("article", "scoring-card");
    countCard.append(el("h3", null, "当前分布"));
    Object.entries(data.evidenceScoring.counts).forEach(([grade, count]) => {
      const row = el("p", "grade-row");
      row.append(el("span", `score-cell score-${grade.toLowerCase()}`, grade));
      row.append(el("span", null, `${count} 个产品/公司`));
      countCard.append(row);
    });
    scoringRoot.append(countCard);
  }

  const root = document.querySelector("#coverage-audit");
  [
    ["coreCovered", "核心已覆盖"],
    ["watchlist", "监控/边界"],
    ["method", "方法口径"],
  ].forEach(([key, title]) => {
    const card = el("article", "audit-card");
    card.append(el("h3", null, title));
    const list = el("ul", null);
    data.coverageAudit[key].forEach((text) => {
      const item = el("li", null, text);
      list.append(item);
    });
    card.append(list);
    root.append(card);
  });

  if (data.sourceLinkageAudit) {
    const linkage = data.sourceLinkageAudit;
    const card = el("article", "audit-card source-linkage-card");
    card.append(el("h3", null, "原始来源关联审计"));
    card.append(
      el(
        "p",
        null,
        `${linkage.totalResults} 条 Exa 原始结果中，${linkage.linkedResults} 条已关联主表/时间线/官方证据，${linkage.unlinkedResults} 条进入复核队列，关联率 ${linkage.linkedShare}。`,
      ),
    );
    const layerList = el("ul", null);
    linkage.byLayer.forEach((item) => {
      layerList.append(el("li", null, `${item.sourceLayer}: ${item.linked}/${item.total} 已关联，${item.unlinked} 待复核`));
    });
    card.append(layerList);
    const bucketList = el("ul", null);
    (linkage.reviewBuckets ?? []).forEach((item) => {
      bucketList.append(el("li", null, `${item.decision}: ${item.count} 条`));
    });
    card.append(bucketList);
    const link = el("a", null, "下载原始来源关联审计 CSV");
    link.href = "exports/source-linkage-audit.csv";
    link.target = "_blank";
    link.rel = "noreferrer";
    card.append(link);
  if (data.coverageGapRegister?.groups?.length) {
      const gapSummary = el("div", "gap-register");
      gapSummary.append(
        el(
          "p",
          "signal",
          `Coverage gap register: ${data.coverageGapRegister.totalGaps} 条复核缺口，${data.coverageGapRegister.highPriorityGaps} 条高优先级候选，${data.coverageGapRegister.deepDiveReviewedGaps ?? 0} 个候选已完成 deep-dive 回填。`,
        ),
      );
      const gapLink = el("a", null, "下载覆盖缺口 Register CSV");
      gapLink.href = "exports/coverage-gap-register.csv";
      gapLink.target = "_blank";
      gapLink.rel = "noreferrer";
      gapSummary.append(gapLink);
      data.coverageGapRegister.groups.slice(0, 4).forEach((item) => {
        const row = el("div", "review-item");
        row.append(el("span", "tag", item.priority));
        row.append(el("h4", null, `${item.reviewDecision} · ${item.queryId}`));
        row.append(el("p", null, `${item.count} 条：${item.nextAction}`));
        if (item.reviewed?.length) {
          row.append(el("small", null, `已深挖：${item.reviewed.map((review) => `${review.name} / ${review.decision}`).join("，")}`));
        }
        gapSummary.append(row);
      });
      card.append(gapSummary);
    }
    (linkage.topUnlinkedReview ?? []).slice(0, 5).forEach((item) => {
      const block = el("div", "review-item");
      block.append(el("span", "tag", item.sourceLayer));
      const title = el("a", null, item.title);
      title.href = item.url;
      title.target = "_blank";
      title.rel = "noreferrer";
      block.append(title);
      block.append(el("p", null, `${item.reviewDecision}: ${item.reviewReason}`));
      card.append(block);
    });
    root.append(card);
  }

  if (data.residualSignalReview?.rows?.length) {
    const card = el("article", "audit-card source-linkage-card");
    card.append(el("h3", null, "Residual signal deep-dive"));
    card.append(
      el(
        "p",
        null,
        `${data.residualSignalReview.totalRows} 条 residual signal 已复核：monitor watchlist ${data.residualSignalReview.monitorWatchlistRows} 条，重复/已覆盖 ${data.residualSignalReview.duplicateOrCoveredRows} 条，边界/排除/背景 ${data.residualSignalReview.boundaryRows} 条。`,
      ),
    );
    const link = el("a", null, "下载 residual signal review CSV");
    link.href = "exports/residual-signal-review.csv";
    link.target = "_blank";
    link.rel = "noreferrer";
    card.append(link);
    data.residualSignalReview.rows.forEach((item) => {
      const row = el("div", "review-item");
      row.append(el("span", "tag", item.decision));
      row.append(el("h4", null, item.name));
      row.append(el("p", "signal", item.lane));
      row.append(el("p", null, item.reason));
      const evidence = el("a", null, item.title);
      evidence.href = item.url;
      evidence.target = "_blank";
      evidence.rel = "noreferrer";
      row.append(evidence);
      card.append(row);
    });
    root.append(card);
  }

  if (data.candidatePromotionQueue) {
    const card = el("article", "audit-card source-linkage-card");
    card.append(el("h3", null, "候选升级队列"));
    card.append(
      el(
        "p",
        null,
        `${data.candidatePromotionQueue.totalRows} 个剩余候选已统一排队：语言 watchlist ${data.candidatePromotionQueue.languageRows} 个，融资/新闻待复核 ${data.candidatePromotionQueue.fundingRows} 个，高优先级 ${data.candidatePromotionQueue.highPriorityRows} 个。已分流：市场判断 ${data.candidatePromotionQueue.resolvedMarketRows ?? 0} 个，低可信市场留档 ${data.candidatePromotionQueue.lowConfidenceMarketRows ?? 0} 个，重复佐证 ${data.candidatePromotionQueue.duplicateFundingRows ?? 0} 个。`,
      ),
    );
    const queueLink = el("a", null, "下载候选升级队列 CSV");
    queueLink.href = "exports/candidate-promotion-queue.csv";
    queueLink.target = "_blank";
    queueLink.rel = "noreferrer";
    card.append(queueLink);
    if (!data.candidatePromotionQueue.rows.length) {
      const resolved = el("div", "review-item");
      resolved.append(el("span", "tag", "cleared"));
      resolved.append(el("h4", null, "当前无待升级候选"));
      resolved.append(
        el(
          "p",
          null,
          "融资/新闻候选已分流为市场判断、低可信留档或重复佐证；语言长尾候选已进入 coverage/boundary 留档。后续新增项由 monitor 和 full rebuild 重新进入队列。",
        ),
      );
      card.append(resolved);
    }
    data.candidatePromotionQueue.rows.slice(0, 6).forEach((item) => {
      const row = el("div", "review-item");
      row.append(el("span", "tag", item.priority));
      row.append(el("h4", null, item.name));
      row.append(el("p", "signal", `${item.type} · ${item.lane}`));
      row.append(el("p", null, `${item.promotionDecision}: ${item.nextAction}`));
      row.append(linkList(item.evidence));
      card.append(row);
    });
    root.append(card);
  }
}

function renderDiscoveryScan(data) {
  const root = document.querySelector("#discovery-scan");
  const scan = data.discoveryScan;
  if (!root || !scan) return;

  const summary = el("article", "review-card");
  summary.append(el("h3", null, "补充扫描摘要"));
  summary.append(el("p", null, `${scan.totalScans} 组 Exa 盲区查询，${scan.totalResults} 条补充结果。`));
  summary.append(el("p", null, scan.purpose));
  if (scan.generatedAt) summary.append(el("p", "date-line", `生成时间：${fmtDate(scan.generatedAt)}`));
  root.append(summary);

  const review = el("article", "review-card");
  review.append(el("h3", null, "候选处理建议"));
  (scan.reviewItems ?? []).forEach((item) => {
    const block = el("div", "review-item");
    block.append(el("span", "tag", item.decision));
    block.append(el("h4", null, item.name));
    block.append(el("p", "signal", item.lane));
    block.append(el("p", null, item.reason));
    block.append(linkList(item.evidence));
    review.append(block);
  });
  root.append(review);

  if (scan.languageLongTailReview?.length) {
    const languageReview = el("article", "review-card");
    languageReview.append(el("h3", null, "语言交换长尾复核"));
    languageReview.append(
      el("p", null, `${scan.languageLongTailReview.length} 条 HelloTalk/Tandem 长尾结果，区分已入主表、候选补证和学习工具边界。`),
    );
    scan.languageLongTailReview.forEach((item) => {
      const block = el("div", "review-item");
      block.append(el("span", "tag", item.decision));
      block.append(el("h4", null, item.name));
      block.append(el("p", "signal", item.source));
      block.append(el("p", null, item.reason));
      if (item.highlight) block.append(el("p", null, item.highlight));
      block.append(linkList(item.evidence));
      languageReview.append(block);
    });
    root.append(languageReview);
  }

  if (data.languageCoverageAudit?.rows?.length) {
    const coverage = el("article", "review-card");
    coverage.append(el("h3", null, "语言交换覆盖审计"));
    coverage.append(
      el(
        "p",
        null,
        `${data.languageCoverageAudit.totalUnique} 个唯一 HelloTalk/Tandem 相邻条目：主表 ${data.languageCoverageAudit.coreCount} 个，watchlist ${data.languageCoverageAudit.watchlistCount} 个，边界 ${data.languageCoverageAudit.boundaryCount} 个。`,
      ),
    );
    const link = el("a", null, "下载语言交换覆盖审计 CSV");
    link.href = "exports/language-coverage-audit.csv";
    link.target = "_blank";
    link.rel = "noreferrer";
    coverage.append(link);
    data.languageCoverageAudit.rows.slice(0, 10).forEach((item) => {
      const block = el("div", "review-item");
      block.append(el("span", "tag", item.status));
      block.append(el("h4", null, item.name));
      block.append(el("p", "signal", item.decision));
      block.append(el("p", null, item.reason));
      block.append(linkList(item.evidence.slice(0, 3)));
      coverage.append(block);
    });
    root.append(coverage);
  }

  if (data.candidateDeepDive?.rows?.length) {
    const deepDive = el("article", "review-card");
    deepDive.append(el("h3", null, "候选补证深挖"));
    deepDive.append(
      el(
        "p",
        null,
        `${data.candidateDeepDive.candidates} 个候选，${data.candidateDeepDive.searches} 组 Exa company/news 定向补证，${data.candidateDeepDive.totalResults} 条结果。`,
      ),
    );
    const bucketList = el("ul", null);
    data.candidateDeepDive.byDecision.forEach((item) => {
      bucketList.append(el("li", null, `${item.decision}: ${item.count} 个`));
    });
    deepDive.append(bucketList);
    const exportLink = el("a", null, "下载候选补证 CSV");
    exportLink.href = "exports/candidate-deep-dive.csv";
    exportLink.target = "_blank";
    exportLink.rel = "noreferrer";
    deepDive.append(exportLink);
    data.candidateDeepDive.rows.forEach((item) => {
      const block = el("div", "review-item");
      block.append(el("span", "tag", `${item.decision} · ${item.priority}`));
      block.append(el("h4", null, item.name));
      block.append(el("p", "signal", item.lane));
      block.append(el("p", null, item.reason));
      block.append(linkList(item.evidence.slice(0, 3)));
      deepDive.append(block);
    });
    root.append(deepDive);
  }

  (scan.groups ?? []).forEach((group) => {
    const card = el("article", "review-card");
    card.append(el("h3", null, group.label));
    card.append(el("p", null, `${group.category} · ${group.resultCount} 条结果 · requestId ${group.requestId}`));
    (group.notableResults ?? []).forEach((item) => {
      const block = el("div", "review-item");
      block.append(el("span", "tag", item.publishedDate ? fmtDate(item.publishedDate) : "company result"));
      block.append(el("h4", null, item.title));
      block.append(el("p", null, item.highlight || "Exa returned this item as a discovery candidate."));
      if (item.url) {
        const link = el("a", null, "查看证据");
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noreferrer";
        block.append(link);
      }
      card.append(block);
    });
    root.append(card);
  });
}

function renderCompletionAudit(data) {
  const root = document.querySelector("#completion-audit");
  if (data.strictCompletionVerdict) {
    const verdict = data.strictCompletionVerdict;
    const verdictCard = el("article", "completion-card caution strict-verdict-card");
    verdictCard.append(el("span", "tag", verdict.presentationReady ? "presentation ready" : "needs work"));
    verdictCard.append(el("h3", null, "严格完成判定"));
    verdictCard.append(
      el(
        "p",
        "signal",
        `${verdict.status} · 阻塞 ${verdict.blockingGapRows} · monitor 观察 ${verdict.monitoredGapRows} · alert pending ${verdict.latestAlertPendingRows} · recent pending ${verdict.recentSignalPendingRows}`,
      ),
    );
    verdictCard.append(el("p", null, verdict.reason));
    const conditions = el("div", "proof-list");
    (verdict.hardConditions ?? []).forEach((condition) => conditions.append(el("span", null, condition)));
    verdictCard.append(conditions);
    verdictCard.append(el("p", null, verdict.nextMechanism));
    root.append(verdictCard);
  }

  if (data.goalReadiness) {
    const readiness = data.goalReadiness;
    const readinessCard = el("article", readiness.status === "needs-work" ? "completion-card caution" : "completion-card objective-map-card");
    readinessCard.append(el("span", "tag", readiness.status));
    readinessCard.append(el("h3", null, "目标完成就绪度"));
    readinessCard.append(
      el(
        "p",
        null,
        `阻塞缺口 ${readiness.blockingGaps.rows} 条 · monitor 观察缺口 ${readiness.monitoredGaps.rows} 条 · 背景/低相关留档 ${readiness.backgroundGaps.rows} 条`,
      ),
    );
    const gates = el("div", "proof-list");
    readiness.hardGates.forEach((gate) => {
      gates.append(el("span", null, `${gate.pass ? "pass" : "fail"} · ${gate.gate}: ${gate.value}`));
    });
    readinessCard.append(gates);
    readinessCard.append(el("p", null, readiness.boundary));
    root.append(readinessCard);
  }

  if (data.originalObjectiveAuditSummary) {
    const audit = data.originalObjectiveAuditSummary;
    const auditCard = el("article", "completion-card original-objective-card");
    auditCard.append(el("span", "tag", audit.currentEvidenceStatus));
    auditCard.append(el("h3", null, "原始目标逐条审计"));
    auditCard.append(
      el(
        "p",
        null,
        `${audit.rows} 行验收索引：产品 ${audit.counts.products} 个，语言相邻 ${audit.counts.languageAdjacentUnique} 个，融资/新闻合并复核 ${audit.counts.fundingReviewRows} 行，IRL 证据 ${audit.counts.irlOfflineEvidenceRows} 行，monitor 新增 ${audit.counts.monitorNewAlerts} 条且待复核 ${audit.counts.latestAlertPendingRows + audit.counts.recentSignalPendingRows}。`,
      ),
    );
    auditCard.append(el("p", null, `${audit.status} · presentationReady = ${audit.presentationReady}`));
    auditCard.append(el("p", "muted", audit.boundary));
    const links = el("div", "objective-audit-links");
    [
      ["Markdown", audit.files.markdown],
      ["CSV", audit.files.csv],
      ["JSON", audit.files.json],
    ].forEach(([label, href]) => {
      const link = el("a", null, label);
      link.href = href;
      link.target = "_blank";
      link.rel = "noreferrer";
      links.append(link);
    });
    auditCard.append(links);
    root.append(auditCard);
  }

  if (data.objectiveEvidenceMap?.length) {
    const mapCard = el("article", "completion-card objective-map-card");
    mapCard.append(el("span", "tag", "data saved"));
    mapCard.append(el("h3", null, "目标证据映射"));
    mapCard.append(
      el(
        "p",
        null,
        `已把 ${data.objectiveEvidenceMap.length} 个目标落成网页视图、数据文件、导出附件和验证门的映射，后续 monitor 新内容可按这些目标归档。`,
      ),
    );
    const link = el("a", null, "下载目标证据映射 CSV");
    link.href = "exports/objective-evidence-map.csv";
    link.target = "_blank";
    link.rel = "noreferrer";
    mapCard.append(link);

    const list = el("div", "objective-map-list");
    data.objectiveEvidenceMap.forEach((item) => {
      const row = el("div", "objective-map-row");
      row.append(el("span", "tag", item.status));
      row.append(el("h4", null, item.requirement));
      row.append(el("p", null, item.evidence));
      row.append(el("small", null, `${item.views.join(" / ")} · ${item.exportFiles.length} 个导出 · ${item.validators.join(", ")}`));
      list.append(row);
    });
    mapCard.append(list);
    root.append(mapCard);
  }

  data.completionAudit.forEach((item) => {
    const card = el("article", item.status === "保守说明" ? "completion-card caution" : "completion-card");
    card.append(el("span", "tag", item.status));
    card.append(el("h3", null, item.requirement));
    card.append(el("p", null, item.evidence));
    const proof = el("div", "proof-list");
    item.proof.forEach((text) => proof.append(el("span", null, text)));
    card.append(proof);
    root.append(card);
  });
}

function renderCandidateReview(data) {
  const root = document.querySelector("#candidate-review");
  if (data.candidateReview?.alertClosure) {
    const closure = data.candidateReview.alertClosure;
    const closureCard = el("article", "review-card closure-card");
    closureCard.append(el("span", "tag", closure.status === "closed" ? "alert loop closed" : "needs review"));
    closureCard.append(el("h3", null, "Monitor 闭环状态"));
    closureCard.append(
      el(
        "p",
        "signal",
        `最新提醒 ${closure.latestAlertReviewRows} 条，待复核 ${closure.latestAlertPendingRows} 条 · 近窗复核 ${closure.recentSignalReviewRows} 条，待复核 ${closure.recentSignalPendingRows} 条`,
      ),
    );
    closureCard.append(el("p", null, `验证门：${closure.validator}`));
    root.append(closureCard);
  }
  const groups = [
    ["promoted", "已升级进主表"],
    ["deferred", "继续观察"],
    ["latestAlertReview", "最新提醒处理"],
    ["recentSignalReview", "近窗信号复核"],
    ["monitorPolicy", "升级规则"],
  ];

  groups.forEach(([key, title]) => {
    const card = el("article", "review-card");
    card.append(el("h3", null, title));

    if (key === "monitorPolicy") {
      const list = el("ul", null);
      (data.candidateReview[key] ?? []).forEach((text) => list.append(el("li", null, text)));
      card.append(list);
      if (data.candidateReview.monitorLaneRouting?.length) {
        const routing = el("div", "review-item");
        routing.append(el("span", "tag", "lane routing"));
        routing.append(el("h4", null, "近窗信号分流"));
        const routingList = el("ul", null);
        data.candidateReview.monitorLaneRouting.forEach((item) => {
          routingList.append(el("li", null, `${item.lane}: ${item.total} 条，新增 ${item.new} 条，critical ${item.critical} 条`));
        });
        routing.append(routingList);
        const link = el("a", null, "下载 monitor 分流 CSV");
        link.href = "exports/monitor-lane-routing.csv";
        link.target = "_blank";
        link.rel = "noreferrer";
        routing.append(link);
        card.append(routing);
      }
      root.append(card);
      return;
    }

    (data.candidateReview[key] ?? []).forEach((item) => {
      const block = el("div", "review-item");
      block.append(el("span", "tag", item.source));
      block.append(el("h4", null, item.name));
      block.append(
        el(
          "p",
          "signal",
          item.priority ? `${item.decision} · ${item.priority}${item.lane ? ` · ${item.lane}` : ""}` : item.decision,
        ),
      );
      if (item.upgradePath) block.append(el("p", null, `升级路径：${item.upgradePath}`));
      if (item.action) block.append(el("p", null, `动作：${item.action}`));
      block.append(el("p", null, item.reason));
      block.append(linkList(item.evidence));
      card.append(block);
    });

    root.append(card);
  });
}

function renderDataPersistence(data, monitor, history, ledger) {
  const root = document.querySelector("#data-persistence");
  if (!root) return;

  const detailSets = detailDatasets(data).filter((dataset) => dataset.rows.length);
  const detailRows = detailSets.reduce((total, dataset) => total + dataset.rows.length, 0);
  const sourceRows = data.sourceLinkageAudit?.rows?.length ?? 0;
  const gapRows = data.coverageGapRegister?.totalGaps ?? data.coverageGapRegister?.groups?.reduce((total, group) => total + (group.count ?? 0), 0) ?? 0;

  const cards = [
    {
      label: "persistent data",
      title: "本地 JSON + SQLite 数据层",
      signal: `${data.clusters.reduce((count, cluster) => count + cluster.items.length, 0)} 个产品 · ${data.exaQueryMatrix?.totalResults ?? 0} 条 Exa 结果`,
      body: "核心数据保存在 data/brief.json、data/monitor.json、data/monitor-history.json、data/monitor-ledger.json 和 Exa raw JSON；另导出 SQLite 数据库，CSV 不是唯一数据源。",
      proof: ["data/brief.json", "data/monitor*.json", "exports/exa-social-research.sqlite"],
    },
    {
      label: "frontend display",
      title: "网页内可直接查看",
      signal: `${detailSets.length} 张明细表 · ${detailRows} 行网页内审计数据`,
      body: `Evidence 页已把竞品、融资、IRL、来源关联、覆盖缺口和目标映射等关键审计渲染到前端；来源链接可直接点开。`,
      proof: ["#evidence", "#detail-tables", "可搜索 / 可切换 / 可点击来源"],
    },
    {
      label: "exports",
      title: "CSV / Markdown / HTML 是附件",
      signal: `${exportEntryCount || "全部"} 个导出入口 · 单文件 HTML 可离线展示`,
      body: "CSV 用于下载复核和二次分析，Markdown 用于交接说明，standalone HTML 用于给别人打开展示。",
      proof: ["exports/*.csv", "exports/current-state.md", "exports/exa-ai-social-report.html"],
    },
    {
      label: "monitor & snapshots",
      title: "监控与快照已持久化",
      signal: `${monitor.summary?.monitors ?? 0} 条 lane · 历史 ${history.runs?.length ?? 0} 次 · 台账 ${ledger.totalItems ?? ledger.items?.length ?? 0} 条`,
      body: `最近一次 monitor 近窗信号 ${monitor.summary?.recentResults ?? 0} 条，新增提醒 ${monitor.summary?.newAlerts ?? 0} 条；每次收口会保存到 exports/snapshots/ 时间戳目录。`,
      proof: ["data/monitor-history.json", "data/monitor-ledger.json", "exports/snapshots/"],
    },
    {
      label: "boundary",
      title: "覆盖边界可审计",
      signal: `${sourceRows} 条来源关联 · ${gapRows} 条缺口留档`,
      body: "未进入主表的结果不会被隐藏，会进入 source linkage、coverage gap、candidate deep-dive、residual review 或 monitor watchlist。",
      proof: ["source linkage", "coverage gap register", "candidate / residual review"],
    },
  ];

  cards.forEach((item) => {
    const card = el("article", "data-persistence-card");
    card.append(el("span", "tag", item.label));
    card.append(el("h3", null, item.title));
    card.append(el("p", "signal", item.signal));
    card.append(el("p", null, item.body));
    const proof = el("div", "proof-list");
    item.proof.forEach((text) => proof.append(el("span", null, text)));
    card.append(proof);
    root.append(card);
  });
}

function compactValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.label && item?.url) return `${item.label}: ${item.url}`;
        if (item?.name && item?.url) return `${item.name}: ${item.url}`;
        if (item?.source && item?.url) return `${item.source}: ${item.url}`;
        return Object.values(item ?? {}).filter(Boolean).join(" / ");
      })
      .join("；");
  }
  if (value && typeof value === "object") return Object.values(value).filter(Boolean).join(" / ");
  return String(value ?? "");
}

function asRows(source) {
  if (Array.isArray(source)) return source;
  if (Array.isArray(source?.rows)) return source.rows;
  return [];
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value ?? ""));
}

function detailLink(label, url) {
  const link = el("a", "detail-link", label || url);
  link.href = url;
  link.target = "_blank";
  link.rel = "noreferrer";
  return link;
}

function urlHostLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return String(url ?? "");
  }
}

function appendTextWithLinks(container, text) {
  const parts = String(text ?? "").split(/(https?:\/\/[^\s；,，)）]+[^\s；,，).）]?)/gi);
  parts.filter(Boolean).forEach((part) => {
    if (isHttpUrl(part)) {
      container.append(detailLink(urlHostLabel(part), part));
    } else {
      container.append(document.createTextNode(part));
    }
  });
}

function renderDetailCellValue(value) {
  const wrap = el("div", "detail-cell-value");

  if (Array.isArray(value)) {
    if (!value.length) return wrap;
    const list = el("div", "detail-link-list");
    value.slice(0, 5).forEach((item) => {
      const entry = el("span", "detail-link-entry");
      if (typeof item === "string") {
        appendTextWithLinks(entry, item);
      } else if (item?.url) {
        entry.append(detailLink(item.label || item.name || item.title || item.source || urlHostLabel(item.url), item.url));
        const meta = [item.date, item.amount, item.category, item.priority, item.status].filter(Boolean).join(" · ");
        if (meta) entry.append(el("span", "detail-link-meta", meta));
      } else {
        appendTextWithLinks(entry, compactValue(item));
      }
      list.append(entry);
    });
    if (value.length > 5) list.append(el("span", "detail-link-more", `+${value.length - 5} more`));
    wrap.append(list);
    return wrap;
  }

  if (value && typeof value === "object") {
    if (value.url) {
      wrap.append(detailLink(value.label || value.name || value.title || value.source || urlHostLabel(value.url), value.url));
    } else {
      appendTextWithLinks(wrap, compactValue(value));
    }
    return wrap;
  }

  appendTextWithLinks(wrap, value);
  return wrap;
}

function detailDatasets(data) {
  return [
    {
      id: "growth",
      title: "增长 / 渠道审计",
      description: "每个产品的增长强度、渠道标签、增长信号和下一步检查。",
      rows: data.growthChannelAudit?.rows ?? [],
      columns: [
        ["name", "产品"],
        ["cluster", "赛道"],
        ["growthLevel", "增长"],
        ["channelTags", "渠道标签", compactValue],
        ["signal", "增长信号"],
        ["channel", "渠道说明"],
        ["nextCheck", "下一步"],
      ],
    },
    {
      id: "paid",
      title: "投放 / 付费获客证据",
      description: "区分明确投放、方向性渠道和无投放证据，避免把广告生态新闻误当产品买量。",
      rows: data.paidAcquisitionEvidenceAudit?.rows ?? [],
      columns: [
        ["name", "产品"],
        ["evidenceClass", "证据类别"],
        ["paidSignalType", "信号类型"],
        ["confidence", "置信度"],
        ["claimLevel", "可声称级别"],
        ["safeClaim", "安全表述"],
        ["primaryChannel", "主渠道"],
        ["paidOrOrganic", "获客属性"],
        ["evidence", "证据链接"],
        ["nextCheck", "下一步"],
      ],
    },
    {
      id: "function",
      title: "功能差异审计",
      description: "每个产品的交互机制、真人连接模式、AI 角色和功能差异。",
      rows: data.functionalDifferenceAudit?.rows ?? [],
      columns: [
        ["name", "产品"],
        ["humanMode", "真人模式"],
        ["aiRole", "AI 角色"],
        ["mechanismTags", "机制标签", compactValue],
        ["differentiator", "功能差异"],
        ["nextCheck", "下一步"],
      ],
    },
    {
      id: "official",
      title: "官网 / 商店 / 社媒证据",
      description: "官网、App Store、Google Play、LinkedIn、社媒/社区覆盖状态与缺口。",
      rows: data.officialSocialCoverageAudit?.rows ?? [],
      columns: [
        ["name", "产品"],
        ["status", "证据状态"],
        ["totalLinks", "链接数"],
        ["officialWebLinks", "官网"],
        ["appStoreLinks", "App Store"],
        ["googlePlayLinks", "Google Play"],
        ["linkedInLinks", "LinkedIn"],
        ["socialCommunityLinks", "社媒/社区"],
        ["evidence", "证据链接"],
        ["nextCheck", "下一步"],
      ],
    },
    {
      id: "language",
      title: "HelloTalk / Tandem 相邻语言证据",
      description: "语言交换相邻产品的相似度、官方证据、增长渠道和功能差异。",
      rows: data.languageOfficialEvidenceMap?.rows ?? [],
      columns: [
        ["name", "产品"],
        ["similarity", "相似度"],
        ["evidenceReadiness", "证据准备度"],
        ["officialStatus", "官方证据"],
        ["growthSignal", "增长信号"],
        ["functionalDifference", "功能差异"],
        ["evidence", "证据链接"],
        ["nextCheck", "下一步"],
      ],
    },
    {
      id: "funding",
      title: "融资 / 新闻产品聚合",
      description: "近两年融资和新闻按产品聚合，突出 IRL、明确美元融资和最新事件。",
      rows: data.fundingProductRollup?.rows ?? [],
      columns: [
        ["name", "产品"],
        ["dominantLane", "主赛道"],
        ["eventCount", "事件数"],
        ["explicitUsdM", "明确美元融资($M)"],
        ["irlRelated", "IRL"],
        ["latestDate", "最新日期"],
        ["conclusion", "结论"],
        ["evidence", "证据链接"],
      ],
    },
    {
      id: "irl",
      title: "IRL / 线下真人证据地图",
      description: "线下真人社交条目的模式、证据强度、融资/monitor 链接和处理结论。",
      rows: data.irlOfflineEvidenceMap?.rows ?? [],
      columns: [
        ["name", "产品"],
        ["offlineMode", "线下模式"],
        ["status", "状态"],
        ["evidenceStrength", "证据强度"],
        ["fundingEventCount", "融资/新闻"],
        ["monitorSignalCount", "monitor"],
        ["reason", "证据说明"],
        ["fundingEvents", "融资链接"],
        ["monitorSignals", "monitor链接"],
        ["nextCheck", "下一步"],
      ],
    },
    {
      id: "company",
      title: "公司背景覆盖",
      description: "people/company/financial report 对公司、团队、收入、增长和背景的覆盖状态。",
      rows: data.companyBackgroundCoverageAudit?.rows ?? [],
      columns: [
        ["name", "产品"],
        ["status", "覆盖状态"],
        ["capabilityTier", "能力分层"],
        ["directCompanySignals", "公司信号"],
        ["directPeopleSignals", "people"],
        ["directFinancialSignals", "financial"],
        ["directDimensions", "已覆盖维度"],
        ["missingDirectDimensions", "仍缺维度"],
        ["productLevelSignalCount", "产品级信号"],
        ["nextCheck", "下一步"],
      ],
    },
    {
      id: "funding-events",
      title: "融资事件级审计",
      description: "逐条检查近两年窗口、金额类型、IRL 相关性、去重和来源链接。",
      rows: asRows(data.fundingEventAudit),
      columns: [
        ["name", "产品"],
        ["date", "日期"],
        ["inWindow", "窗口内"],
        ["amount", "金额/事件"],
        ["amountType", "金额类型"],
        ["explicitUsdM", "USD($M)"],
        ["normalizedLane", "赛道"],
        ["irlRelated", "IRL"],
        ["keptInUniqueCount", "计入唯一"],
        ["conclusion", "结论"],
        ["url", "来源"],
      ],
    },
    {
      id: "funding-upgrade",
      title: "融资候选升级映射",
      description: "解释补充融资/新闻候选是保留、去重佐证，还是继续观察。",
      rows: asRows(data.fundingUpgradeMap),
      columns: [
        ["name", "产品"],
        ["date", "日期"],
        ["amount", "金额/事件"],
        ["upgradeStatus", "升级状态"],
        ["keptInUniqueCount", "计入唯一"],
        ["duplicateOf", "重复对象"],
        ["irlRelated", "IRL"],
        ["targetView", "目标视图"],
        ["nextAction", "下一步"],
        ["url", "来源"],
      ],
    },
    {
      id: "source-linkage",
      title: "原始来源关联审计",
      description: "746 条 Exa 原始/补充来源的 linked、候选、背景、低相关分流状态。",
      rows: asRows(data.sourceLinkageAudit),
      columns: [
        ["title", "来源标题"],
        ["sourceLayer", "来源层"],
        ["queryId", "queryId"],
        ["category", "Exa 类别"],
        ["linkageType", "关联"],
        ["reviewTier", "复核层级"],
        ["reviewDecision", "处理结论"],
        ["matchedEntities", "命中对象", compactValue],
        ["action", "动作"],
        ["url", "来源"],
      ],
    },
    {
      id: "coverage-gaps",
      title: "覆盖缺口 Register",
      description: "未关联来源按高/中/低优先级分组，显示已 deep-dive、仍观察和留档原因。",
      rows: data.coverageGapRegister?.groups ?? [],
      columns: [
        ["key", "缺口组"],
        ["reviewTier", "层级"],
        ["reviewDecision", "处理结论"],
        ["queryId", "queryId"],
        ["category", "Exa 类别"],
        ["count", "来源数"],
        ["priority", "优先级"],
        ["handlingStatus", "处理状态"],
        ["unresolvedCount", "剩余"],
        ["nextAction", "下一步"],
        ["examples", "示例来源"],
      ],
    },
    {
      id: "candidate-deep-dive",
      title: "候选补证 Deep-dive",
      description: "对高优先级候选做 targeted Exa company/news 补证后的升级或留档结论。",
      rows: asRows(data.candidateDeepDive),
      columns: [
        ["name", "候选"],
        ["lane", "赛道"],
        ["decision", "处理结论"],
        ["priority", "优先级"],
        ["sourceQueryId", "来源 query"],
        ["totalResults", "结果数"],
        ["reason", "原因"],
        ["evidence", "证据链接"],
      ],
    },
    {
      id: "residual-signals",
      title: "Residual 信号复核",
      description: "中优先级剩余信号的 watchlist、重复佐证、边界/排除和市场背景分流。",
      rows: asRows(data.residualSignalReview),
      columns: [
        ["name", "对象"],
        ["lane", "赛道"],
        ["decision", "处理结论"],
        ["sourceQueryId", "来源 query"],
        ["sourceCategory", "Exa 类别"],
        ["publishedDate", "日期"],
        ["reason", "原因"],
        ["url", "来源"],
      ],
    },
    {
      id: "market-decisions",
      title: "市场判断证据映射",
      description: "research paper / financial report 如何转成市场、商业化、产品能力和风险判断。",
      rows: asRows(data.marketDecisionEvidenceMap),
      columns: [
        ["signalName", "信号"],
        ["sourceCategory", "Exa 类别"],
        ["decisionArea", "判断区域"],
        ["judgment", "判断"],
        ["businessImpact", "业务影响"],
        ["evidenceStrength", "证据强度"],
        ["nextAction", "下一步"],
        ["evidence", "证据链接"],
      ],
    },
    {
      id: "objective-map",
      title: "原始目标证据映射",
      description: "把用户原始目标逐项映射到页面、数据文件、导出物和验证门。",
      rows: asRows(data.objectiveEvidenceMap),
      columns: [
        ["requirement", "需求"],
        ["status", "状态"],
        ["evidence", "证据"],
        ["views", "页面", compactValue],
        ["dataFiles", "数据文件", compactValue],
        ["exportFiles", "导出文件", compactValue],
        ["validators", "验证", compactValue],
        ["boundary", "边界"],
      ],
    },
  ];
}

function renderDetailTables(data) {
  const root = document.querySelector("#detail-table-app");
  if (!root) return;

  const datasets = detailDatasets(data).filter((dataset) => dataset.rows.length);
  let activeId = datasets[0]?.id;
  let query = "";

  const controls = el("div", "detail-controls");
  const tabs = el("div", "detail-tabs");
  const searchWrap = el("div", "detail-search");
  const searchLabel = el("label", null, "搜索当前明细表");
  searchLabel.setAttribute("for", "detail-table-search");
  const search = document.createElement("input");
  search.id = "detail-table-search";
  search.type = "search";
  search.placeholder = "输入产品、渠道、证据状态、融资、IRL 或下一步检查";
  search.autocomplete = "off";
  const clear = el("button", null, "清空");
  clear.type = "button";
  searchWrap.append(searchLabel, search, clear);
  controls.append(tabs, searchWrap);

  const summary = el("p", "detail-count");
  summary.setAttribute("aria-live", "polite");
  const tableWrap = el("div", "detail-table-shell");

  function renderTabs() {
    tabs.innerHTML = "";
    datasets.forEach((dataset) => {
      const button = el("button", dataset.id === activeId ? "active" : null, `${dataset.title} (${dataset.rows.length})`);
      button.type = "button";
      button.addEventListener("click", () => {
        activeId = dataset.id;
        render();
      });
      tabs.append(button);
    });
  }

  function render() {
    renderTabs();
    const dataset = datasets.find((item) => item.id === activeId) ?? datasets[0];
    const normalizedQuery = query.trim().toLowerCase();
    const rows = dataset.rows.filter((row) => !normalizedQuery || compactValue(row).toLowerCase().includes(normalizedQuery));
    summary.textContent = `${dataset.title}：显示 ${rows.length} / ${dataset.rows.length} 行。${dataset.description}`;

    const table = el("table", "detail-data-table");
    const thead = el("thead", null);
    const headRow = el("tr", null);
    dataset.columns.forEach(([, label]) => headRow.append(el("th", null, label)));
    thead.append(headRow);
    table.append(thead);

    const tbody = el("tbody", null);
    rows.forEach((row) => {
      const tr = el("tr", null);
      dataset.columns.forEach(([key, , formatter]) => {
        const td = el("td", null);
        const value = formatter ? formatter(row[key], row) : row[key];
        const cell = renderDetailCellValue(value);
        if (cell.textContent.trim()) td.append(cell);
        else td.textContent = "-";
        tr.append(td);
      });
      tbody.append(tr);
    });
    if (rows.length === 0) {
      const emptyTr = el("tr", "detail-empty-row");
      const emptyTd = el(
        "td",
        "empty-state",
        normalizedQuery
          ? `没有匹配“${query.trim()}”的明细行，换个关键词或清空搜索。`
          : "当前明细表没有数据。",
      );
      emptyTd.colSpan = dataset.columns.length;
      emptyTr.append(emptyTd);
      tbody.append(emptyTr);
    }
    table.append(tbody);
    tableWrap.replaceChildren(table);
  }

  search.addEventListener("input", debounce(() => {
    query = search.value;
    render();
  }));
  clear.addEventListener("click", () => {
    search.value = "";
    query = "";
    render();
    search.focus();
  });

  root.append(controls, summary, tableWrap);
  render();
}

function renderRunLog(data) {
  const coverage = document.querySelector("#coverage-grid");
  [
    ["queries", "Exa 查询组"],
    ["results", "原始结果"],
    ["uniqueUrls", "唯一 URL"],
    ["uniqueDomains", "来源域名"],
  ].forEach(([key, label]) => {
    const card = el("article", "coverage-card");
    card.append(el("strong", null, String(data.coverage[key])));
    card.append(el("span", null, label));
    coverage.append(card);
  });

  const workflow = document.querySelector("#refresh-workflow");
  const workflowHead = el("div", "monitor-block-head");
  workflowHead.append(el("p", "section-label", "refresh workflow"));
  workflowHead.append(el("h3", null, "自动化与手动更新节奏"));
  workflow.append(workflowHead);

  const workflowGrid = el("div", "workflow-grid");
  [
    {
      title: "日常监控刷新",
      command: "node scripts/run-all.mjs",
      body: "每日 09:00 的 Codex automation 会运行这一套：探测 Exa Websets Monitor、跑 Search API monitor、刷新导出和单文件报告。",
    },
    {
      title: "每周全量扩面",
      command: "node scripts/run-all.mjs --full",
      body: "每周一 09:30 的 Codex automation 会重跑 category research、official/social pass 和 discovery blind-spot scan，用来逼近“所有相关产品”。",
    },
    {
      title: "全量证据重建",
      command: "node scripts/run-all.mjs --full",
      body: "手动重跑 company / people / research paper / news / financial report，以及官方/社媒 evidence pass；适合临时重新审计整个市场图谱。",
    },
  ].forEach((item) => {
    const card = el("article", "workflow-card");
    card.append(el("h4", null, item.title));
    card.append(el("code", null, item.command));
    card.append(el("p", null, item.body));
    workflowGrid.append(card);
  });
  workflow.append(workflowGrid);

  const exportPack = document.querySelector("#export-pack");
  const exportHead = el("div", "monitor-block-head");
  exportHead.append(el("p", "section-label", "export pack"));
  exportHead.append(el("h3", null, "导出附件包"));
  exportPack.append(exportHead);

  const exportGrid = el("div", "export-grid");
  const exportEntries = [
    ["单文件报告 HTML", "exports/exa-ai-social-report.html", "可离线打开的完整展示页"],
    ["SQLite 数据库", "exports/exa-social-research.sqlite", "可查询的本地数据库：products、funding_events、monitor_signals、source_linkage、coverage_gaps、audit_rows"],
    ["SQLite 数据库说明", "exports/sqlite-database-guide.md", "数据库表结构、行数和常用 SQL 查询示例"],
    ["当前状态锁定 MD", "exports/current-state.md", "展示版当前核心数字、monitor、待复核、边界和刷新入口"],
    ["当前状态锁定 JSON", "exports/current-state.json", "机器可读的当前状态锁定，用于交接和快照复核"],
    ["Monitor 运行回执 MD", "exports/latest-monitor-run.md", `${monitor.summary?.recentResults ?? 0} 条近窗信号，${monitor.summary?.newAlerts ?? 0} 条新增提醒，含 Exa requestIds 和处理结论`],
    ["Monitor 运行回执 JSON", "exports/latest-monitor-run.json", "机器可读的最近一次 monitor 回执，用于复核 requestIds、分流结论和 SQLite 持久化计数"],
    ["自动化核对 MD", "exports/automation-audit.md", "每日 monitor 和每周 full rebuild 的 Codex automation 状态、排期和证据"],
    ["现场演示清单 MD", "exports/demo-checklist.md", "3 分钟打开路径、数据库/前端展示回答口径和常见追问"],
    ["最新快照指针 MD", "exports/latest-snapshot.md", "固定入口，指向当前 timestamped snapshot、manifest、核心计数和展示入口"],
    ["最新快照指针 JSON", "exports/latest-snapshot.json", "机器可读的最新快照路径、manifest 路径、状态、计数和 retention 结果"],
    ["展示讲稿 MD", "exports/executive-brief.md", "按页面视图组织的中文讲稿"],
    ["目标证据映射 CSV", "exports/objective-evidence-map.csv", `${data.objectiveEvidenceMap?.length ?? 0} 个目标证据条目`],
    ["目标完成就绪度 CSV", "exports/goal-readiness.csv", `阻塞缺口 ${data.goalReadiness?.blockingGaps?.rows ?? 0} 条，monitor 观察 ${data.goalReadiness?.monitoredGaps?.rows ?? 0} 条`],
    ["竞品主表 CSV", "exports/competitive-matrix.csv", `${data.clusters.reduce((count, cluster) => count + cluster.items.length, 0)} 行产品证据`],
    ["来源覆盖 CSV", "exports/source-coverage.csv", `${data.exaQueryMatrix.totalSearches} 组 Exa 查询来源审计`],
    ["Exa 类别审计 CSV", "exports/exa-category-evidence-audit.csv", `${data.exaCategoryEvidenceAudit?.totalCategories ?? 0} 类 category 映射`],
    ["Exa 类别覆盖说明 MD", "exports/exa-category-coverage-guide.md", "把 company、people、research paper、news、financial report 等类别如何支撑判断讲成展示口径"],
    ["来源关联审计 CSV", "exports/source-linkage-audit.csv", `${data.sourceLinkageAudit?.totalResults ?? 0} 条原始结果关联状态`],
    ["覆盖缺口 Register CSV", "exports/coverage-gap-register.csv", `${data.coverageGapRegister?.totalGaps ?? 0} 条未关联复核缺口`],
    ["候选补证 CSV", "exports/candidate-deep-dive.csv", `${data.candidateDeepDive?.candidates ?? 0} 个候选定向补证`],
    ["Residual signal review CSV", "exports/residual-signal-review.csv", `${data.residualSignalReview?.totalRows ?? 0} 条 residual signal 分流`],
    ["产品能力评分 CSV", "exports/product-capability-score.csv", `${data.productCapability?.totalProducts ?? 0} 个产品的排序口径`],
    ["增长渠道审计 CSV", "exports/growth-channel-audit.csv", `${data.growthChannelAudit?.totalProducts ?? 0} 个产品的 GTM 标签`],
    ["获客渠道地图 CSV", "exports/acquisition-channel-map.csv", `${data.acquisitionChannelMap?.totalProducts ?? 0} 个产品获客/投放口径`],
    ["投放渠道证据审计 CSV", "exports/paid-acquisition-evidence-audit.csv", `明确投放 ${data.paidAcquisitionEvidenceAudit?.explicitPaidRows ?? 0} 个，方向性渠道 ${data.paidAcquisitionEvidenceAudit?.directionalRows ?? 0} 个`],
    ["功能差异审计 CSV", "exports/functional-difference-audit.csv", `${data.functionalDifferenceAudit?.totalProducts ?? 0} 个产品机制标签`],
    ["官方社媒覆盖 CSV", "exports/official-social-coverage-audit.csv", `${data.officialSocialCoverageAudit?.totalProducts ?? 0} 个产品证据缺口`],
    ["官方缺口深挖 CSV", "exports/official-gap-deep-dive.csv", `${data.officialGapDeepDive?.searches ?? 0} 组 targeted 官方/社媒补证`],
    ["语言官方社媒深挖 CSV", "exports/language-official-social-deep-dive.csv", `${data.languageOfficialSocialDeepDive?.searches ?? 0} 组 targeted 语言官方/社媒补证`],
    ["公司背景复核 CSV", "exports/company-background-review.csv", `${data.companyBackgroundReview?.totalSignals ?? 0} 条 people/company/financial 信号`],
    ["公司背景深挖 CSV", "exports/company-background-deep-dive.csv", `${data.companyBackgroundDeepDive?.linkedProducts?.length ?? 0} 个产品级 company/financial 补证对象`],
    ["公司背景覆盖 CSV", "exports/company-background-coverage-audit.csv", `${data.companyBackgroundCoverageAudit?.totalProducts ?? 0} 个产品背景口径`],
    ["市场判断映射 CSV", "exports/market-decision-evidence-map.csv", `${data.marketDecisionEvidenceMap?.totalRows ?? 0} 条 research/financial 判断`],
    ["融资新闻 CSV", "exports/funding-timeline.csv", `${data.fundingTimeline.length} 条近两年事件`],
    ["融资新闻总复核 CSV", "exports/funding-news-review.csv", `${data.fundingSummary.combinedEvents} 条主表+补充候选`],
    ["融资新闻去重审计 CSV", "exports/funding-news-dedup-audit.csv", `${data.fundingSummary.uniqueCombinedEvents} 条唯一事件`],
    ["融资事件级审计 CSV", "exports/funding-event-audit.csv", `${data.fundingEventAudit?.totalRows ?? 0} 行事件口径`],
    ["融资候选升级映射 CSV", "exports/funding-upgrade-map.csv", `${data.fundingUpgradeMap?.totalRows ?? 0} 条补充候选处理状态`],
    ["融资产品聚合 CSV", "exports/funding-product-rollup.csv", `${data.fundingProductRollup?.totalProducts ?? 0} 个产品/公司聚合`],
    ["融资盲区候选 CSV", "exports/funding-discovery-candidates.csv", `${data.discoveryScan?.fundingCandidateRows ?? 0} 条 discovery 融资/规模信号`],
    ["候选升级队列 CSV", "exports/candidate-promotion-queue.csv", `${data.candidatePromotionQueue?.totalRows ?? 0} 个待升级/待补证候选`],
    ["提醒处理 CSV", "exports/latest-alert-review.csv", `${data.candidateReview.latestAlertReview.length} 条处理结论，待复核 ${data.candidateReview.alertClosure?.latestAlertPendingRows ?? 0}`],
    ["近窗复核 CSV", "exports/monitor-recent-review.csv", `${data.candidateReview.recentSignalReview?.length ?? 0} 条 monitor 近窗复核，待复核 ${data.candidateReview.alertClosure?.recentSignalPendingRows ?? 0}`],
    ["Monitor 分流 CSV", "exports/monitor-lane-routing.csv", `${data.candidateReview.monitorLaneRouting?.length ?? 0} 条目标主线`],
    ["Monitor 信号 CSV", "exports/monitor-recent-signals.csv", "最近一次高相关信号"],
    ["Discovery 候选 CSV", "exports/discovery-candidates.csv", `${data.discoveryScan?.reviewItems?.length ?? 0} 条补充扫描候选`],
    ["语言长尾复核 CSV", "exports/language-long-tail-review.csv", `${data.discoveryScan?.languageLongTailReview?.length ?? 0} 条语言交换长尾结果`],
    ["语言覆盖审计 CSV", "exports/language-coverage-audit.csv", `${data.languageCoverageAudit?.totalUnique ?? 0} 个唯一语言交换条目`],
    ["语言相似度审计 CSV", "exports/language-similarity-audit.csv", `${data.languageSimilarityAudit?.totalRows ?? 0} 个 HelloTalk/Tandem 相邻条目`],
    ["语言官方证据地图 CSV", "exports/language-official-evidence-map.csv", `${data.languageOfficialEvidenceMap?.totalRows ?? 0} 个语言产品证据状态`],
    ["语言增长渠道深挖 CSV", "exports/language-growth-channel-deep-dive.csv", `${data.languageGrowthChannelDeepDive?.searches ?? 0} 组 targeted 语言增长/渠道补证`],
    ["IRL 覆盖审计 CSV", "exports/irl-coverage-audit.csv", `${data.irlCoverageAudit?.totalUnique ?? 0} 个线下真人条目`],
    ["线下真人证据地图 CSV", "exports/irl-offline-evidence-map.csv", `${data.irlOfflineEvidenceMap?.totalRows ?? 0} 个 IRL 证据条目`],
    ["补充融资新闻 CSV", "exports/supplemental-funding-news.csv", `${data.discoveryScan?.supplementalFundingNews?.length ?? 0} 条盲区事件`],
    ["浏览器 QA 报告 MD", "exports/browser-qa-report.md", "内置浏览器 route、viewport、DOM 和布局验证留档"],
    ["完成度审计 MD", "exports/completion-audit.md", `${data.completionAudit.length} 个需求审计项`],
    ["完成度 Manifest", "exports/completion-manifest.json", "机器可读的需求证据映射"],
    ["原始目标逐条审计 MD", "exports/original-objective-audit.md", "按最初需求逐项说明已证明证据、展示边界和下一步检查"],
    ["原始目标逐条审计 CSV", "exports/original-objective-audit.csv", "逐项验收表，可筛选需求、状态、证据工件和 monitor 边界"],
    ["功能与版本记录 MD", "功能与版本记录.md", "本网页的功能清单、版本表、验证口径和维护规则"],
    ["时间戳快照目录", "exports/snapshots/", "保存页面、数据、导出附件和 manifest 的历史版本"],
  ];
  exportEntryCount = exportEntries.length;
  exportEntries.forEach(([title, href, description]) => {
    const card = el("article", "export-card");
    card.append(el("h4", null, title));
    card.append(el("p", null, description));
    const link = el("a", null, "打开附件");
    link.href = href;
    link.target = "_blank";
    link.rel = "noreferrer";
    card.append(link);
    exportGrid.append(card);
  });
  exportPack.append(exportGrid);

  renderSqliteGuide(data);

  const matrix = document.querySelector("#query-matrix");
  const head = el("div", "monitor-block-head");
  head.append(el("p", "section-label", "query matrix"));
  head.append(el("h3", null, "Exa query / category / requestId 对照"));
  matrix.append(head);

  const categoryGrid = el("div", "query-category-grid");
  data.exaQueryMatrix.byCategory.forEach((item) => {
    const card = el("article", "query-category-card");
    card.append(el("strong", null, String(item.searches)));
    card.append(el("span", null, item.category));
    card.append(el("p", null, `${item.results} 条结果`));
    categoryGrid.append(card);
  });
  matrix.append(categoryGrid);

  if (data.exaCategoryEvidenceAudit) {
    const audit = el("div", "monitor-block-head category-audit-head");
    audit.append(el("p", "section-label", "category evidence audit"));
    audit.append(el("h3", null, "Exa category 到研究判断的映射"));
    const auditLink = el("a", null, "下载 category evidence audit CSV");
    auditLink.href = "exports/exa-category-evidence-audit.csv";
    auditLink.target = "_blank";
    auditLink.rel = "noreferrer";
    audit.append(auditLink);
    matrix.append(audit);

    const auditGrid = el("div", "query-category-grid");
    data.exaCategoryEvidenceAudit.rows.forEach((item) => {
      const card = el("article", "query-category-card");
      card.append(el("strong", null, item.category));
      card.append(el("span", null, `${item.searches} queries / ${item.results} results`));
      card.append(el("p", null, item.useCase));
      card.append(el("p", null, item.outputViews.join(" · ")));
      auditGrid.append(card);
    });
    matrix.append(auditGrid);
  }

  const shell = el("div", "query-table-shell");
  const table = el("table", "query-table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["查询 ID", "来源", "Exa category", "结果", "requestId"].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.append(th);
  });
  thead.append(headRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  data.exaQueryMatrix.rows.forEach((item) => {
    const row = document.createElement("tr");
    [item.id, item.source, item.category, String(item.resultCount), item.requestId].forEach((text, index) => {
      const cell = document.createElement(index === 0 ? "th" : "td");
      if (index === 0) cell.scope = "row";
      cell.textContent = text;
      row.append(cell);
    });
    tbody.append(row);
  });
  table.append(tbody);
  shell.append(table);
  matrix.append(shell);

  const root = document.querySelector("#run-log");
  data.requestIds.forEach((id) => {
    root.append(el("span", null, id));
  });
}

function renderSqliteGuide(data) {
  const root = document.querySelector("#sqlite-guide");
  const head = el("div", "monitor-block-head");
  head.append(el("p", "section-label", "sqlite query handoff"));
  head.append(el("h3", null, "SQLite 查询手册：不用下载 CSV 也能查数据库"));
  root.append(head);

  const intro = el("p", "sqlite-guide-note");
  intro.textContent = "本地数据库保存在 exports/exa-social-research.sqlite；下面 5 个 view 已经把展示时最常问的问题预聚合好，可直接用 sqlite3 或任意 SQLite 客户端查询。";
  root.append(intro);

  const totalProducts = data.clusters.reduce((count, cluster) => count + cluster.items.length, 0);
  const monitorRows = data.candidateReview?.recentSignalReview?.length ?? 0;
  const gapRows = data.coverageGapRegister?.totalGaps ?? 0;
  const paidRows = data.paidAcquisitionEvidenceAudit?.totalProducts ?? totalProducts;
  const languageRows = data.languageSimilarityAudit?.mainTableProducts ?? 16;
  const irlRows = data.fundingEventAudit?.rows?.filter((row) => row.irlRelevance && row.irlRelevance !== "none").length ?? 18;

  const guides = [
    {
      view: "view_language_adjacent_products",
      title: "HelloTalk / Tandem 相邻产品",
      rows: languageRows,
      question: "哪些语言交换产品已经进主表，差异点和证据等级是什么？",
      sql: "SELECT product, company, cluster, evidence_tier, growth_signals, channels\nFROM view_language_adjacent_products\nORDER BY product;",
    },
    {
      view: "view_irl_funding_news",
      title: "IRL / 线下真人融资新闻",
      rows: irlRows,
      question: "近两年哪些融资或新闻事件和线下真人社交相关？",
      sql: "SELECT product, event_date, event_type, amount, source_title, source_url\nFROM view_irl_funding_news\nORDER BY event_date DESC;",
    },
    {
      view: "view_latest_monitor_signals",
      title: "最新 Monitor 信号",
      rows: monitorRows,
      question: "最近一次 Exa monitor 抓到了哪些高相关新动向？",
      sql: "SELECT lane, title, product_hint, decision, url\nFROM view_latest_monitor_signals\nORDER BY lane, title;",
    },
    {
      view: "view_unresolved_coverage_gaps",
      title: "未闭环覆盖缺口",
      rows: gapRows,
      question: "哪些来源还只是观察缺口，为什么没有升级成结论？",
      sql: "SELECT gap_type, priority, product_hint, status, next_action, url\nFROM view_unresolved_coverage_gaps\nORDER BY priority DESC, product_hint;",
    },
    {
      view: "view_paid_acquisition_claims",
      title: "投放/获客安全表述",
      rows: paidRows,
      question: "哪些产品可以声称投放，哪些只能说有渠道线索？",
      sql: "SELECT product, claim_level, safe_claim, next_evidence_needed\nFROM view_paid_acquisition_claims\nORDER BY claim_level, product;",
    },
  ];

  const grid = el("div", "sqlite-guide-grid");
  guides.forEach((guide) => {
    const card = el("article", "sqlite-card");
    card.append(el("h4", null, guide.title));
    card.append(el("p", "sqlite-view-name", guide.view));
    const meta = el("div", "sqlite-meta");
    meta.append(el("strong", null, String(guide.rows)));
    meta.append(el("span", null, "当前行数"));
    card.append(meta);
    card.append(el("p", null, guide.question));
    card.append(el("pre", "sql-snippet", guide.sql));
    grid.append(card);
  });
  root.append(grid);

  const link = el("a", "doc-link sqlite-guide-link", "打开完整 SQLite 数据库说明");
  link.href = "exports/sqlite-database-guide.md";
  link.target = "_blank";
  link.rel = "noreferrer";
  root.append(link);
}

async function loadJson(path, cacheKey) {
  const response = await fetch(`${path}?v=${cacheKey}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} → HTTP ${response.status}`);
  return response.json();
}

async function loadReportData() {
  if (window.__EXA_REPORT_DATA__) {
    return { ...window.__EXA_REPORT_DATA__, failures: [] };
  }

  const cacheKey = Date.now();
  const sources = [
    ["brief", "data/brief.json"],
    ["monitor", "data/monitor.json"],
    ["history", "data/monitor-history.json"],
    ["ledger", "data/monitor-ledger.json"],
    ["digest", "data/monitor-digest.json"],
    ["triage", "data/alert-triage.json"],
  ];

  // Load every file independently so a single 404/timeout cannot blank the whole page.
  const settled = await Promise.allSettled(sources.map(([, path]) => loadJson(path, cacheKey)));
  const result = { failures: [] };
  settled.forEach((outcome, index) => {
    const [key, path] = sources[index];
    if (outcome.status === "fulfilled") {
      result[key] = outcome.value;
    } else {
      result[key] = null;
      result.failures.push({ key, path, error: String(outcome.reason?.message ?? outcome.reason) });
      console.error(`Failed to load ${path}`, outcome.reason);
    }
  });
  return result;
}

// Run a render step in isolation: if it throws, log it and keep rendering the rest of the page.
function safeRender(label, fn) {
  try {
    fn();
  } catch (error) {
    console.error(`渲染失败：${label}`, error);
  }
}

function renderLoadFailureBanner(failures) {
  if (!failures || failures.length === 0) return;
  const host = document.querySelector(".app-body") ?? document.body;
  const banner = el("div", "load-failure-banner");
  banner.setAttribute("role", "alert");
  const names = failures.map((f) => f.path).join("、");
  banner.append(el("strong", null, "部分数据未能加载"));
  banner.append(el("span", null, `以下文件加载失败，相关板块可能为空或缺失：${names}。其余内容已照常显示，可刷新重试。`));
  host.insertBefore(banner, host.firstChild);
}

async function boot() {
  const { brief: data, monitor, history, ledger, digest, triage, failures } = await loadReportData();
  renderLoadFailureBanner(failures);

  const safeData = data ?? {};
  const safeMonitor = monitor ?? { summary: {}, recentItems: [], alertItems: [], runs: [] };
  const safeHistory = history ?? { runs: [] };
  const safeLedger = ledger ?? { items: [], totalItems: 0 };
  const safeDigest = digest ?? { headline: "", bullets: [], recommendedActions: [] };

  safeRender("最新动向", () => renderFeed(safeLedger, safeMonitor, safeDigest));
  safeRender("hero", () => renderHero(safeData));
  safeRender("仪表盘", () => renderDashboard(safeData, safeMonitor, safeHistory, triage));
  safeRender("数据新鲜度", () => renderDataFreshness(safeMonitor, safeHistory));
  safeRender("executive", () => renderExecutiveSummary(safeData));
  safeRender("thesis", () => renderThesis(safeData));
  safeRender("shortlist", () => renderPriorityShortlist(safeData));
  safeRender("channels", () => renderChannelSummary(safeData));
  safeRender("opportunities", () => renderOpportunityRanking(safeData));
  safeRender("对照表", () => renderComparisonTable(safeData));
  safeRender("synthesis", () => renderSynthesis(safeData));
  safeRender("capability", () => renderProductCapability(safeData));
  safeRender("监控", () => renderMonitor(safeMonitor, safeHistory, safeLedger, safeDigest, safeData));
  safeRender("triage", () => renderAlertTriage(triage));
  safeRender("clusters", () => renderClusters(safeData));
  safeRender("funding", () => renderFunding(safeData));
  safeRender("irl", () => renderIrl(safeData));
  safeRender("people", () => renderPeople(safeData));
  safeRender("financial", () => renderFinancial(safeData));
  safeRender("decision-map", () => renderMarketDecisionMap(safeData));
  safeRender("official", () => renderOfficialEvidence(safeData));
  safeRender("research", () => renderResearch(safeData));
  safeRender("coverage-audit", () => renderCoverageAudit(safeData));
  safeRender("discovery", () => renderDiscoveryScan(safeData));
  safeRender("completion", () => renderCompletionAudit(safeData));
  safeRender("candidate-review", () => renderCandidateReview(safeData));
  safeRender("detail-tables", () => renderDetailTables(safeData));
  // run-log renders the export pack and sets exportEntryCount, so render data-persistence after it.
  safeRender("run-log", () => renderRunLog(safeData));
  safeRender("data-persistence", () => renderDataPersistence(safeData, safeMonitor, safeHistory, safeLedger));
  setupRouting();
  setupSignalMap();
  setupBackToTop();
}

function hideLoadingOverlay() {
  const overlay = document.querySelector("#loading-overlay");
  if (overlay) overlay.classList.add("hidden");
}

boot()
  .catch((error) => {
    console.error("Failed to render brief", error);
  })
  .finally(hideLoadingOverlay);
