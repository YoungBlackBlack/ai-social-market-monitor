import { readFile, writeFile } from "node:fs/promises";

const briefUrl = new URL("../data/brief.json", import.meta.url);
const brief = JSON.parse(await readFile(briefUrl, "utf8"));
const exa = JSON.parse(await readFile(new URL("../data/exa-results.json", import.meta.url), "utf8"));
const social = JSON.parse(await readFile(new URL("../data/exa-social-profiles.json", import.meta.url), "utf8"));
let officialGapDeepDive = { searches: [] };
try {
  officialGapDeepDive = JSON.parse(await readFile(new URL("../data/exa-official-gap-deep-dive.json", import.meta.url), "utf8"));
} catch {
  officialGapDeepDive = { searches: [] };
}
const monitor = JSON.parse(await readFile(new URL("../data/monitor.json", import.meta.url), "utf8"));
const synthesis = JSON.parse(await readFile(new URL("../data/exa-synthesis.json", import.meta.url), "utf8"));
let discovery = { scans: [] };
try {
  discovery = JSON.parse(await readFile(new URL("../data/exa-discovery-scan.json", import.meta.url), "utf8"));
} catch {
  discovery = { scans: [] };
}
let candidateDeepDive = { candidates: [], searches: [] };
try {
  candidateDeepDive = JSON.parse(await readFile(new URL("../data/exa-candidate-deep-dive.json", import.meta.url), "utf8"));
} catch {
  candidateDeepDive = { candidates: [], searches: [] };
}
let lingopraxisDeepDive = { searches: [] };
try {
  lingopraxisDeepDive = JSON.parse(await readFile(new URL("../data/exa-lingopraxis-deep-dive.json", import.meta.url), "utf8"));
} catch {
  lingopraxisDeepDive = { searches: [] };
}
let residualSignalDeepDive = { searches: [] };
try {
  residualSignalDeepDive = JSON.parse(await readFile(new URL("../data/exa-residual-signal-deep-dive.json", import.meta.url), "utf8"));
} catch {
  residualSignalDeepDive = { searches: [] };
}
let companyBackgroundDeepDive = { searches: [] };
try {
  companyBackgroundDeepDive = JSON.parse(await readFile(new URL("../data/exa-company-background-deep-dive.json", import.meta.url), "utf8"));
} catch {
  companyBackgroundDeepDive = { searches: [] };
}
let languageGrowthChannelDeepDive = { searches: [] };
try {
  languageGrowthChannelDeepDive = JSON.parse(await readFile(new URL("../data/exa-language-growth-channel-deep-dive.json", import.meta.url), "utf8"));
} catch {
  languageGrowthChannelDeepDive = { searches: [] };
}
let languageOfficialSocialDeepDive = { searches: [] };
try {
  languageOfficialSocialDeepDive = JSON.parse(await readFile(new URL("../data/exa-language-official-social-deep-dive.json", import.meta.url), "utf8"));
} catch {
  languageOfficialSocialDeepDive = { searches: [] };
}

const rawUrls = new Set();
const rawDomains = new Set();
for (const search of exa.searches ?? []) {
  for (const result of search.results ?? []) {
    if (!result.url) continue;
    rawUrls.add(result.url);
    try {
      rawDomains.add(new URL(result.url).hostname.replace(/^www\./, ""));
    } catch {
      // Keep odd URLs in rawUrls; they simply do not contribute a domain.
    }
  }
}

const rawResultCount = (exa.searches ?? []).reduce((count, search) => count + (search.results?.length ?? 0), 0);
brief.generatedAt = exa.generatedAt;
brief.coverage = {
  queries: exa.searches.length,
  results: rawResultCount,
  uniqueUrls: rawUrls.size,
  uniqueDomains: rawDomains.size,
  note:
    "Exa evidence pass across company, news, research paper, financial report, and people categories, now with added AI dating, group travel, local activity, language exchange, and China export专项 queries. It is broad coverage, not a mathematical guarantee of every product in market.",
};
brief.heroMetrics[0].value = String(brief.coverage.queries);
brief.heroMetrics[1].value = String(brief.coverage.results);
brief.requestIds = exa.searches.map((search) => search.requestId).filter(Boolean);

const queryRows = [
  ...exa.searches.map((search) => ({
    id: search.id,
    source: "main research",
    category: search.category,
    resultCount: search.results?.length ?? 0,
    requestId: search.requestId,
    query: search.query,
  })),
  ...social.searches.map((search) => ({
    id: search.id,
    source: "official/social pass",
    category: "official/social profile",
    resultCount: search.results?.length ?? 0,
    requestId: search.requestId,
    query: search.query,
  })),
  ...(languageGrowthChannelDeepDive.searches ?? []).map((search) => ({
    id: search.id,
    source: "language growth/channel deep-dive",
    category: search.category,
    resultCount: search.results?.length ?? 0,
    requestId: search.requestId,
    query: search.query,
  })),
  ...(languageOfficialSocialDeepDive.searches ?? []).map((search) => ({
    id: `language_official_social_${search.id}`,
    source: "language official/social deep-dive",
    category: "official/social profile",
    resultCount: search.results?.length ?? 0,
    requestId: search.requestId,
    query: search.query,
  })),
];

const byCategory = new Map();
for (const row of queryRows) {
  const item = byCategory.get(row.category) ?? { category: row.category, searches: 0, results: 0 };
  item.searches += 1;
  item.results += row.resultCount;
  byCategory.set(row.category, item);
}

brief.exaQueryMatrix = {
  totalSearches: queryRows.length,
  totalResults: queryRows.reduce((sum, row) => sum + row.resultCount, 0),
  byCategory: [...byCategory.values()].sort((a, b) => b.searches - a.searches || a.category.localeCompare(b.category)),
  rows: queryRows,
};

const categoryEvidenceDefinitions = {
  company: {
    useCase: "产品发现、市场边界、功能定位和 company-level 产品能力判断。",
    outputViews: ["#matrix", "#products", "#evidence"],
    exportFiles: ["competitive-matrix.csv", "product-capability-score.csv", "source-linkage-audit.csv"],
    evidenceObject: "clusters / productCapability / sourceLinkageAudit",
    nextCheck: "继续用 company 查询补长尾候选的官网、功能页和成立/团队信息。",
  },
  news: {
    useCase: "增长信号、融资/发布新闻、近两年时间线和 IRL/线下真人动态。",
    outputViews: ["#funding", "#monitor", "#evidence"],
    exportFiles: ["funding-timeline.csv", "funding-news-review.csv", "funding-event-audit.csv"],
    evidenceObject: "fundingTimeline / fundingSummary / candidateReview",
    nextCheck: "新增新闻先进入 funding event audit，再决定是否升级主时间线。",
  },
  "research paper": {
    useCase: "AI companion、孤独、青少年和线下社交风险/有效性背景。",
    outputViews: ["#evidence"],
    exportFiles: ["executive-brief.md", "completion-audit.md"],
    evidenceObject: "researchSignals",
    nextCheck: "如果出现新政策或研究，优先进入 research/policy monitor lane。",
  },
  "financial report": {
    useCase: "市场规模、下载、收入、访问量、consumer AI 和 app ranking 背景。",
    outputViews: ["#evidence", "#products"],
    exportFiles: ["company-background-review.csv", "product-capability-score.csv"],
    evidenceObject: "financialSignals / companyBackgroundReview",
    nextCheck: "优先把 revenue/download/MAU 口径补到强增长信号产品。",
  },
  people: {
    useCase: "创始人、团队、GTM、招聘和公司背景判断。",
    outputViews: ["#evidence"],
    exportFiles: ["company-background-review.csv"],
    evidenceObject: "peopleSignals / companyBackgroundReview",
    nextCheck: "对高优先级 IRL 和语言交换候选补 founder/team 证据。",
  },
  "official/social profile": {
    useCase: "官网、应用商店、LinkedIn、社区/社媒证据补全。",
    outputViews: ["#matrix", "#evidence"],
    exportFiles: ["official-social-coverage-audit.csv", "competitive-matrix.csv"],
    evidenceObject: "officialSocialEvidence / officialSocialCoverageAudit",
    nextCheck: "针对 official/social coverage audit 的缺口继续补社媒和 LinkedIn。",
  },
};

brief.exaCategoryEvidenceAudit = {
  generatedAt: new Date().toISOString(),
  method:
    "Maps each Exa category used in the research workflow to its query volume, result volume, downstream judgment, rendered views, export artifacts, and next evidence check.",
  totalCategories: brief.exaQueryMatrix.byCategory.length,
  rows: brief.exaQueryMatrix.byCategory.map((item) => {
    const definition = categoryEvidenceDefinitions[item.category] ?? {
      useCase: "补充证据来源。",
      outputViews: ["#playbook"],
      exportFiles: ["source-coverage.csv"],
      evidenceObject: "exaQueryMatrix",
      nextCheck: "视具体缺口决定是否升级。",
    };
    const ids = brief.exaQueryMatrix.rows.filter((row) => row.category === item.category).map((row) => row.id);
    return {
      category: item.category,
      searches: item.searches,
      results: item.results,
      queryIds: ids,
      useCase: definition.useCase,
      outputViews: definition.outputViews,
      exportFiles: definition.exportFiles,
      evidenceObject: definition.evidenceObject,
      nextCheck: definition.nextCheck,
    };
  }),
};

const synthesisOutput = synthesis.response?.output?.content ?? {};
brief.synthesis = {
  requestId: synthesis.response?.requestId,
  generatedAt: synthesis.generatedAt,
  summary: synthesisOutput.summary ?? brief.synthesis?.summary ?? "",
  coreProducts: synthesisOutput.core_products ?? brief.synthesis?.coreProducts ?? [],
  irlProducts: synthesisOutput.irl_products ?? brief.synthesis?.irlProducts ?? [],
  watchlist: synthesisOutput.watchlist ?? brief.synthesis?.watchlist ?? [],
  risks: synthesisOutput.risks ?? brief.synthesis?.risks ?? [],
  note:
    "Generated by Exa deep-lite + outputSchema. Use as synthesis and gap discovery; source quality varies, so key claims should be promoted into core cards only after raw evidence review.",
  grounding: synthesis.response?.output?.citations ?? brief.synthesis?.grounding ?? [],
};

const discoveryScans = discovery.scans ?? [];
function discoveryEvidence(scanId, patterns, limit = 3) {
  const scan = discoveryScans.find((item) => item.id === scanId);
  const matches = (scan?.results ?? []).filter((result) =>
    patterns.some((pattern) => pattern.test(`${result.title} ${result.url} ${result.highlight ?? ""}`)),
  );
  return matches.slice(0, limit).map((result) => ({
    label: result.title,
    url: result.url,
  }));
}

const discoveryReview = [
  {
    name: "Friend",
    lane: "AI friend / wearable companion",
    decision: "边界观察",
    reason: "有硬件和真实世界陪伴叙事，但核心仍是 AI companion，不是真人社交；适合放入 companion/wearable watchlist。",
    evidence: discoveryEvidence("ai_friend_wearables", [/friend/i, /wearable companion/i], 4),
  },
  {
    name: "Bee / Limitless",
    lane: "AI wearable memory assistant",
    decision: "暂缓进入主表",
    reason: "更接近个人记忆/生产力硬件，社交关系链和真人撮合证据弱；保留为 AI device 边界。",
    evidence: discoveryEvidence("ai_friend_wearables", [/bee/i, /limitless/i, /wearable/i], 4),
  },
  {
    name: "SocialAI / Oasiz",
    lane: "AI-native social network",
    decision: "继续观察",
    reason: "属于 AI-native social/互动内容网络，和 Status AI、Butterflies 同类；需补用户增长和留存证据后再升级。",
    evidence: discoveryEvidence("ai_native_social_networks", [/socialai/i, /oasiz/i, /ai social network/i], 4),
  },
  {
    name: "Sitch / AI matchmaking apps",
    lane: "AI dating / matchmaking",
    decision: "候选升级",
    reason: "AI dating、human matchmaking 和反 swipe 趋势相关；下一步应补独立 app、融资额和城市落地证据。",
    evidence: discoveryEvidence("ai_dating_discovery", [/sitch/i, /matchmaking/i, /AI dating/i, /dating assistant/i], 4),
  },
  {
    name: "Tinder Live Events / Bumble Bee",
    lane: "AI dating platform feature",
    decision: "作为平台信号保留",
    reason: "不是新 app，但能证明 dating 平台向 AI assistant、live events、group dating 和 IRL 体验迁移。",
    evidence: discoveryEvidence("ai_dating_discovery", [/tinder/i, /bumble/i, /bee/i], 4),
  },
  {
    name: "Janitor AI / DreamGF / EverAI",
    lane: "AI companion long tail",
    decision: "长尾观察",
    reason: "有 company/category 证据，但多为泛 companion/roleplay，缺少融资和官方规模信号；不宜挤占主表。",
    evidence: discoveryEvidence("companion_long_tail", [/janitor/i, /dreamgf/i, /everai/i], 4),
  },
  {
    name: "Posh / Neario / Eve",
    lane: "IRL social long tail",
    decision: "候选升级",
    reason: "和线下活动、本地朋友、附近发现高度相关；下一步优先补融资、城市覆盖和官方/应用商店证据。",
    evidence: discoveryEvidence("irl_social_long_tail", [/posh/i, /neario/i, /eve/i], 4),
  },
  {
    name: "Lingbe / SpeakyParrot / Fluently",
    lane: "HelloTalk/Tandem long tail",
    decision: "语言交换长尾",
    reason: "补强 HelloTalk/Tandem 相似 app 的长尾覆盖；部分更偏学习工具，需区分真人社交强度。",
    evidence: discoveryEvidence("language_exchange_long_tail", [/lingbe/i, /speakyparrot/i, /fluently/i], 4),
  },
].filter((item) => item.evidence.length > 0);

function firstDiscoveryResult(scanId, patterns) {
  const scan = discoveryScans.find((item) => item.id === scanId);
  return (scan?.results ?? []).find((result) =>
    patterns.some((pattern) => pattern.test(`${result.title} ${result.url} ${result.highlight ?? ""}`)),
  );
}

function firstDiscoveryResultAny(scanIds, patterns) {
  for (const scanId of scanIds) {
    const result = firstDiscoveryResult(scanId, patterns);
    if (result) return result;
  }
  return null;
}

const supplementalFundingNews = [
  {
    date: "2024.07",
    name: "Friend",
    amount: "$5.4M / $99 AI companion necklace",
    lane: "AI friend / wearable companion",
    result: firstDiscoveryResult("ai_friend_wearables", [/Friend.*necklace/i, /Friend.*\$99/i]),
  },
  {
    date: "2024.12",
    name: "Friend",
    amount: "$5.4M additional raise / real-world AI friend",
    lane: "AI friend / wearable companion",
    result: firstDiscoveryResult("ai_friend_wearables", [/raised another \$5\.4/i, /chatbots have issues/i]),
  },
  {
    date: "2025.12",
    name: "Limitless",
    amount: "Meta acquisition",
    lane: "AI wearable memory assistant",
    result: firstDiscoveryResult("ai_friend_wearables", [/Meta acquires/i, /Limitless has been acquired/i]),
  },
  {
    date: "2025.10",
    name: "Oasiz",
    amount: "$2.5M seed",
    lane: "AI-native social / playable content",
    result: firstDiscoveryResult("ai_native_social_networks", [/Oasiz Raises \$2\.5M/i]),
  },
  {
    date: "2026.04",
    name: "AI iMessage social network",
    amount: "$5.1M pre-seed",
    lane: "AI-native social network",
    result: firstDiscoveryResult("ai_native_social_networks", [/iMessage/i, /\$5\.1 million pre-seed/i]),
  },
  {
    date: "2025.06",
    name: "Sitch / AI matchmaking apps",
    amount: "AI + human matchmaking launch/funding signal",
    lane: "AI dating / matchmaking",
    result: firstDiscoveryResult("ai_dating_discovery", [/Sitch/i, /human matchmaking/i, /AI dating/i, /dating assistant/i]),
  },
  {
    date: "2026.05",
    name: "New AI dating app",
    amount: "Nearly $10M raised",
    lane: "AI dating / matchmaking",
    result: firstDiscoveryResult("ai_dating_discovery", [/nearly \$10M/i, /Stanford dropouts/i]),
  },
  {
    date: "2026.03",
    name: "Tinder Live Events",
    amount: "IRL events / virtual speed dating",
    lane: "IRL dating feature",
    result: firstDiscoveryResult("ai_dating_discovery", [/Tinder tries/i, /IRL events/i, /Live Events/i]),
  },
  {
    date: "2026.03",
    name: "Bumble Bee",
    amount: "AI dating assistant",
    lane: "AI dating feature",
    result: firstDiscoveryResult("ai_dating_discovery", [/Bumble introduces/i, /AI dating assistant/i, /Bumble.*Bee/i]),
  },
  {
    date: "2025.03",
    name: "Breeze",
    amount: "IRL dating US launch",
    lane: "IRL dating boundary",
    result: firstDiscoveryResult("ai_dating_discovery", [/Breeze Launches/i, /Taking Online Dates Offline/i]),
  },
  {
    date: "2026.03",
    name: "Posh",
    amount: "$37M Series B",
    lane: "IRL events / social planning",
    result: firstDiscoveryResult("irl_social_funding_expansion", [/Posh lands \$37M/i, /what are we doing tonight/i]),
  },
  {
    date: "2026.02",
    name: "Ditto",
    amount: "$9.2M / real-date college dating",
    lane: "IRL dating / anti-swipe",
    result: firstDiscoveryResult("ai_dating_discovery", [/Ditto raises \$9\.2M/i, /replace swiping with real dates/i]),
  },
  {
    date: "2026.05",
    name: "Known",
    amount: "nearly $10M / AI voice dating app",
    lane: "AI dating / real dates",
    result: firstDiscoveryResultAny(["ai_dating_funding_expansion", "ai_dating_discovery"], [/Stanford.*nearly \$10M/i, /Known.*AI.*dating/i, /raise \$10M.*dating/i]),
  },
  {
    date: "2025.08",
    name: "AI companion apps market",
    amount: "$120M projected 2025 consumer spend",
    lane: "AI companion market metric",
    result: firstDiscoveryResult("ai_companion_funding_expansion", [/AI companion apps.*\$120M/i, /pull in \$120M/i]),
  },
  {
    date: "2026.05",
    name: "Janitor AI",
    amount: "2.5M daily users / 15M total users",
    lane: "AI companion long tail metric",
    result: firstDiscoveryResult("ai_companion_funding_expansion", [/Janitor AI Draws 2\.5M/i, /15 million total users/i]),
  },
  {
    date: "2026.02",
    name: "CandyPlus Studio",
    amount: "3M+ downloads",
    lane: "AI companion long tail",
    result: firstDiscoveryResult("companion_long_tail", [/CandyPlus/i, /3 million downloads/i]),
  },
  {
    date: "2026.05",
    name: "Astrocade",
    amount: "$56M new funding",
    lane: "AI social / interactive entertainment",
    result: firstDiscoveryResult("ai_social_games_funding", [/Astrocade Raises \$56M/i, /interactive entertainment/i]),
  },
].filter((item) => item.result?.url);

function discoveryFundingCandidateReview() {
  const knownNames = [
    ...brief.fundingTimeline.map((item) => item.name),
    ...supplementalFundingNews.map((item) => item.name),
    "Butterflies",
  ];
  const integratedMarketUrls = new Set(
    [
      firstDiscoveryResult("ai_companion_funding_expansion", [/AI companion apps.*\$120M/i, /pull in \$120M/i])?.url,
      firstDiscoveryResult("ai_dating_discovery", [/MTCH 8-K/i, /Direct Revenue/i, /product roadmaps/i])?.url,
    ].filter(Boolean),
  );
  const lowConfidenceMarketUrls = new Set([
    "https://aiinsightsnews.net/how-ai-companion-apps-make-money/",
  ]);
  const resolvedStatusByUrl = new Map([
    [
      "https://www.globenewswire.com/news-release/2026/02/03/3231154/0/en/Ditto-raises-9-2M-to-replace-swiping-with-real-dates-for-college-students.html",
      {
        handlingStatus: "已覆盖/重复佐证",
        nextAction: "Ditto 已作为 real-date / anti-swipe dating 补充事件进入 supplemental funding/news；该来源保留为重复佐证，不再进入候选升级队列。",
      },
    ],
    [
      "https://techfundingnews.com/ditto-9-2m-seed-peak-xv-ai-college-dates/",
      {
        handlingStatus: "已覆盖/重复佐证",
        nextAction: "Ditto $9.2M 已由更强来源进入补充融资新闻；该媒体来源保留为重复佐证。",
      },
    ],
    [
      "https://newsx.io/2026/02/26/consumer-ai-startup-companion-labs-raises-2-5m-to-create-interactive-local-language-entertainment-experiences-in-india/",
      {
        handlingStatus: "边界留档",
        nextAction: "Companion Labs 更偏本地语言互动娱乐内容，不足以升级为核心 consumer social 或 IRL 样本；保留为 AI entertainment 边界融资样本。",
      },
    ],
    [
      "https://techcrunch.com/2026/05/24/i-tried-amazons-bee-wearable-and-am-both-intrigued-and-slightly-creeped-out/",
      {
        handlingStatus: "边界留档",
        nextAction: "Bee 是 Amazon 收购后的 wearable memory/assistant 体验，保留为 AI wearable 边界，不进入核心融资或产品升级队列。",
      },
    ],
    [
      "https://thebridge.jp/en/2026/01/sukidayo-ai-couple-app-riamo-secures-seed-funding",
      {
        handlingStatus: "边界留档",
        nextAction: "Riamo 是 AI couple/companion app 的区域性 seed funding 信号，先保留为 companion 边界融资样本，待补更强用户规模和社交机制后再升级。",
      },
    ],
    [
      "https://techcrunch.com/2024/07/29/former-squad-and-twitter-execs-raise-7m-to-build-a-hardware-ai-assistant/",
      {
        handlingStatus: "边界留档",
        nextAction: "保留为 AI wearable companion 的边界融资样本，不进入核心 AI 社交/IRL 融资升级队列。",
      },
    ],
    [
      "https://www.globaldatinginsights.com/featured/ai-dating-app-sitch-raises-2m-launches-matchmaker-chatbot/",
      {
        handlingStatus: "已覆盖/重复佐证",
        nextAction: "Sitch 已作为 AI dating / human matchmaking 的补充融资/发布信号留档；该来源保留为重复佐证，不再进入候选升级队列。",
      },
    ],
    [
      "https://www.m13.co/article/sitch-launches-ai-matchmaking-app-to-reinvent-modern-dating",
      {
        handlingStatus: "已覆盖/重复佐证",
        nextAction: "Sitch 已作为 AI dating / human matchmaking 的补充融资/发布信号留档；该来源保留为重复佐证，不再进入候选升级队列。",
      },
    ],
  ]);
  const amountPattern = /(\$\s?[\d.]+\s?(?:m|million|b|billion)|€\s?[\d.]+\s?(?:m|million)|¥\s?[\d.]+|[\d.]+\s?(?:million|m)\s+(?:users|downloads|daily users|total users)|series\s+[abc]|seed|pre-seed|raises?|funding|acquires?|acquisition|consumer spending|revenue)/i;
  const newsScans = discoveryScans.filter((scan) => scan.category === "news");
  const rows = newsScans.flatMap((scan) =>
    (scan.results ?? []).map((result) => {
      const text = `${result.title} ${result.url} ${result.highlight ?? ""}`;
      const amountMention = text.match(amountPattern)?.[0] ?? "";
      if (!amountMention) return null;
      const matchedKnown = knownNames.find((name) =>
        String(name)
          .split("/")
          .map((part) => part.trim())
          .filter(Boolean)
          .some((part) => new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text)),
      );
      const publishedMonth = result.publishedDate ? result.publishedDate.slice(0, 7).replace("-", ".") : "";
      const candidateName = matchedKnown ?? result.title.replace(/\s+\|.*$/, "").replace(/\s+-\s+.*$/, "").slice(0, 90);
      const lane =
        /dating/i.test(scan.id)
          ? "AI dating / IRL dating"
          : /irl/i.test(scan.id)
            ? "IRL / offline social"
            : /companion/i.test(scan.id)
              ? "AI companion"
          : /games|native_social/i.test(scan.id)
            ? "AI social / entertainment"
            : scan.label;
      const marketBackground = integratedMarketUrls.has(result.url);
      const lowConfidenceMarket = lowConfidenceMarketUrls.has(result.url);
      const override = resolvedStatusByUrl.get(result.url);
      const handlingStatus = override
        ? override.handlingStatus
        : matchedKnown
          ? "已覆盖/重复佐证"
          : marketBackground
            ? "已并入市场判断"
            : lowConfidenceMarket
              ? "低可信市场口径留档"
              : "待复核候选";
      return {
        scanId: scan.id,
        scanLabel: scan.label,
        candidateName,
        publishedMonth,
        lane,
        amountMention,
        handlingStatus,
        nextAction:
          override?.nextAction ??
          (handlingStatus === "已覆盖/重复佐证"
            ? "保留为现有主时间线或补充候选的佐证来源。"
            : handlingStatus === "已并入市场判断"
              ? "作为 financial/market 背景口径保留，不计入产品融资总额。"
              : handlingStatus === "低可信市场口径留档"
                ? "仅作为低可信市场/商业化参考留档；不进入候选升级队列，不计入融资总额。"
                : handlingStatus === "边界留档"
                  ? "保留为边界融资样本，不进入核心升级队列。"
                  : "复核公司/产品边界、金额口径和是否应升级进补充融资新闻或主时间线。"),
        title: result.title,
        url: result.url,
        highlight: result.highlight,
      };
    }).filter(Boolean),
  );
  const deduped = [...new Map(rows.map((row) => [row.url, row])).values()];
  return deduped.sort((a, b) => {
    const statusOrder = { "待复核候选": 0, "边界留档": 1, "已并入市场判断": 2, "低可信市场口径留档": 3, "已覆盖/重复佐证": 4 };
    return (statusOrder[a.handlingStatus] ?? 9) - (statusOrder[b.handlingStatus] ?? 9) || b.publishedMonth.localeCompare(a.publishedMonth) || a.candidateName.localeCompare(b.candidateName);
  });
}

const fundingCandidateReview = discoveryFundingCandidateReview();

const coreProductNames = new Set(brief.clusters.flatMap((cluster) => cluster.items.map((item) => item.name.toLowerCase())));
function languageLongTailDecision(result) {
  const text = `${result.title} ${result.highlight ?? ""}`;
  if (coreProductNames.has(result.title.toLowerCase())) {
    return {
      decision: "已入主表",
      reason: "该产品已经在 HelloTalk/Tandem 相邻主表里，保留在长尾复核中作为覆盖证明。",
    };
  }
  if (/native speaker|connect|friends|face to face|voice chat|language exchange|proximity|worldwide/i.test(text)) {
    return {
      decision: "候选补证",
      reason: "Exa 长尾结果显示有真人语伴、连接或语言交换属性，但还需要官网/应用商店/社媒证据后再决定是否升级进主表。",
    };
  }
  return {
    decision: "学习工具边界",
    reason: "结果更偏内容学习或课程工具，真人社交/语伴证据弱；保留为边界样本，不直接升级。",
  };
}

const discoveryLanguageLongTailReview = (discoveryScans.find((scan) => scan.id === "language_exchange_long_tail")?.results ?? []).map((result) => {
  const review = languageLongTailDecision(result);
  return {
    name: result.title,
    source: "Exa discovery · language_exchange_long_tail",
    decision: review.decision,
    reason: review.reason,
    publishedDate: result.publishedDate,
    highlight: result.highlight,
    evidence: [
      {
        label: result.title,
        url: result.url,
      },
    ],
  };
});

const candidateDeepDiveLanguageReview = (candidateDeepDive.candidates ?? [])
  .filter((candidate) => /language_exchange|new_language/i.test(candidate.sourceQueryId ?? ""))
  .map((candidate) => {
    const search = (candidateDeepDive.searches ?? []).find((item) => item.id === `${candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}_company`);
    const result = search?.results?.find((item) => item.url === candidate.seedUrl) ?? search?.results?.[0];
    const decision = candidateDeepDiveDecision(candidate.name);
    return {
      name: candidate.name,
      source: `candidate deep-dive · ${candidate.sourceQueryId}`,
      decision: decision.decision,
      reason:
        decision.decision === "继续观察" || decision.decision === "候选补证"
          ? `candidate deep-dive 已确认存在语言交换/真人语伴相关证据，但仍需进一步补齐官网、商店、社媒和增长信号后再决定是否升级主表。 / ${decision.reason}`
          : `candidate deep-dive 已复核为边界或暂缓项，不进入主表候选升级队列。 / ${decision.reason}`,
      publishedDate: result?.publishedDate ?? "",
      highlight: result?.highlight ?? "",
      evidence: [
        {
          label: result?.title ?? candidate.name,
          url: result?.url ?? candidate.seedUrl,
        },
      ],
    };
  });

function lingopraxisTargetedReviewRows() {
  const resultByUrl = new Map();
  for (const search of lingopraxisDeepDive.searches ?? []) {
    for (const result of search.results ?? []) {
      if (!/lingopraxis/i.test(`${result.title} ${result.url} ${result.highlight ?? ""}`)) continue;
      const current = resultByUrl.get(result.url);
      resultByUrl.set(result.url, {
        label: result.title,
        url: result.url,
        category: search.category,
        highlight: result.highlight,
        publishedDate: result.publishedDate ?? current?.publishedDate ?? "",
      });
    }
  }
  const evidence = [...resultByUrl.values()].slice(0, 6);
  if (!evidence.length) return [];
  return [
    {
      name: "LingoPraxis",
      source: "targeted Exa pass · lingopraxis",
      decision: "长尾留档",
      reason:
        "targeted Exa company/news pass 证明其有官网、App Store / Google Play、Telegram bot 和 peer-to-peer speaking club 属性，但未找到融资、强增长、社媒声量或开放消费社交规模信号；作为 HelloTalk/Tandem 长尾覆盖保留，不升级主矩阵。",
      publishedDate: evidence.find((item) => item.publishedDate)?.publishedDate ?? "",
      highlight: evidence.map((item) => item.highlight).filter(Boolean).join(" / ").slice(0, 520),
      evidence,
    },
  ];
}

const languageLongTailReview = [
  ...discoveryLanguageLongTailReview,
  ...candidateDeepDiveLanguageReview,
  ...lingopraxisTargetedReviewRows(),
];

brief.discoveryScan = {
  generatedAt: discovery.generatedAt ?? null,
  purpose:
    discovery.purpose ??
    "Additional broad discovery scan for blind spots beyond the curated core table.",
  totalScans: discoveryScans.length,
  totalResults: discoveryScans.reduce((sum, scan) => sum + (scan.results?.length ?? 0), 0),
  requestIds: discoveryScans.map((scan) => scan.requestId).filter(Boolean),
  reviewItems: discoveryReview,
  languageLongTailReview,
  supplementalFundingNews: supplementalFundingNews.map((item) => ({
    date: item.date,
    name: item.name,
    amount: item.amount,
    lane: item.lane,
    url: item.result.url,
    title: item.result.title,
    highlight: item.result.highlight,
  })),
  fundingCandidateReview,
  fundingCandidateRows: fundingCandidateReview.length,
  fundingCandidatePendingRows: fundingCandidateReview.filter((item) => item.handlingStatus === "待复核候选").length,
  groups: discoveryScans.map((scan) => ({
    id: scan.id,
    label: scan.label,
    category: scan.category,
    requestId: scan.requestId,
    resultCount: scan.results?.length ?? 0,
    query: scan.query,
    notableResults: (scan.results ?? []).slice(0, 4).map((result) => ({
      title: result.title,
      url: result.url,
      publishedDate: result.publishedDate,
      highlight: result.highlight,
    })),
  })),
};

const promotedMarketSignals = [
  {
    name: "AI companion apps market",
    signal:
      "TechCrunch / Appfigures 报道显示 AI companion 应用 2025 年预计消费者支出约 $120M，活跃营收应用数量和新发应用数量都在上升。",
    metric: "$120M projected 2025 consumer spend; 337 active revenue-generating AI companion apps",
    interpretation:
      "这是赛道商业化口径，不是单一产品融资；用于校准 companion/roleplay 产品的市场需求和付费能力，不能重复计入融资总额。",
    result: firstDiscoveryResult("ai_companion_funding_expansion", [/AI companion apps.*\$120M/i, /pull in \$120M/i]),
  },
  {
    name: "Match Group / AI dating transition",
    signal:
      "Match Group 2026 8-K / shareholder materials 披露 Tinder、Hinge 等产品路线调整和收入压力，同时强调 2026 产品路线图与 AI/产品体验重构。",
    metric: "SEC 8-K / direct revenue pressure and 2026 product roadmap",
    interpretation:
      "这是 dating 市场从 swipe/订阅模型转向 AI assistant、IRL events 和更高质量匹配的上市公司背景口径。",
    result: firstDiscoveryResult("ai_dating_discovery", [/MTCH 8-K/i, /Direct Revenue/i, /product roadmaps/i]),
  },
].filter((item) => item.result?.url);

const existingFinancialUrls = new Set((brief.financialSignals ?? []).flatMap((item) => (item.evidence ?? []).map((evidence) => evidence.url)));
brief.financialSignals = [
  ...(brief.financialSignals ?? []),
  ...promotedMarketSignals
    .filter((item) => !existingFinancialUrls.has(item.result.url))
    .map((item) => ({
      name: item.name,
      signal: item.signal,
      metric: item.metric,
      interpretation: item.interpretation,
      evidence: [
        {
          label: item.result.title,
          url: item.result.url,
        },
      ],
    })),
];

function yearOf(date) {
  return String(date).slice(0, 4);
}

function laneGroup(lane) {
  if (/IRL/i.test(lane)) return "IRL / offline human social";
  if (/China/i.test(lane)) return "China AI companion export";
  if (/dating/i.test(lane)) return "AI dating features";
  if (/companion/i.test(lane)) return "AI companion";
  if (/character|roleplay/i.test(lane)) return "AI character / roleplay";
  if (/social|messaging|entertainment/i.test(lane)) return "AI social / entertainment";
  return "Other";
}

function usdAmountM(amount) {
  const match = String(amount).match(/\$\s?([\d.]+)\s?M/i);
  return match ? Number(match[1]) : null;
}

function normalizedEventName(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/\s*\/\s*/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(ai|app|apps|live|events|feature|features|assistant|launch|funding|news)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fundingDedupKey(event) {
  const name = normalizedEventName(event.name);
  if (/tinder/.test(name)) return "tinder";
  if (/bumble|bee/.test(name)) return "bumble-bee";
  if (/breeze/.test(name)) return "breeze";
  if (/friend/.test(name)) return `friend-${String(event.date).slice(0, 7)}`;
  return `${name}-${String(event.date).slice(0, 7)}`;
}

function fundingDedupAudit(mainEvents, supplementalEvents) {
  const rows = [
    ...mainEvents.map((event) => ({ ...event, source: "core timeline", sourcePriority: 0 })),
    ...supplementalEvents.map((event) => ({ ...event, source: "supplemental discovery", sourcePriority: 1 })),
  ].map((event) => ({
    key: fundingDedupKey(event),
    source: event.source,
    sourcePriority: event.sourcePriority,
    date: event.date,
    name: event.name,
    amount: event.amount,
    lane: event.lane,
    url: event.url,
  }));

  const grouped = new Map();
  for (const row of rows) {
    const group = grouped.get(row.key) ?? [];
    group.push(row);
    grouped.set(row.key, group);
  }

  const uniqueRows = [...grouped.values()].map((group) =>
    [...group].sort((a, b) => a.sourcePriority - b.sourcePriority || String(b.date).localeCompare(String(a.date)))[0],
  );
  const duplicateGroups = [...grouped.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({
      key,
      count: group.length,
      kept: [...group].sort((a, b) => a.sourcePriority - b.sourcePriority || String(b.date).localeCompare(String(a.date)))[0],
      duplicates: group,
    }));

  return {
    method:
      "Dedupe key is normalized product/event name plus month; known cross-source aliases such as Bumble Bee, Tinder Live Events, and Breeze are collapsed, with core timeline rows preferred over supplemental discovery rows.",
    rawCombinedEvents: rows.length,
    uniqueEvents: uniqueRows.length,
    duplicateEvents: rows.length - uniqueRows.length,
    duplicateGroups,
    rows: rows.map((row) => ({
      ...row,
      duplicateGroupSize: grouped.get(row.key)?.length ?? 1,
      keptInUniqueCount: uniqueRows.some((unique) => unique.key === row.key && unique.url === row.url),
    })),
  };
}

function periodBounds(date) {
  const text = String(date ?? "").trim();
  const match = text.match(/^(\d{4})(?:\.(\d{2}))?/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = match[2] ? Number(match[2]) : null;
  if (month !== null && (month < 1 || month > 12)) return null;
  return {
    label: text,
    precision: month === null ? "year" : "month",
    start: year * 12 + (month ?? 1),
    end: year * 12 + (month ?? 12),
  };
}

function dateWindowAudit(events, windowStart, windowEnd) {
  const start = periodBounds(windowStart);
  const end = periodBounds(windowEnd);
  const rows = events.map((event) => {
    const bounds = periodBounds(event.date);
    const inWindow = Boolean(bounds && bounds.end >= start.start && bounds.start <= end.end);
    return {
      name: event.name,
      date: event.date,
      precision: bounds?.precision ?? "unknown",
      inWindow,
      url: event.url,
    };
  });
  return {
    windowStart,
    windowEnd,
    total: rows.length,
    inWindow: rows.filter((row) => row.inWindow).length,
    outOfWindow: rows.filter((row) => !row.inWindow),
    yearOnly: rows.filter((row) => row.precision === "year").map((row) => row.name),
  };
}

const yearCounts = {};
const laneCounts = {};
const irlEvents = [];
const usdFunding = [];
const nonFunding = [];
for (const event of brief.fundingTimeline) {
  yearCounts[yearOf(event.date)] = (yearCounts[yearOf(event.date)] ?? 0) + 1;
  const group = laneGroup(event.lane);
  laneCounts[group] = (laneCounts[group] ?? 0) + 1;
  if (/IRL/i.test(event.lane)) irlEvents.push(event.name);
  const amountM = usdAmountM(event.amount);
  if (amountM !== null) {
    usdFunding.push({ name: event.name, amountM, label: event.amount, lane: event.lane, url: event.url });
  } else {
    nonFunding.push({ name: event.name, amount: event.amount, lane: event.lane, url: event.url });
  }
}

const fundingWindowStart = "2024.06";
const fundingWindowEnd = "2026.06";
const fundingExactWindowStart = "2024-06-02";
const fundingExactWindowEnd = "2026-06-02";
const mainDateWindowAudit = dateWindowAudit(brief.fundingTimeline, fundingWindowStart, fundingWindowEnd);
const supplementalDateWindowAudit = dateWindowAudit(brief.discoveryScan.supplementalFundingNews, fundingWindowStart, fundingWindowEnd);
const fundingNewsDedupAudit = fundingDedupAudit(brief.fundingTimeline, brief.discoveryScan.supplementalFundingNews);

brief.fundingSummary = {
  totalEvents: brief.fundingTimeline.length,
  supplementalEvents: brief.discoveryScan.supplementalFundingNews.length,
  combinedEvents: brief.fundingTimeline.length + brief.discoveryScan.supplementalFundingNews.length,
  uniqueCombinedEvents: fundingNewsDedupAudit.uniqueEvents,
  duplicateCombinedEvents: fundingNewsDedupAudit.duplicateEvents,
  duplicateGroups: fundingNewsDedupAudit.duplicateGroups.length,
  dedupAudit: fundingNewsDedupAudit,
  yearRange: `${fundingWindowStart} - ${fundingWindowEnd}`,
  dateWindowAudit: {
    windowStart: fundingWindowStart,
    windowEnd: fundingWindowEnd,
    exactWindowStart: fundingExactWindowStart,
    exactWindowEnd: fundingExactWindowEnd,
    precisionNote:
      "The user-facing near-two-year window is anchored to 2026-06-02. Most funding/news evidence is month-level, so inclusion is audited by month bounds while exact day bounds are retained for interpretation.",
    main: mainDateWindowAudit,
    supplemental: supplementalDateWindowAudit,
    outOfWindowTotal: mainDateWindowAudit.outOfWindow.length + supplementalDateWindowAudit.outOfWindow.length,
  },
  irlEvents: irlEvents.length,
  irlShare: `${Math.round((irlEvents.length / brief.fundingTimeline.length) * 100)}%`,
  explicitUsdFundingEvents: usdFunding.length,
  explicitUsdFundingM: Number(usdFunding.reduce((sum, item) => sum + item.amountM, 0).toFixed(1)),
  caveat:
    "美元融资总额只统计主时间线 amount 字段中明确出现 $XM 的事件；supplemental funding/news 是盲区扫描发现的候选事件，单独统计、人工复核后再升级进主时间线。",
  byYear: Object.entries(yearCounts).map(([year, count]) => ({ year, count })).sort((a, b) => a.year.localeCompare(b.year)),
  byLane: Object.entries(laneCounts).map(([lane, count]) => ({ lane, count })).sort((a, b) => b.count - a.count),
  topUsdRounds: usdFunding.sort((a, b) => b.amountM - a.amountM).slice(0, 6),
  notableNonFunding: nonFunding.slice(0, 8),
  irlNames: irlEvents,
};

function sourceTypeForFundingUrl(url = "") {
  const value = String(url).toLowerCase();
  if (/businesswire|prnewswire|globenewswire|press-release/.test(value)) return "press release";
  if (/techcrunch|verge|bloomberg|geekwire|independent|forbes|businessinsider|thebridge|baijing|news\.qq/.test(value)) return "media/news";
  if (/signalbase|finsmes|svpost|startupxo/.test(value)) return "funding database/news";
  if (/weroad\.com|blog/.test(value)) return "company/blog";
  return "web source";
}

function amountType(amount = "") {
  const text = String(amount).toLowerCase();
  if (/projected|consumer spend|market metric|revenue|收入|营收|访问量|downloads|daily users|total users|用户|未融资/.test(text)) return "business/news metric";
  if (/\$\s?[\d.]+\s?m/.test(text)) return "explicit USD funding";
  if (/¥|人民币|万元|亿元/.test(text)) return "non-USD funding/revenue";
  if (/acquisition|收购/.test(text)) return "M&A";
  if (/launch|上线|news|assistant|events|dating/.test(text)) return "business/news metric";
  return "non-funding news";
}

function fundingEventAudit() {
  const dateAuditByNameDate = new Map(
    [
      ...mainDateWindowAudit.outOfWindow,
      ...mainDateWindowAudit.yearOnly.map((name) => ({ name, precision: "year", inWindow: true })),
      ...mainDateWindowAudit.outOfWindow,
      ...supplementalDateWindowAudit.outOfWindow,
      ...supplementalDateWindowAudit.yearOnly.map((name) => ({ name, precision: "year", inWindow: true })),
    ].map((item) => [`${item.name}:${item.date ?? ""}`, item]),
  );

  const keptSignatureByKey = new Map(
    (fundingNewsDedupAudit.duplicateGroups ?? []).map((group) => [
      group.key,
      `${group.kept.source}::${group.kept.date}::${group.kept.name}::${group.kept.url}`,
    ]),
  );

  const rows = fundingNewsDedupAudit.rows.map((item) => {
    const bounds = periodBounds(item.date);
    const inWindow = Boolean(bounds && bounds.end >= periodBounds(fundingWindowStart).start && bounds.start <= periodBounds(fundingWindowEnd).end);
    const lane = laneGroup(item.lane);
    const irlRelated = lane === "IRL / offline human social" || /irl|offline|dating|travel|events|real-world|human/i.test(`${item.lane} ${item.amount}`);
    const amountClass = amountType(item.amount);
    const usdM = amountClass === "explicit USD funding" ? usdAmountM(item.amount) : null;
    const precision = dateAuditByNameDate.get(`${item.name}:${item.date}`)?.precision ?? bounds?.precision ?? "unknown";
    const signature = `${item.source}::${item.date}::${item.name}::${item.url}`;
    const keptInUniqueCount = keptSignatureByKey.has(item.key) ? keptSignatureByKey.get(item.key) === signature : true;
    return {
      key: item.key,
      source: item.source,
      date: item.date,
      datePrecision: precision,
      inWindow,
      name: item.name,
      amount: item.amount,
      amountType: amountClass,
      explicitUsdM: usdM,
      lane: item.lane,
      normalizedLane: lane,
      irlRelated,
      sourceType: sourceTypeForFundingUrl(item.url),
      duplicateGroupSize: item.duplicateGroupSize,
      keptInUniqueCount,
      conclusion:
        keptInUniqueCount && item.source === "core timeline"
          ? "计入主时间线结论"
          : keptInUniqueCount
            ? "计入唯一候选事件"
            : "重复行，仅留作来源佐证",
      url: item.url,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    method:
      "Event-level audit across core timeline and supplemental discovery rows. Each row records date precision, near-two-year window status, dedupe inclusion, amount type, explicit USD value, source type, and IRL/offline-human relevance.",
    totalRows: rows.length,
    uniqueRows: rows.filter((row) => row.keptInUniqueCount).length,
    coreRows: rows.filter((row) => row.source === "core timeline").length,
    supplementalRows: rows.filter((row) => row.source === "supplemental discovery").length,
    irlRows: rows.filter((row) => row.irlRelated && row.keptInUniqueCount).length,
    explicitUsdRows: rows.filter((row) => row.explicitUsdM !== null && row.keptInUniqueCount).length,
    yearOnlyRows: rows.filter((row) => row.datePrecision === "year").length,
    outOfWindowRows: rows.filter((row) => !row.inWindow).length,
    byAmountType: Object.values(rows.reduce((acc, row) => {
      acc[row.amountType] ??= { type: row.amountType, count: 0 };
      acc[row.amountType].count += 1;
      return acc;
    }, {})).sort((a, b) => b.count - a.count || a.type.localeCompare(b.type)),
    bySourceType: Object.values(rows.reduce((acc, row) => {
      acc[row.sourceType] ??= { type: row.sourceType, count: 0 };
      acc[row.sourceType].count += 1;
      return acc;
    }, {})).sort((a, b) => b.count - a.count || a.type.localeCompare(b.type)),
    rows,
  };
}

brief.fundingEventAudit = fundingEventAudit();

function fundingUpgradeMap() {
  const auditRows = brief.fundingEventAudit?.rows ?? [];
  const coreByKey = new Map(auditRows.filter((row) => row.source === "core timeline").map((row) => [row.key, row]));
  const rows = auditRows
    .filter((row) => row.source === "supplemental discovery")
    .map((row) => {
      const coreMatch = coreByKey.get(row.key);
      const upgradeStatus = row.keptInUniqueCount
        ? row.irlRelated
          ? "候选保留：IRL/线下真人相关"
          : "候选保留：AI 社交/泛娱乐相关"
        : "重复佐证：主时间线已覆盖";
      const targetView = row.keptInUniqueCount ? "#funding supplemental" : "#funding duplicate evidence";
      const nextAction = row.keptInUniqueCount
        ? row.explicitUsdM !== null
          ? "保留为补充候选融资事件；下一轮若出现更强官方/媒体来源，可升级主时间线。"
          : "保留为补充候选新闻；下一轮需确认产品主体、日期和是否有融资/增长指标。"
        : `不重复计数；作为 ${coreMatch?.name ?? row.name} 的补充证据来源保留。`;
      return {
        key: row.key,
        name: row.name,
        date: row.date,
        amount: row.amount,
        lane: row.lane,
        normalizedLane: row.normalizedLane,
        upgradeStatus,
        keptInUniqueCount: row.keptInUniqueCount,
        duplicateOf: coreMatch?.name ?? "",
        duplicateOfUrl: coreMatch?.url ?? "",
        irlRelated: row.irlRelated,
        explicitUsdM: row.explicitUsdM,
        amountType: row.amountType,
        sourceType: row.sourceType,
        targetView,
        nextAction,
        url: row.url,
      };
    });

  return {
    generatedAt: new Date().toISOString(),
    method:
      "Maps supplemental funding/news rows to their upgrade handling: unique candidates remain in supplemental review, duplicate rows become supporting evidence for core timeline events, and IRL/offline-human relevance is preserved.",
    totalRows: rows.length,
    retainedCandidates: rows.filter((row) => row.keptInUniqueCount).length,
    duplicateEvidenceRows: rows.filter((row) => !row.keptInUniqueCount).length,
    irlCandidateRows: rows.filter((row) => row.irlRelated && row.keptInUniqueCount).length,
    explicitUsdCandidateRows: rows.filter((row) => row.explicitUsdM !== null && row.keptInUniqueCount).length,
    byStatus: Object.values(rows.reduce((acc, row) => {
      acc[row.upgradeStatus] ??= { status: row.upgradeStatus, count: 0 };
      acc[row.upgradeStatus].count += 1;
      return acc;
    }, {})).sort((a, b) => b.count - a.count || a.status.localeCompare(b.status)),
    rows,
  };
}

brief.fundingUpgradeMap = fundingUpgradeMap();

function latestFundingDate(rows) {
  return rows
    .map((row) => ({ row, bounds: periodBounds(row.date) }))
    .filter((item) => item.bounds)
    .sort((a, b) => b.bounds.end - a.bounds.end)[0]?.row.date ?? "";
}

function fundingProductRollup() {
  const auditRows = brief.fundingEventAudit?.rows ?? [];
  const keptRows = auditRows.filter((row) => row.keptInUniqueCount);
  const rowsByName = keptRows.reduce((acc, row) => {
    acc[row.name] ??= [];
    acc[row.name].push(row);
    return acc;
  }, {});
  const rows = Object.entries(rowsByName).map(([name, rowsForName]) => {
    const supportingEvidenceRows = auditRows.filter((row) => row.name === name && !row.keptInUniqueCount).length;
    const explicitUsdM = Number(
      rowsForName
        .filter((row) => row.explicitUsdM !== null)
        .reduce((sum, row) => sum + row.explicitUsdM, 0)
        .toFixed(1),
    );
    const laneCounts = rowsForName.reduce((acc, row) => {
      acc[row.normalizedLane] = (acc[row.normalizedLane] ?? 0) + 1;
      return acc;
    }, {});
    const dominantLane = Object.entries(laneCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "";
    const evidence = rowsForName.map((row) => ({
      label: `${row.date} ${row.amount}`,
      url: row.url,
    }));
    const latestDate = latestFundingDate(rowsForName);
    return {
      name,
      dominantLane,
      eventCount: rowsForName.length,
      coreEventCount: rowsForName.filter((row) => row.source === "core timeline").length,
      supplementalEventCount: rowsForName.filter((row) => row.source === "supplemental discovery").length,
      supportingEvidenceRows,
      explicitUsdEvents: rowsForName.filter((row) => row.explicitUsdM !== null).length,
      explicitUsdM,
      irlRelated: rowsForName.some((row) => row.irlRelated),
      latestDate,
      amountTypes: [...new Set(rowsForName.map((row) => row.amountType))],
      sourceTypes: [...new Set(rowsForName.map((row) => row.sourceType))],
      conclusion:
        explicitUsdM > 0
          ? `近两年明确美元融资约 $${explicitUsdM}M，${rowsForName.some((row) => row.irlRelated) ? "包含 IRL/线下真人方向。" : "属于 AI 社交/泛娱乐或 companion 方向。"}`
          : rowsForName.some((row) => row.amountType === "business/news metric")
            ? "近两年有业务/上线/收入或访问量新闻，但不是明确美元融资事件。"
            : "近两年有补充候选或非美元/非融资类事件，需继续复核金额口径。",
      evidence,
    };
  }).sort((a, b) => b.explicitUsdM - a.explicitUsdM || b.eventCount - a.eventCount || a.name.localeCompare(b.name));

  return {
    generatedAt: new Date().toISOString(),
    method:
      "Aggregates the deduped funding/news event audit by product or company. Unique kept rows count toward event totals; duplicate rows are retained only as supporting evidence.",
    totalProducts: rows.length,
    irlProducts: rows.filter((row) => row.irlRelated).length,
    productsWithExplicitUsd: rows.filter((row) => row.explicitUsdM > 0).length,
    explicitUsdFundingM: Number(rows.reduce((sum, row) => sum + row.explicitUsdM, 0).toFixed(1)),
    topProducts: rows.slice(0, 8).map((row) => ({
      name: row.name,
      dominantLane: row.dominantLane,
      eventCount: row.eventCount,
      explicitUsdM: row.explicitUsdM,
      irlRelated: row.irlRelated,
      latestDate: row.latestDate,
    })),
    byLane: Object.values(rows.reduce((acc, row) => {
      acc[row.dominantLane] ??= { lane: row.dominantLane, products: 0, events: 0, explicitUsdM: 0 };
      acc[row.dominantLane].products += 1;
      acc[row.dominantLane].events += row.eventCount;
      acc[row.dominantLane].explicitUsdM = Number((acc[row.dominantLane].explicitUsdM + row.explicitUsdM).toFixed(1));
      return acc;
    }, {})).sort((a, b) => b.explicitUsdM - a.explicitUsdM || b.events - a.events || a.lane.localeCompare(b.lane)),
    rows,
  };
}

brief.fundingProductRollup = fundingProductRollup();
brief.fundingIntegritySummary = {
  generatedAt: new Date().toISOString(),
  status: brief.fundingEventAudit.outOfWindowRows === 0 ? "window-clean" : "needs-window-review",
  exactWindow: `${brief.fundingSummary.dateWindowAudit.exactWindowStart} - ${brief.fundingSummary.dateWindowAudit.exactWindowEnd}`,
  monthWindow: `${brief.fundingSummary.dateWindowAudit.windowStart} - ${brief.fundingSummary.dateWindowAudit.windowEnd}`,
  precisionNote: brief.fundingSummary.dateWindowAudit.precisionNote,
  coreTimelineRows: brief.fundingEventAudit.coreRows,
  supplementalRows: brief.fundingEventAudit.supplementalRows,
  combinedRows: brief.fundingEventAudit.totalRows,
  uniqueRows: brief.fundingEventAudit.uniqueRows,
  duplicateRows: brief.fundingSummary.duplicateCombinedEvents,
  duplicateGroups: brief.fundingSummary.duplicateGroups,
  outOfWindowRows: brief.fundingEventAudit.outOfWindowRows,
  yearOnlyRows: brief.fundingEventAudit.yearOnlyRows,
  irlUniqueRows: brief.fundingEventAudit.irlRows,
  explicitUsdRows: brief.fundingEventAudit.explicitUsdRows,
  mainTimelineUsdM: brief.fundingSummary.explicitUsdFundingM,
  productRollupRows: brief.fundingProductRollup.totalProducts,
  productRollupIrlRows: brief.fundingProductRollup.irlProducts,
  productRollupUsdM: brief.fundingProductRollup.explicitUsdFundingM,
  claim:
    "All retained funding/news rows are inside the audited near-two-year window; duplicate rows are retained as supporting evidence, not double-counted as unique events.",
};

const productNameLookup = brief.clusters.flatMap((cluster) =>
  cluster.items.map((item) => ({ name: item.name, cluster: cluster.title, clusterId: cluster.id })),
);

function officialLabelForUrl(url = "") {
  const value = String(url).toLowerCase();
  if (value.includes("apps.apple.com")) return "App Store";
  if (value.includes("play.google.com")) return "Google Play";
  if (value.includes("linkedin.com")) return "LinkedIn";
  if (value.includes("instagram.com")) return "Instagram";
  if (value.includes("tiktok.com")) return "TikTok";
  if (value.includes("discord")) return "Discord";
  if (value.includes("threads.com")) return "Threads";
  if (value.includes("x.com") || value.includes("twitter.com")) return "X/Twitter";
  if (value.includes("facebook.com")) return "Facebook";
  if (value.includes("youtube.com")) return "YouTube";
  if (/techcrunch|businesswire|prnewswire|globenewswire|crunchbase|signalbase|svpost|forbes|venturebeat|eater|appbrain|app-download|vidaselect|cbinsights|ycombinator|businessinsider|independent|foxbusiness|news|report|rankings|market/.test(value)) return "新闻/第三方";
  return "官网";
}

function evidenceTextForMatch(result) {
  return [
    result.title,
    result.url,
    result.author,
    result.publishedDate,
    ...(result.highlights ?? []),
    result.highlight,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function evidenceIdentityText(result) {
  return [result.title, result.url, result.author]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function officialAliasMatches(aliases, text) {
  return aliases.some((alias) => {
    if (alias === "222") return /(^|[^0-9])222([^0-9]|$)|222place|222-find/.test(text);
    if (alias === "pie") return /(^|[^a-z])pie([^a-z]|$)|piesocial|pumpkinpie/.test(text);
    return text.includes(alias);
  });
}

function officialAliasesFor(product) {
  const aliases = String(product.name)
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  const manual = {
    "Character.AI / Replika / Chai": ["character.ai", "character ai", "replika", "chai"],
    "Kindroid / Nomi / Blush": ["kindroid", "nomi", "blush"],
    "PolyBuzz / HiWaifu / Linky": ["polybuzz", "poly buzz", "hiwaifu", "hi waifu", "linky"],
    "Butterflies AI": ["butterflies ai", "butterflies.ai", "butterflies"],
    "Born / Pengu": ["born", "pengu"],
    "Tinder Live Events": ["tinder"],
    "Bumble Bee": ["bumble"],
    "WeMeet by WeRoad": ["wemeet", "weroad"],
    "Status AI": ["status ai", "statusai"],
    "meeTalk": ["meetalk"],
    "222": ["222"],
    "Pie": ["pie", "piesocial"],
  };
  return [...new Set([...(manual[product.name] ?? []), ...aliases])]
    .map((alias) => alias.toLowerCase())
    .filter((alias) => alias.length >= 4 || ["222", "pie"].includes(alias));
}

function productForExistingOfficialItem(item) {
  const normalizedName = item.name.toLowerCase();
  return productNameLookup.find((product) =>
    officialAliasesFor(product).some((alias) => normalizedName.includes(alias) || alias.includes(normalizedName)),
  );
}

function rebuildOfficialSocialEvidence() {
  const rowsByProduct = new Map();

  for (const product of productNameLookup) {
    const aliases = officialAliasesFor(product);
    if (!aliases.length) continue;
    for (const search of social.searches ?? []) {
      for (const result of search.results ?? []) {
        const text = evidenceIdentityText(result);
        if (!officialAliasMatches(aliases, text)) continue;
        const label = officialLabelForUrl(result.url);
        if (label === "新闻/第三方") continue;
        const current = rowsByProduct.get(product.name) ?? { ...product, evidence: [] };
        current.evidence.push({
          label,
          url: result.url,
        });
        rowsByProduct.set(product.name, current);
      }
    }
  }

  for (const search of officialGapDeepDive.searches ?? []) {
    if (!search.ok || !search.productName) continue;
    const product = productNameLookup.find((item) => item.name === search.productName);
    if (!product) continue;
    const aliases = officialAliasesFor(product);
    const current = rowsByProduct.get(product.name) ?? { ...product, evidence: [] };
    for (const result of search.results ?? []) {
      if (!result.url) continue;
      const text = evidenceIdentityText(result);
      if (!officialAliasMatches(aliases, text)) continue;
      const label = officialLabelForUrl(result.url);
      if (label === "新闻/第三方") continue;
      current.evidence.push({
        label,
        url: result.url,
      });
    }
    rowsByProduct.set(product.name, current);
  }

  for (const search of languageOfficialSocialDeepDive.searches ?? []) {
    if (!search.ok || !search.productName) continue;
    const product = productNameLookup.find((item) => item.name === search.productName);
    if (!product || product.clusterId !== "language") continue;
    const aliases = officialAliasesFor(product);
    const current = rowsByProduct.get(product.name) ?? { ...product, evidence: [] };
    for (const result of search.results ?? []) {
      if (!result.url) continue;
      const text = evidenceIdentityText(result);
      if (!officialAliasMatches(aliases, text)) continue;
      const label = officialLabelForUrl(result.url);
      if (label === "新闻/第三方") continue;
      current.evidence.push({
        label,
        url: result.url,
      });
    }
    rowsByProduct.set(product.name, current);
  }

  const groupDefinitions = [
    { id: "language", title: "语言交换官网 / 应用商店 / 社媒证据", clusterIds: ["language"] },
    { id: "ai-social", title: "AI 社交 / companion / 泛娱乐官网与应用商店证据", clusterIds: ["ai-entertainment", "companions"] },
    { id: "irl", title: "线下真人社交官网 / 应用商店 / 社区证据", clusterIds: ["irl"] },
  ];
  const groups = groupDefinitions.map((definition) => ({
    id: definition.id,
    title: definition.title,
    items: [...rowsByProduct.values()]
      .filter((row) => definition.clusterIds.includes(row.clusterId))
      .map((row) => {
        const evidencePriority = {
          "官网": 0,
          "App Store": 1,
          "Google Play": 1,
          "LinkedIn": 2,
          "Instagram": 3,
          "TikTok": 3,
          "Discord": 3,
          "Threads": 3,
          "X/Twitter": 3,
          "Facebook": 3,
          "YouTube": 3,
        };
        const evidence = [...new Map(row.evidence.filter((item) => item.url).map((item) => [item.url, item])).values()]
          .sort((a, b) => (evidencePriority[a.label] ?? 9) - (evidencePriority[b.label] ?? 9) || a.url.localeCompare(b.url))
          .slice(0, 8);
        const types = [...new Set(evidence.map((item) => item.label))];
        return {
          name: row.name,
          type: types.join(" + "),
          evidence,
        };
      })
      .filter((row) => row.evidence.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));
  const allEvidence = groups.flatMap((group) => group.items.flatMap((item) => item.evidence));
  return {
    generatedAt: new Date().toISOString(),
    requestIds: [
      ...(social.searches ?? []).map((search) => search.requestId).filter(Boolean),
      ...(officialGapDeepDive.searches ?? []).map((search) => search.requestId).filter(Boolean),
      ...(languageOfficialSocialDeepDive.searches ?? []).map((search) => search.requestId).filter(Boolean),
    ],
    summary: {
      searches:
        (social.searches?.length ?? 0) +
        (officialGapDeepDive.searches?.length ?? 0) +
        (languageOfficialSocialDeepDive.searches?.length ?? 0),
      languageTargetedSearches: languageOfficialSocialDeepDive.searches?.length ?? 0,
      broadSearches: social.searches?.length ?? 0,
      targetedGapSearches: officialGapDeepDive.searches?.length ?? 0,
      results:
        (social.searches ?? []).reduce((sum, search) => sum + (search.results?.length ?? 0), 0) +
        (officialGapDeepDive.searches ?? []).reduce((sum, search) => sum + (search.results?.length ?? 0), 0) +
        (languageOfficialSocialDeepDive.searches ?? []).reduce((sum, search) => sum + (search.results?.length ?? 0), 0),
      productsWithEvidence: rowsByProduct.size,
      officialOrStoreLinks: allEvidence.filter((item) => ["官网", "App Store", "Google Play"].includes(item.label)).length,
      linkedinLinks: allEvidence.filter((item) => item.label === "LinkedIn").length,
      socialOrCommunityLinks: allEvidence.filter((item) => ["Instagram", "TikTok", "Discord", "Threads", "X/Twitter", "Facebook", "YouTube"].includes(item.label)).length,
    },
    groups,
  };
}

brief.officialSocialEvidence = rebuildOfficialSocialEvidence();
brief.officialGapDeepDive = {
  generatedAt: officialGapDeepDive.generatedAt ?? null,
  source: officialGapDeepDive.source ?? "https://api.exa.ai/search",
  purpose: officialGapDeepDive.purpose ?? "Targeted Exa official/social-profile gap pass.",
  searches: officialGapDeepDive.searches?.length ?? 0,
  resultRows: (officialGapDeepDive.searches ?? []).reduce((sum, search) => sum + (search.results?.length ?? 0), 0),
  products: (officialGapDeepDive.searches ?? []).map((search) => search.productName).filter(Boolean),
};
brief.languageOfficialSocialDeepDive = {
  generatedAt: languageOfficialSocialDeepDive.generatedAt ?? null,
  source: languageOfficialSocialDeepDive.source ?? "https://api.exa.ai/search",
  purpose: languageOfficialSocialDeepDive.purpose ?? "Targeted Exa language official/social pass.",
  searches: languageOfficialSocialDeepDive.searches?.length ?? 0,
  resultRows: (languageOfficialSocialDeepDive.searches ?? []).reduce((sum, search) => sum + (search.results?.length ?? 0), 0),
  products: (languageOfficialSocialDeepDive.searches ?? []).map((search) => search.productName).filter(Boolean),
};

const officialItems = (brief.officialSocialEvidence?.groups ?? []).flatMap((group) => group.items);
const timelineText = brief.fundingTimeline.map((event) => `${event.name} ${event.amount} ${event.lane}`).join("\n").toLowerCase();
const financialText = (brief.financialSignals ?? []).map((item) => `${item.name} ${item.signal} ${item.metric}`).join("\n").toLowerCase();
const peopleText = (brief.peopleSignals ?? []).map((item) => `${item.name} ${item.signal}`).join("\n").toLowerCase();

function residualSignalReview() {
  const definitions = {
    "ChatFai": {
      lane: "AI character / roleplay",
      decision: "边界留档",
      reason: "角色聊天产品，未找到融资、下载、收入或真人社交证据；不升级主矩阵，保留为 companion/roleplay 长尾。",
    },
    "EverAI": {
      lane: "AI roleplay / gaming",
      decision: "边界留档",
      reason: "强调 roleplay、gaming、creative writing；缺少近两年融资/规模信号，保留为 AI 泛娱乐长尾。",
    },
    "Soul App": {
      lane: "China AI social incumbent",
      decision: "市场背景",
      reason: "中国 AI+沉浸式社交平台背景样本，不是新增融资新闻；保留为区域市场参照。",
    },
    "janitorai": {
      lane: "AI companion / roleplay",
      decision: "已覆盖/重复佐证",
      reason: "Janitor AI 已在 discovery funding/scale signal 中以 DAU/用户规模口径保留；这里作为重复公司证据。",
    },
    "Gist IRL": {
      lane: "IRL networking",
      decision: "monitor watchlist",
      reason: "有面对面 networking 定位，但团队/融资/增长证据薄；进入 monitor watchlist，不升级主矩阵。",
    },
    "Soma": {
      lane: "IRL gatherings",
      decision: "monitor watchlist",
      reason: "有 invite-only gatherings、200+ dinners 和 30,000+ people 叙事，需继续补融资和活跃城市证据。",
    },
    "Eve Inc.": {
      lane: "IRL spontaneous social",
      decision: "monitor watchlist",
      reason: "新社交平台，强调 everyday tasks 到 face-to-face connections；缺融资/规模信号，继续监控。",
    },
    "Homii World": {
      lane: "housing / relocation adjacent",
      decision: "排除主表",
      reason: "更像日本租房/host family relocation 服务，不是 AI 社交、语言交换或 IRL social 核心产品。",
    },
    "Pie": {
      lane: "IRL social",
      decision: "已覆盖/重复佐证",
      reason: "Pie 已在主表/IRL 覆盖中出现；这里作为 company signal 佐证。",
    },
    "tribe IRL": {
      lane: "offline community infrastructure",
      decision: "边界留档",
      reason: "偏 offline community/event infrastructure，和消费社交相邻但不直接升级主矩阵。",
    },
    "Add One": {
      lane: "friend-of-friend social",
      decision: "monitor watchlist",
      reason: "有通过朋友认识新朋友的社交定位，但缺融资/规模/上线新闻，继续观察。",
    },
    "EVENTO": {
      lane: "events infrastructure",
      decision: "边界留档",
      reason: "更偏 event planning / events services，作为 IRL social 基础设施边界保留。",
    },
    "Lingopie": {
      lane: "language learning media",
      decision: "排除主表",
      reason: "偏影视字幕语言学习和课程，不是 HelloTalk/Tandem 式真人语伴社交。",
    },
    "Fai Nur": {
      lane: "AI social founder background",
      decision: "已覆盖/重复佐证",
      reason: "Fai Nur 是 Status AI 创始人背景信号；已能支撑 company/people 判断，不作为独立产品。",
    },
  };
  function residualNameMatches(name, result) {
    const text = `${result.title} ${result.url} ${result.highlight ?? ""}`;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (name.length <= 4) {
      return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
    }
    return new RegExp(escaped, "i").test(text);
  }
  const rows = [];
  for (const search of residualSignalDeepDive.searches ?? []) {
    for (const result of search.results ?? []) {
      const matchedName = Object.keys(definitions).find((name) => residualNameMatches(name, result));
      if (!matchedName) continue;
      const definition = definitions[matchedName];
      rows.push({
        name: matchedName,
        sourceQueryId: search.id,
        sourceCategory: search.category,
        requestId: search.requestId,
        lane: definition.lane,
        decision: definition.decision,
        reason: definition.reason,
        title: result.title,
        url: result.url,
        publishedDate: result.publishedDate ?? "",
        highlight: result.highlight,
      });
    }
  }
  const uniqueRows = [...new Map(rows.map((row) => [`${row.name}:${row.url}`, row])).values()];
  return {
    generatedAt: residualSignalDeepDive.generatedAt ?? null,
    purpose:
      "Resolves residual medium-priority signal-candidate coverage gaps after product-candidate, funding-candidate, and LingoPraxis queues were cleared.",
    totalRows: uniqueRows.length,
    monitorWatchlistRows: uniqueRows.filter((row) => row.decision === "monitor watchlist").length,
    duplicateOrCoveredRows: uniqueRows.filter((row) => /已覆盖|重复/.test(row.decision)).length,
    boundaryRows: uniqueRows.filter((row) => /边界|排除|市场背景/.test(row.decision)).length,
    rows: uniqueRows.sort((a, b) => a.decision.localeCompare(b.decision) || a.name.localeCompare(b.name)),
  };
}

brief.residualSignalReview = residualSignalReview();

function linkedProductsFor(text) {
  const normalized = String(text ?? "").toLowerCase();
  const matches = productNameLookup.filter((product) => normalized.includes(product.name.toLowerCase()));
  return [...new Map(matches.map((item) => [item.name, item])).values()];
}

function resultText(result) {
  return [
    result.title,
    result.url,
    result.author,
    result.publishedDate,
    ...(result.highlights ?? []),
    result.highlight,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function sourceResultRows() {
  return [
    ...(exa.searches ?? []).flatMap((search) =>
      (search.results ?? []).map((result) => ({
        sourceLayer: "main research",
        queryId: search.id,
        category: search.category,
        requestId: search.requestId,
        title: result.title ?? "Untitled",
        url: result.url,
        publishedDate: result.publishedDate ?? "",
        text: resultText(result),
      })),
    ),
    ...(social.searches ?? []).flatMap((search) =>
      (search.results ?? []).map((result) => ({
        sourceLayer: "official/social pass",
        queryId: search.id,
        category: "official/social profile",
        requestId: search.requestId,
        title: result.title ?? "Untitled",
        url: result.url,
        publishedDate: result.publishedDate ?? "",
        text: resultText(result),
      })),
    ),
    ...(discovery.scans ?? []).flatMap((scan) =>
      (scan.results ?? []).map((result) => ({
        sourceLayer: "discovery scan",
        queryId: scan.id,
        category: scan.category,
        requestId: scan.requestId,
        title: result.title ?? "Untitled",
        url: result.url,
        publishedDate: result.publishedDate ?? "",
        text: resultText(result),
      })),
    ),
    ...(languageGrowthChannelDeepDive.searches ?? []).flatMap((search) =>
      (search.results ?? []).map((result) => ({
        sourceLayer: "language growth/channel deep-dive",
        queryId: search.id,
        category: search.category,
        requestId: search.requestId,
        title: result.title ?? "Untitled",
        url: result.url,
        publishedDate: result.publishedDate ?? "",
        text: resultText(result),
      })),
    ),
    ...(languageOfficialSocialDeepDive.searches ?? []).flatMap((search) =>
      (search.results ?? []).map((result) => ({
        sourceLayer: "language official/social deep-dive",
        queryId: `language_official_social_${search.id}`,
        category: "official/social profile",
        requestId: search.requestId,
        title: result.title ?? "Untitled",
        url: result.url,
        publishedDate: result.publishedDate ?? "",
        text: resultText(result),
      })),
    ),
  ];
}

function entityAliases() {
  const genericNames = new Set(["series", "born", "app", "apps", "ai matchmaking apps", "new ai dating app"]);
  const rows = [
    ...productNameLookup.map((item) => ({ name: item.name, type: "product matrix" })),
    ...brief.fundingTimeline.map((item) => ({ name: item.name, type: "funding timeline" })),
    ...(brief.discoveryScan?.supplementalFundingNews ?? []).map((item) => ({ name: item.name, type: "supplemental funding/news" })),
    ...(brief.discoveryScan?.reviewItems ?? []).map((item) => ({ name: item.name, type: "discovery review" })),
    ...(brief.discoveryScan?.fundingCandidateReview ?? []).map((item) => ({ name: item.candidateName, type: "funding candidate review" })),
    ...(brief.residualSignalReview?.rows ?? []).map((item) => ({ name: item.name, type: "residual signal review" })),
    ...officialItems.map((item) => ({ name: item.name, type: "official/social evidence" })),
  ];
  const aliases = [];
  const manualAliases = [
    { name: "222", type: "funding timeline", alias: "222" },
    { name: "Status AI", type: "funding timeline", alias: "statusai" },
    { name: "Status AI", type: "funding timeline", alias: "status ai" },
    { name: "Tinder Live Events", type: "funding timeline", alias: "tinder" },
    { name: "Bumble Bee", type: "funding timeline", alias: "bumble" },
    { name: "Janitor AI", type: "candidate review", alias: "janitor ai" },
    { name: "AI iMessage social network", type: "supplemental funding/news", alias: "social network in imessage" },
    { name: "AI iMessage social network", type: "supplemental funding/news", alias: "anti-facebook" },
    { name: "AI iMessage social network", type: "supplemental funding/news", alias: "series, the" },
    { name: "SocialAI / Oasiz", type: "discovery review", alias: "socialai" },
    { name: "Bee / Limitless", type: "discovery review", alias: "bee.computer" },
  ];
  for (const row of rows) {
    for (const alias of String(row.name).split("/")) {
      const name = alias.trim();
      const normalized = name.toLowerCase();
      if ((name.length < 4 && normalized !== "222") || genericNames.has(normalized)) continue;
      aliases.push({ ...row, alias: name, normalized });
    }
  }
  aliases.push(...manualAliases.map((item) => ({ ...item, normalized: item.alias.toLowerCase() })));
  return [...new Map(aliases.map((item) => [`${item.normalized}:${item.type}`, item])).values()];
}

function unlinkedReviewDecision(row) {
  const text = `${row.title} ${row.url} ${row.queryId}`.toLowerCase();
  if (/^language_official_social_/.test(row.queryId)) {
    return {
      tier: "low-relevance",
      decision: "官方搜索溢出留档",
      reason: "来自语言官方/社媒 targeted 查询，但未稳定匹配到主表产品；多为官网子页、多语言页、相邻应用或搜索溢出，保留审计但不进入 monitor 观察缺口。",
    };
  }
  if (/research|financial|report|rankings|market/.test(row.queryId)) {
    return {
      tier: "background-source",
      decision: "背景留档",
      reason: "更像研究、榜单、市场规模或方法论来源，用于背景判断，不直接升级为产品。",
    };
  }
  if (/janitor ai|some ai|ananas|lingopraxis|conversifi|around me|meetup|plannit|link dine|posh|luma/.test(text)) {
    return {
      tier: "product-candidate",
      decision: "候选补证",
      reason: "出现具体产品/公司名，但当前缺少足够增长、功能或官方证据，需要下一轮补证后决定是否入主表。",
    };
  }
  if (/funding|raises|launch|dating|bumble|tinder|offline|social|companion|friend|ai/.test(text)) {
    return {
      tier: "signal-candidate",
      decision: "信号复核",
      reason: "与 AI 社交、dating、offline social 或融资新闻相关，但未稳定匹配到当前结论实体。",
    };
  }
  return {
    tier: "low-relevance",
    decision: "低相关留档",
    reason: "与本次核心市场问题关联较弱，保留在来源审计中避免误删。",
  };
}

function sourceLinkageAudit() {
  const aliases = entityAliases();
  const rows = sourceResultRows().map((row) => {
    const matches = aliases.filter((alias) => row.text.includes(alias.normalized));
    const uniqueMatches = [...new Map(matches.map((item) => [item.name, item])).values()];
    const linkageType = uniqueMatches.length ? "linked" : "unlinked-review";
    const review = uniqueMatches.length
      ? {
          tier: "linked",
          decision: "已关联",
          reason: "已关联到主表、时间线或官方/社媒证据。",
        }
      : unlinkedReviewDecision(row);
    return {
      sourceLayer: row.sourceLayer,
      queryId: row.queryId,
      category: row.category,
      requestId: row.requestId,
      title: row.title,
      url: row.url,
      publishedDate: row.publishedDate,
      linkageType,
      matchedEntities: uniqueMatches.map((item) => item.name),
      matchedTypes: [...new Set(uniqueMatches.map((item) => item.type))],
      reviewTier: review.tier,
      reviewDecision: review.decision,
      reviewReason: review.reason,
      action: review.reason,
    };
  });
  const reviewBuckets = Object.values(
    rows.reduce((acc, row) => {
      acc[row.reviewTier] ??= { tier: row.reviewTier, decision: row.reviewDecision, count: 0 };
      acc[row.reviewTier].count += 1;
      return acc;
    }, {}),
  ).sort((a, b) => b.count - a.count || a.tier.localeCompare(b.tier));
  const byLayer = Object.values(
    rows.reduce((acc, row) => {
      acc[row.sourceLayer] ??= { sourceLayer: row.sourceLayer, total: 0, linked: 0, unlinked: 0 };
      acc[row.sourceLayer].total += 1;
      if (row.linkageType === "linked") acc[row.sourceLayer].linked += 1;
      else acc[row.sourceLayer].unlinked += 1;
      return acc;
    }, {}),
  );
  const linked = rows.filter((row) => row.linkageType === "linked").length;
  const unlinkedReview = rows.filter((row) => row.linkageType === "unlinked-review");
  return {
    generatedAt: new Date().toISOString(),
    method:
      "Every raw Exa result from main research, official/social pass, and discovery scan is matched against curated product names, funding/news names, supplemental candidates, and official/social evidence names. Unmatched rows stay in a review queue instead of disappearing.",
    totalResults: rows.length,
    linkedResults: linked,
    unlinkedResults: unlinkedReview.length,
    linkedShare: `${Math.round((linked / rows.length) * 100)}%`,
    byLayer,
    reviewBuckets,
    topUnlinkedReview: unlinkedReview.slice(0, 18),
    rows,
  };
}

function coverageGapRegister() {
  const rows = (brief.sourceLinkageAudit?.rows ?? []).filter((row) => row.linkageType === "unlinked-review");
  const deepDiveRows = brief.candidateDeepDive?.rows ?? [];
  const signalResolutionRows = [
    ...(brief.discoveryScan?.fundingCandidateReview ?? []).map((item) => ({
      url: item.url,
      name: item.candidateName,
      decision: item.handlingStatus,
      lane: item.lane,
      nextAction: item.nextAction,
    })),
    ...(brief.financialSignals ?? []).flatMap((item) =>
      (item.evidence ?? []).map((evidence) => ({
        url: evidence.url,
        name: item.name,
        decision: "已并入市场判断",
        lane: "financial/market background",
        nextAction: item.interpretation,
      })),
    ),
    ...(brief.fundingEventAudit?.rows ?? []).map((item) => ({
      url: item.url,
      name: item.name,
      decision: item.conclusion,
      lane: item.normalizedLane,
      nextAction: item.conclusion,
    })),
    ...(brief.residualSignalReview?.rows ?? []).map((item) => ({
      url: item.url,
      name: item.name,
      decision: item.decision,
      lane: item.lane,
      nextAction: item.reason,
    })),
  ];
  const signalResolutionByUrl = new Map(signalResolutionRows.filter((item) => item.url).map((item) => [item.url, item]));
  function deepDiveMatches(example, item) {
    const exampleText = `${example.title} ${example.url}`.toLowerCase();
    const seed = String(item.seedUrl ?? "").toLowerCase();
    const name = normalizedEventName(item.name);
    return (seed && exampleText.includes(seed.replace(/^https?:\/\//, "").replace(/\/$/, ""))) || (name && normalizedEventName(exampleText).includes(name));
  }
  const actionByTier = {
    "product-candidate": "进入 candidate deep-dive 或下一轮 Exa company/news 补证，决定是否升级主表。",
    "signal-candidate": "进入 monitor 近窗复核，若出现融资、上线、下载或官方证据则升级融资新闻或主表。",
    "background-source": "保留为市场、研究、财报或方法论背景，不作为独立产品计数。",
    "low-relevance": "低相关留档，仅在后续 monitor 反复出现时重新复核。",
  };
  const priorityByTier = {
    "product-candidate": "high",
    "signal-candidate": "medium",
    "background-source": "low",
    "low-relevance": "archive",
  };
  const groups = Object.values(
    rows.reduce((acc, row) => {
      const key = `${row.reviewTier}::${row.queryId}`;
      acc[key] ??= {
        key,
        reviewTier: row.reviewTier,
        reviewDecision: row.reviewDecision,
        queryId: row.queryId,
        category: row.category,
        count: 0,
        priority: priorityByTier[row.reviewTier] ?? "medium",
        nextAction: actionByTier[row.reviewTier] ?? row.reviewReason,
        reason: row.reviewReason,
        examples: [],
        urls: [],
      };
      acc[key].count += 1;
      acc[key].urls.push(row.url);
      if (acc[key].examples.length < 3) {
        acc[key].examples.push({
          title: row.title,
          url: row.url,
          publishedDate: row.publishedDate,
          sourceLayer: row.sourceLayer,
        });
      }
      return acc;
    }, {}),
  ).map((group) => {
    const reviewed = deepDiveRows
      .filter((item) => {
        const seed = String(item.seedUrl ?? "").toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
        const name = normalizedEventName(item.name);
        return (
          group.examples.some((example) => deepDiveMatches(example, item)) ||
          group.urls.some((url) => {
            const urlText = String(url ?? "").toLowerCase();
            return (seed && urlText.includes(seed)) || (name && normalizedEventName(urlText).includes(name));
          })
        );
      })
      .map((item) => ({
        name: item.name,
        decision: item.decision,
        priority: item.priority,
        lane: item.lane,
        reason: item.reason,
      }));
    const reviewedDecisions = [...new Set(reviewed.map((item) => item.decision))];
    const signalReviewed =
      group.reviewTier === "signal-candidate"
        ? [
            ...new Map(
              group.urls
                .map((url) => signalResolutionByUrl.get(url))
                .filter(Boolean)
                .map((item) => [item.url, item]),
            ).values(),
          ]
        : [];
    const resolvedCount = reviewed.length + signalReviewed.length;
    const unresolvedCount = Math.max(group.count - resolvedCount, 0);
    const signalDecisions = [...new Set(signalReviewed.map((item) => item.decision))];
    return {
      ...group,
      deepDiveReviewed: reviewed.length,
      signalReviewed: signalReviewed.length,
      unresolvedCount,
      reviewedDecisions,
      signalDecisions,
      handlingStatus:
        group.reviewTier === "product-candidate" && reviewed.length > 0
          ? unresolvedCount === 0
            ? "deep-dive complete"
            : "partially reviewed"
          : group.reviewTier === "signal-candidate" && signalReviewed.length > 0
            ? unresolvedCount === 0
              ? "signal review complete"
              : "partially signal-reviewed"
          : "queued",
      nextAction:
        group.reviewTier === "product-candidate" && reviewed.length > 0
          ? `已完成 ${reviewed.length} 个候选的 candidate deep-dive；结论为 ${reviewedDecisions.join(" / ")}。剩余 ${unresolvedCount} 条继续进入下一轮补证或 monitor。`
          : group.reviewTier === "signal-candidate" && signalReviewed.length > 0
            ? `已有 ${signalReviewed.length} 条信号进入 funding candidate review、market decision 或 funding event audit；结论为 ${signalDecisions.join(" / ")}。剩余 ${unresolvedCount} 条继续由 monitor 观察。`
          : group.nextAction,
      reviewed,
      signalReviewedItems: signalReviewed,
    };
  }).sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2, archive: 3 };
    return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9) || b.count - a.count || a.queryId.localeCompare(b.queryId);
  });

  const byTier = Object.values(
    rows.reduce((acc, row) => {
      acc[row.reviewTier] ??= {
        reviewTier: row.reviewTier,
        reviewDecision: row.reviewDecision,
        count: 0,
        priority: priorityByTier[row.reviewTier] ?? "medium",
        nextAction: actionByTier[row.reviewTier] ?? row.reviewReason,
      };
      acc[row.reviewTier].count += 1;
      return acc;
    }, {}),
  ).sort((a, b) => b.count - a.count || a.reviewTier.localeCompare(b.reviewTier));

  return {
    generatedAt: new Date().toISOString(),
    purpose: "Keep unmatched Exa results visible as coverage gaps so the 'all relevant products' boundary is auditable rather than hidden.",
    totalGaps: rows.length,
    highPriorityGaps: groups.filter((group) => group.priority === "high").reduce((sum, group) => sum + group.count, 0),
    deepDiveReviewedGaps: groups.reduce((sum, group) => sum + group.deepDiveReviewed, 0),
    unresolvedAfterDeepDive: groups.reduce((sum, group) => sum + group.unresolvedCount, 0),
    byTier,
    groups,
  };
}

function candidateDeepDiveDecision(name) {
  const normalized = name.toLowerCase();
  const map = {
    lingopraxis: {
      lane: "language exchange long tail",
      decision: "长尾留档",
      priority: "medium",
      reason: "有官网、商店和真人语言练习定位，但 targeted Exa 补证仍未找到融资、强增长、社媒声量或开放消费社交规模信号；作为长尾覆盖保留，不升级主表。",
    },
    conversifi: {
      lane: "language exchange / university",
      decision: "边界参照",
      priority: "medium",
      reason: "定位清楚，偏大学语言与文化交换；更像垂直/B2B 场景，缺少开放消费社交增长信号，作为 HelloTalk/Tandem 边界参照保留。",
    },
    "ananas b.v.": {
      lane: "language/social ambiguous",
      decision: "暂缓",
      priority: "low",
      reason: "Exa 返回公司页但相关搜索混入非社交新闻，产品边界和增长证据不足。",
    },
    plannit: {
      lane: "planning / travel adjacent",
      decision: "排除主表",
      priority: "low",
      reason: "结果更偏计划工具、AI business plan 或 travel creator booking，不是 HelloTalk/Tandem 或 AI 社交核心竞品。",
    },
    "link dine": {
      lane: "IRL dining social candidate",
      decision: "候选补证",
      priority: "medium",
      reason: "名称和 LinkedIn 来源指向线下饭局/餐饮社交，但缺少官网、增长和融资证据，需要 monitor 继续盯。",
    },
    meetup: {
      lane: "IRL incumbent reference",
      decision: "边界参照",
      priority: "medium",
      reason: "是线下活动/见面基础设施的老牌参照；不属于 AI-native 新产品，但适合作为 IRL 渠道和用户需求参照。",
    },
    "around me": {
      lane: "local search adjacent",
      decision: "排除主表",
      priority: "low",
      reason: "补证结果更像本地搜索工具 AroundMe，而不是社交或 AI 社交产品。",
    },
    "some ai": {
      lane: "AI-native social candidate",
      decision: "信号复核",
      priority: "high",
      reason: "有 AI/social 方向和同类新闻信号，但需确认 SoMe AI 与 Series/Shapes/Status 等结果是否为同一实体或相邻噪声。",
    },
  };
  return map[normalized] ?? {
    lane: "unclassified candidate",
    decision: "候选补证",
    priority: "medium",
    reason: "出现具体产品/公司名，但当前补证结果不足以升级主表。",
  };
}

function candidateDeepDiveReview() {
  const byCandidate = new Map();
  for (const candidate of candidateDeepDive.candidates ?? []) {
    byCandidate.set(candidate.name, {
      ...candidate,
      searches: [],
      totalResults: 0,
      requestIds: [],
      evidence: [],
    });
  }
  for (const search of candidateDeepDive.searches ?? []) {
    const item =
      byCandidate.get(search.candidate) ??
      {
        name: search.candidate,
        seedUrl: search.seedUrl,
        sourceQueryId: search.sourceQueryId,
        searches: [],
        totalResults: 0,
        requestIds: [],
        evidence: [],
      };
    item.searches.push({
      id: search.id,
      category: search.category,
      resultCount: search.results?.length ?? 0,
      requestId: search.requestId,
    });
    item.totalResults += search.results?.length ?? 0;
    if (search.requestId) item.requestIds.push(search.requestId);
    item.evidence.push(
      ...(search.results ?? []).slice(0, 2).map((result) => ({
        label: result.title,
        url: result.url,
        category: search.category,
        highlight: result.highlight,
      })),
    );
    byCandidate.set(search.candidate, item);
  }

  const rows = [...byCandidate.values()].map((item) => ({
    name: item.name,
    seedUrl: item.seedUrl,
    sourceQueryId: item.sourceQueryId,
    ...candidateDeepDiveDecision(item.name),
    totalResults: item.totalResults,
    requestIds: item.requestIds,
    searches: item.searches,
    evidence: item.evidence.slice(0, 5),
  }));

  return {
    generatedAt: candidateDeepDive.generatedAt,
    purpose: candidateDeepDive.purpose,
    candidates: rows.length,
    searches: candidateDeepDive.searches?.length ?? 0,
    totalResults: rows.reduce((sum, item) => sum + item.totalResults, 0),
    byDecision: Object.values(
      rows.reduce((acc, row) => {
        acc[row.decision] ??= { decision: row.decision, count: 0 };
        acc[row.decision].count += 1;
        return acc;
      }, {}),
    ).sort((a, b) => b.count - a.count || a.decision.localeCompare(b.decision)),
    rows,
  };
}

function backgroundRowsFromPeople() {
  return (brief.peopleSignals ?? []).map((item) => {
    const linkedProducts = linkedProductsFor(`${item.name} ${item.signal} ${item.whyItMatters}`);
    return {
      sourceCategory: "people",
      subject: item.name,
      linkedProducts: linkedProducts.map((product) => product.name),
      lane: linkedProducts[0]?.cluster ?? "团队/创始人参照",
      dimension: item.role,
      signal: item.signal,
      interpretation: item.whyItMatters,
      evidence: item.evidence,
    };
  });
}

function backgroundRowsFromFinancial() {
  return (brief.financialSignals ?? []).map((item) => {
    const linkedProducts = linkedProductsFor(`${item.name} ${item.signal} ${item.interpretation}`);
    return {
      sourceCategory: "financial report",
      subject: item.name,
      linkedProducts: linkedProducts.map((product) => product.name),
      lane: linkedProducts[0]?.cluster ?? "市场/上市公司参照",
      dimension: item.metric,
      signal: item.signal,
      interpretation: item.interpretation,
      evidence: item.evidence,
    };
  });
}

function backgroundRowsFromCompanyDeepDive() {
  return (companyBackgroundDeepDive.searches ?? [])
    .filter((search) => search.ok && search.results?.length && search.productName)
    .map((search) => {
      const evidence = search.results
        .filter((result) => result.url)
        .slice(0, 1)
        .map((result) => ({
          label: result.title,
          url: result.url,
        }));
      const primary = search.results[0];
      const sourceCategory = search.category === "financial report" ? "financial report" : "company";
      return {
        sourceCategory,
        subject: search.productName,
        linkedProducts: [search.productName],
        lane: productNameLookup.find((product) => product.name === search.productName)?.cluster ?? "targeted company background",
        dimension: search.dimension ?? search.category,
        signal: `Targeted Exa ${search.category} deep-dive returned ${search.results.length} results; primary evidence: ${primary.title}. ${primary.highlight || ""}`.trim(),
        interpretation:
          sourceCategory === "financial report"
            ? "补充上市公司、市场报告或收入/下载口径，用于校准 AI companion / social 产品能力边界；不直接重复计入融资总额。"
            : "补充产品级公司、团队、员工、收入、成立时间或定位证据，用于把公司背景判断从赛道级推进到产品级。",
        evidence,
      };
    });
}

brief.companyBackgroundDeepDive = {
  generatedAt: companyBackgroundDeepDive.generatedAt ?? null,
  source: companyBackgroundDeepDive.source ?? "https://api.exa.ai/search",
  purpose: companyBackgroundDeepDive.purpose ?? "Targeted Exa company/financial background pass.",
  searches: companyBackgroundDeepDive.searches?.length ?? 0,
  resultRows: (companyBackgroundDeepDive.searches ?? []).reduce((sum, search) => sum + (search.results?.length ?? 0), 0),
  linkedProducts: [...new Set((companyBackgroundDeepDive.searches ?? []).map((search) => search.productName).filter(Boolean))],
};

const companyBackgroundRows = [...backgroundRowsFromPeople(), ...backgroundRowsFromFinancial(), ...backgroundRowsFromCompanyDeepDive()];
brief.companyBackgroundReview = {
  generatedAt: new Date().toISOString(),
  method:
    "Derived from Exa people, company, and financial report signals. Product links are assigned only when the signal text explicitly mentions a curated product name or comes from a targeted product background deep-dive; otherwise the row remains a market/team reference.",
  totalSignals: companyBackgroundRows.length,
  linkedSignals: companyBackgroundRows.filter((item) => item.linkedProducts.length > 0).length,
  rows: companyBackgroundRows,
};

function companyBackgroundCoverageAudit() {
  const products = brief.clusters.flatMap((cluster) =>
    cluster.items.map((item) => ({
      name: item.name,
      cluster: cluster.title,
      evidenceGrade: item.evidenceScore?.grade ?? "",
      capabilityTier: brief.productCapability?.rows?.find((row) => row.name === item.name)?.tier ?? "",
      signal: item.signal,
    })),
  );
  const backgroundRows = brief.companyBackgroundReview?.rows ?? [];
  const financialSignals = brief.financialSignals ?? [];
  const peopleSignals = brief.peopleSignals ?? [];

  return {
    generatedAt: new Date().toISOString(),
    method:
      "Maps people and financial-report evidence to each curated product. Direct links require explicit product mention; otherwise market-level financial/people evidence is recorded as category background rather than product-specific proof.",
    totalProducts: products.length,
    rows: products.map((product) => {
      const directRows = backgroundRows.filter((row) => row.linkedProducts.includes(product.name));
      const directPeople = directRows.filter((row) => row.sourceCategory === "people");
      const directFinancial = directRows.filter((row) => row.sourceCategory === "financial report");
      const directCompany = directRows.filter((row) => row.sourceCategory === "company");
      const clusterLower = product.cluster.toLowerCase();
      const marketFinancial = financialSignals.filter((item) => {
        const text = `${item.name} ${item.signal} ${item.interpretation}`.toLowerCase();
        if (clusterLower.includes("语言")) return /app|consumer|language|education|download|market|rank/.test(text);
        if (clusterLower.includes("线下")) return /dating|social|event|travel|friend|offline|irl|market|app/.test(text);
        if (clusterLower.includes("伴侣") || clusterLower.includes("角色") || clusterLower.includes("娱乐")) return /ai|companion|character|revenue|download|consumer|app|rank/.test(text);
        return /consumer|app|market|revenue|download/.test(text);
      });
      const marketPeople = peopleSignals.filter((item) => {
        const text = `${item.name} ${item.signal} ${item.whyItMatters}`.toLowerCase();
        if (clusterLower.includes("线下")) return /timeleft|222|partnership|growth|founder|irl|offline/.test(text);
        if (clusterLower.includes("伴侣") || clusterLower.includes("角色") || clusterLower.includes("娱乐")) return /founder|growth|ai|consumer/.test(text);
        return /founder|growth|language|social|community/.test(text);
      });
      const directDimensions = [
        directCompany.length ? "company" : "",
        directPeople.length ? "people" : "",
        directFinancial.length ? "financial report" : "",
      ].filter(Boolean);
      const missingDirectDimensions = ["company", "people", "financial report"].filter(
        (dimension) => !directDimensions.includes(dimension),
      );
      const status =
        directCompany.length && directFinancial.length && directPeople.length
          ? "产品级背景强"
          : directCompany.length && (directFinancial.length || directPeople.length)
            ? "产品级背景较强"
            : directCompany.length
              ? "产品级公司已覆盖"
              : directFinancial.length
                ? "产品级财务/规模覆盖"
                : directPeople.length
                  ? "产品级团队覆盖"
                  : marketFinancial.length || marketPeople.length
                    ? "市场背景覆盖"
                    : "需补公司背景";
      const nextCheck =
        status === "产品级背景强"
          ? "可支撑公司背景判断；下一步补最新招聘、收入或下载趋势。"
          : status === "产品级背景较强"
            ? `已有多维产品级背景；继续补 ${missingDirectDimensions.join(" / ")}。`
            : status === "产品级公司已覆盖"
              ? "已有产品级 company 背景；继续补 founder/team people 证据和 revenue/download/funding 口径。"
              : status === "产品级财务/规模覆盖"
                ? "已有产品级 financial/scale 背景；继续补官网公司主体和 founder/team 证据。"
                : status === "产品级团队覆盖"
                  ? "已有产品级 people 背景；继续补公司主体、融资、下载或收入证据。"
            : status === "市场背景覆盖"
              ? "只有赛道级背景；下一步补该产品创始人、团队、融资、下载或收入证据。"
              : "优先用 Exa people/company/financial report 查询补证。";
      return {
        name: product.name,
        cluster: product.cluster,
        evidenceGrade: product.evidenceGrade,
        capabilityTier: product.capabilityTier,
        status,
        directPeopleSignals: directPeople.length,
        directCompanySignals: directCompany.length,
        directFinancialSignals: directFinancial.length,
        marketPeopleSignals: marketPeople.length,
        marketFinancialSignals: marketFinancial.length,
        directDimensions,
        missingDirectDimensions,
        productLevelSignalCount: directRows.length,
        nextCheck,
        linkedSubjects: directRows.map((row) => row.subject),
        marketSignals: [...marketPeople, ...marketFinancial].slice(0, 4).map((item) => item.name),
      };
    }),
  };
}

brief.companyBackgroundCoverageAudit = companyBackgroundCoverageAudit();
brief.companyBackgroundCoverageAudit.summary = Object.values(
  brief.companyBackgroundCoverageAudit.rows.reduce((acc, row) => {
    acc[row.status] ??= { status: row.status, count: 0 };
    acc[row.status].count += 1;
    return acc;
  }, {}),
).sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));

function evidenceStrength(sourceCategory, item) {
  const evidenceCount = item.evidence?.length ?? (item.url ? 1 : 0);
  const text = `${item.name ?? ""} ${item.title ?? ""} ${item.metric ?? ""} ${item.signal ?? ""} ${item.body ?? ""}`.toLowerCase();
  if (sourceCategory === "financial report" && /sec|revenue|arr|mau|download|income|营收|收入|下载|访问量|paying/.test(text)) {
    return evidenceCount > 1 ? "强：有量化商业/规模口径和多来源证据" : "中：有量化商业/规模口径";
  }
  if (sourceCategory === "research paper" && /arxiv|paper|research|论文|rct|evaluation|study/.test(text)) {
    return "中：研究/论文证据，可用于风险边界而非商业结论";
  }
  return evidenceCount > 1 ? "中：多来源背景证据" : "弱：单来源背景证据";
}

function decisionAreaFor(sourceCategory, item) {
  const text = `${item.name ?? ""} ${item.title ?? ""} ${item.metric ?? ""} ${item.signal ?? ""} ${item.body ?? ""} ${item.interpretation ?? ""}`.toLowerCase();
  if (sourceCategory === "research paper") {
    if (/teen|youth|青少年|regulation|lawsuit|安全|合规|policy/.test(text)) return "安全/监管风险判断";
    if (/loneliness|孤独|attachment|dependence|依赖|relationship|真人关系|human/.test(text)) return "AI 伴侣与真人关系边界";
    return "产品长期影响判断";
  }
  if (/match|bumble|tinder|dating|life360|irl|real-world|location/.test(text)) return "线下真人/付费社交商业参照";
  if (/webtoon|character|ip|角色|泛娱乐/.test(text)) return "泛娱乐/IP 角色聊天机会";
  if (/polybuzz|talkie|minimax|hiwaifu|tolan|companion|ai social|revenue|download|arr|营收|下载/.test(text)) return "AI 伴侣商业化与增长参照";
  return "市场规模与付费能力参照";
}

function decisionJudgmentFor(sourceCategory, decisionArea) {
  if (sourceCategory === "research paper") {
    if (decisionArea === "安全/监管风险判断") return "纯 AI 伴侣和角色平台的增长要和青少年、安全、身份误导与合规风险一起评估。";
    if (decisionArea === "AI 伴侣与真人关系边界") return "把 AI 作为互动入口可以成立，但不能把真实人类关系替代风险从产品判断里拿掉。";
    return "长期使用、依赖和心理影响仍需持续 monitor，不宜只用下载或收入判断产品质量。";
  }
  if (decisionArea === "线下真人/付费社交商业参照") return "上市 dating/location/social graph 公司给出订阅、匹配效率和现实关系网络的规模边界。";
  if (decisionArea === "泛娱乐/IP 角色聊天机会") return "AI 角色聊天正在进入内容平台和 IP 社区，不只是独立 companion app 的机会。";
  return "下载、访问量、ARR 或营收口径可校准增长质量，但需要区分流量、收入和融资热度。";
}

function nextActionForDecision(sourceCategory, decisionArea) {
  if (sourceCategory === "research paper") return "进入 research/policy monitor；若出现新论文、诉讼或监管材料，更新风险边界和展示讲稿。";
  if (decisionArea === "线下真人/付费社交商业参照") return "继续补对应产品的付费转化、城市密度、线下履约和留存证据。";
  if (decisionArea === "泛娱乐/IP 角色聊天机会") return "监控内容平台、IP 社区和角色聊天功能是否带来新增付费或互动数据。";
  return "优先补强下载、收入、内购、订阅或 MAU 的最新口径，并和融资新闻去重。";
}

function marketDecisionEvidenceRows() {
  const researchRows = (brief.researchSignals ?? []).map((item) => {
    const decisionArea = decisionAreaFor("research paper", item);
    return {
      sourceCategory: "research paper",
      signalName: item.title,
      decisionArea,
      linkedProducts: [],
      judgment: decisionJudgmentFor("research paper", decisionArea),
      businessImpact: item.body,
      evidenceStrength: evidenceStrength("research paper", item),
      targetViews: ["#evidence", "#playbook"],
      nextAction: nextActionForDecision("research paper", decisionArea),
      evidence: [{ label: "论文/研究证据", url: item.url }],
    };
  });
  const financialRows = (brief.financialSignals ?? []).map((item) => {
    const decisionArea = decisionAreaFor("financial report", item);
    const linkedProducts = linkedProductsFor(`${item.name} ${item.signal} ${item.interpretation}`).map((product) => product.name);
    return {
      sourceCategory: "financial report",
      signalName: item.name,
      decisionArea,
      linkedProducts,
      judgment: decisionJudgmentFor("financial report", decisionArea),
      businessImpact: `${item.metric}；${item.interpretation}`,
      evidenceStrength: evidenceStrength("financial report", item),
      targetViews: ["#evidence", "#products", "#playbook"],
      nextAction: nextActionForDecision("financial report", decisionArea),
      evidence: item.evidence,
    };
  });
  return [...researchRows, ...financialRows];
}

const marketDecisionRows = marketDecisionEvidenceRows();
brief.marketDecisionEvidenceMap = {
  generatedAt: new Date().toISOString(),
  method:
    "Converts Exa research paper and financial report evidence into explicit market, company-background, product-capability, risk, and next-action judgments.",
  totalRows: marketDecisionRows.length,
  researchRows: marketDecisionRows.filter((item) => item.sourceCategory === "research paper").length,
  financialRows: marketDecisionRows.filter((item) => item.sourceCategory === "financial report").length,
  byDecisionArea: Object.values(
    marketDecisionRows.reduce((acc, row) => {
      acc[row.decisionArea] ??= { decisionArea: row.decisionArea, count: 0 };
      acc[row.decisionArea].count += 1;
      return acc;
    }, {}),
  ).sort((a, b) => b.count - a.count || a.decisionArea.localeCompare(b.decisionArea)),
  rows: marketDecisionRows,
};

brief.sourceLinkageAudit = sourceLinkageAudit();
brief.candidateDeepDive = candidateDeepDiveReview();
brief.coverageGapRegister = coverageGapRegister();

function languageCoverageAudit() {
  const rows = [];
  const mainLanguage = brief.clusters.find((cluster) => cluster.id === "language");
  for (const item of mainLanguage?.items ?? []) {
    rows.push({
      name: item.name,
      sourceLayer: "competitive matrix",
      decision: "已入主表",
      status: "core",
      reason: "已在 HelloTalk/Tandem 相邻主表中，包含增长信号、渠道、功能差异和证据等级。",
      evidenceCount: item.evidence?.length ?? 0,
      evidence: item.evidence ?? [],
    });
  }
  for (const item of brief.discoveryScan?.languageLongTailReview ?? []) {
    const isResolvedMeetalk =
      item.name === "meeTalk: Global Chat" &&
      /quiksa\.com|meetalk|Global Chat/i.test(`${item.reason} ${JSON.stringify(item.evidence ?? [])}`);
    rows.push({
      name: item.name,
      sourceLayer: "language long-tail discovery",
      decision: isResolvedMeetalk ? "长尾留档" : item.decision,
      status: isResolvedMeetalk
        ? "boundary"
        : item.decision === "已入主表"
          ? "covered-core"
          : ["候选补证", "继续观察"].includes(item.decision)
            ? "watchlist"
            : "boundary",
      reason: isResolvedMeetalk
        ? `${item.reason} / 已补到 Quiksa 官网和 meeTalk LinkedIn 证据，但增长、开放消费社交规模和强功能差异仍弱；作为语言长尾留档，不进入升级队列。`
        : item.reason,
      evidenceCount: item.evidence?.length ?? 0,
      evidence: item.evidence ?? [],
    });
  }
  for (const item of brief.candidateDeepDive?.rows ?? []) {
    if (!/language/i.test(`${item.lane} ${item.reason}`)) continue;
    rows.push({
      name: item.name,
      sourceLayer: "candidate deep-dive",
      decision: item.decision,
      status: ["继续观察", "信号复核", "候选补证"].includes(item.decision)
        ? "watchlist"
        : item.decision === "排除主表"
          ? "excluded"
          : "boundary",
      reason: item.reason,
      evidenceCount: item.evidence?.length ?? 0,
      evidence: item.evidence ?? [],
    });
  }

  const byName = new Map();
  for (const row of rows) {
    const key = row.name.toLowerCase().replace(/\s+(ab|b\.v\.)$/i, "").trim();
    const current = byName.get(key);
    if (!current) {
      byName.set(key, { ...row, sources: [row.sourceLayer], decisions: [row.decision], evidence: row.evidence.slice(0, 6) });
      continue;
    }
    current.sources.push(row.sourceLayer);
    current.decisions.push(row.decision);
    current.evidenceCount += row.evidenceCount;
    current.evidence.push(...row.evidence);
    if (current.status !== "core" && row.status === "core") current.status = "core";
    if (current.status === "watchlist" && row.status === "boundary" && /边界|暂缓|B2B|产品边界/.test(`${row.decision} ${row.reason}`)) current.status = "boundary";
    if (current.status === "watchlist" && row.status === "boundary" && /长尾留档|targeted Exa|不升级主矩阵|不升级主表/.test(`${row.decision} ${row.reason}`)) current.status = "boundary";
    if (!/已入主表/.test(current.decision) && row.decision === "已入主表") current.decision = row.decision;
    if (row.reason && !current.reason.includes(row.reason)) current.reason = `${current.reason} / ${row.reason}`;
  }

  const uniqueRows = [...byName.values()].map((row) => ({
    ...row,
    sources: [...new Set(row.sources)],
    decisions: [...new Set(row.decisions)],
    evidence: [...new Map(row.evidence.map((item) => [item.url, item])).values()].slice(0, 8),
  }));

  return {
    generatedAt: new Date().toISOString(),
    method:
      "Combines the core language-exchange matrix, Exa language long-tail discovery, and targeted candidate deep-dive results so HelloTalk/Tandem-adjacent coverage is reviewed in one place.",
    totalUnique: uniqueRows.length,
    coreCount: uniqueRows.filter((row) => row.status === "core").length,
    watchlistCount: uniqueRows.filter((row) => row.status === "watchlist").length,
    boundaryCount: uniqueRows.filter((row) => row.status === "boundary").length,
    excludedCount: uniqueRows.filter((row) => row.status === "excluded").length,
    rows: uniqueRows.sort((a, b) => {
      const order = { core: 0, "covered-core": 1, watchlist: 2, boundary: 3, excluded: 4 };
      return (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.name.localeCompare(b.name);
    }),
  };
}

brief.languageCoverageAudit = languageCoverageAudit();

function promotionPriority({ lane, evidenceCount, amountMention = "", sourceUrl = "", reason = "" }) {
  const text = `${lane} ${amountMention} ${sourceUrl} ${reason}`;
  if (/\$\s?[\d.]+|series|seed|revenue|downloads|daily users|total users/i.test(text) && /techcrunch|fortune|businessinsider|globenewswire|sec\.gov|astrocade|nbcbayarea|ktvu/i.test(text)) {
    return "high";
  }
  if (evidenceCount >= 3 || /app store|native speaker|video chat|real dates|interactive entertainment|consumer spend/i.test(text)) {
    return "medium";
  }
  return "low";
}

function candidatePromotionQueue() {
  const integratedFinancialUrls = new Set((brief.financialSignals ?? []).flatMap((item) => (item.evidence ?? []).map((evidence) => evidence.url)));
  const fundingCandidateReviewRows = brief.discoveryScan?.fundingCandidateReview ?? [];
  const pendingFundingCandidates = fundingCandidateReviewRows.filter((row) => row.handlingStatus === "待复核候选");
  const integratedMarketRows = pendingFundingCandidates.filter((row) => integratedFinancialUrls.has(row.url)).length;
  const languageRows = (brief.languageCoverageAudit?.rows ?? [])
    .filter((row) => row.status === "watchlist")
    .map((row) => {
      const priority = promotionPriority({
        lane: "HelloTalk/Tandem adjacent",
        evidenceCount: row.evidence?.length ?? row.evidenceCount ?? 0,
        reason: row.reason,
        sourceUrl: row.evidence?.[0]?.url ?? "",
      });
      return {
        type: "language-watchlist",
        name: row.name,
        lane: "HelloTalk/Tandem adjacent",
        priority,
        currentStatus: row.status,
        promotionDecision: priority === "high" ? "优先复核升级主表" : "继续补证后再升级",
        missingEvidence: [
          "官方/商店/社媒证据",
          "增长或活跃度信号",
          "是否为消费社交而非课程/B2B 工具",
        ],
        nextAction:
          priority === "high"
            ? "补 App Store/Google Play、社媒和增长信号；若证明面向开放消费社交，升级到语言主表。"
            : "保留 watchlist；优先补官方、商店、社媒和增长证据，确认真人语伴强度。",
        amountOrSignal: row.decisions?.join(" / ") ?? row.decision,
        source: row.sources?.join(" | ") ?? row.sourceLayer,
        evidence: row.evidence ?? [],
      };
    });

  const fundingRows = pendingFundingCandidates
    .filter((row) => !integratedFinancialUrls.has(row.url))
    .map((row) => {
      const priority = promotionPriority({
        lane: row.lane,
        amountMention: row.amountMention,
        sourceUrl: row.url,
        reason: row.title,
      });
      const marketMetric = /market|consumer spend|revenue|MTCH|companion apps/i.test(`${row.title} ${row.candidateName}`);
      return {
        type: "funding-news-pending",
        name: row.candidateName,
        lane: row.lane,
        priority,
        currentStatus: row.handlingStatus,
        promotionDecision: marketMetric ? "市场口径佐证" : priority === "high" ? "优先复核升级补充融资新闻" : "继续复核",
        missingEvidence: marketMetric
          ? ["确认口径来源", "避免重复计入产品融资", "映射到市场判断"]
          : ["确认产品/公司边界", "确认金额与日期", "判断是否 AI 社交/泛娱乐或 IRL 相关"],
        nextAction: marketMetric
          ? "归入 market decision / financial background，不直接计入产品融资总额。"
          : "复核金额、日期、产品边界和社交相关性；成立则升级 supplemental funding/news。",
        amountOrSignal: row.amountMention,
        source: row.scanId,
        evidence: [
          {
            label: row.title,
            url: row.url,
          },
        ],
      };
    });

  const rows = [...languageRows, ...fundingRows].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] ?? 9) - (order[b.priority] ?? 9) || a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
  });

  return {
    generatedAt: new Date().toISOString(),
    method:
      "Unifies language watchlist products and funding/news pending discovery rows into one promotion queue, so remaining candidates have explicit priority, missing evidence, and upgrade criteria.",
    totalRows: rows.length,
    languageRows: rows.filter((row) => row.type === "language-watchlist").length,
    fundingRows: rows.filter((row) => row.type === "funding-news-pending").length,
    integratedMarketRows,
    resolvedMarketRows: fundingCandidateReviewRows.filter((row) => row.handlingStatus === "已并入市场判断").length,
    lowConfidenceMarketRows: fundingCandidateReviewRows.filter((row) => row.handlingStatus === "低可信市场口径留档").length,
    duplicateFundingRows: fundingCandidateReviewRows.filter((row) => row.handlingStatus === "已覆盖/重复佐证").length,
    highPriorityRows: rows.filter((row) => row.priority === "high").length,
    mediumPriorityRows: rows.filter((row) => row.priority === "medium").length,
    lowPriorityRows: rows.filter((row) => row.priority === "low").length,
    rows,
  };
}

brief.candidatePromotionQueue = candidatePromotionQueue();

function languageSimilarityAudit() {
  const mainLanguage = brief.clusters.find((cluster) => cluster.id === "language");
  const mainByName = new Map((mainLanguage?.items ?? []).map((item) => [item.name, item]));
  const coverageRows = brief.languageCoverageAudit?.rows ?? [];

  const rows = coverageRows.map((row) => {
    const item = mainByName.get(row.name);
    const text = `${row.name} ${item?.signal ?? ""} ${item?.channel ?? ""} ${item?.differentiator ?? ""} ${row.reason}`.toLowerCase();
    const features = [
      /language|语言|native speaker|语伴|口语|fluency|文化|cross-cultural/.test(text) ? "语言交换核心" : null,
      /partner|friends|friend|chat|voice|video|room|live|conversation|真人|speaker|语音|视频|房间/.test(text) ? "真人互动" : null,
      /community|moments|topics|group|社群|社区|内容|笔友/.test(text) ? "社区/内容网络" : null,
      /ai|translation|翻译|tutor|assistant|roaming|map|地图/.test(text) ? "AI/地图/翻译增强" : null,
      /nearby|proximity|face-to-face|in-person|附近|线下|地图/.test(text) ? "附近/线下潜力" : null,
      /app store|google play|官网|seo|应用商店|early access/.test(text) ? "可触达渠道" : null,
    ].filter(Boolean);
    const score = features.length + (row.status === "core" ? 2 : row.status === "watchlist" ? 1 : 0) + (item?.evidenceScore?.grade === "A" || item?.evidenceScore?.grade === "B" ? 1 : 0);
    const similarity =
      row.name === "HelloTalk" || row.name === "Tandem"
        ? "基准产品"
        : score >= 7
          ? "高度相似"
          : score >= 5
            ? "相邻变体"
            : "边界/待补";
    const difference =
      item?.differentiator ??
      (row.status === "watchlist" ? "定位接近语言交换，但增长/官方/消费社交证据仍需补强。" : "语言学习或社交边界样本，需继续验证真人语伴和增长证据。");
    return {
      name: row.name,
      status: row.status,
      decision: row.decision,
      similarity,
      score,
      features,
      difference,
      growthSignal: item?.signal ?? row.reason,
      channel: item?.channel ?? row.sources.join(" / "),
      evidenceGrade: item?.evidenceScore?.grade ?? "",
      evidenceCount: row.evidenceCount,
      sources: row.sources,
      evidence: row.evidence,
      nextCheck:
        similarity === "高度相似" || similarity === "基准产品"
          ? "可进入 HelloTalk/Tandem 类竞品展示；下一步补商业化和留存口径。"
          : similarity === "相邻变体"
            ? "保留在相邻竞品；下一步补官网/商店/社媒和增长证据。"
            : "保留边界或 watchlist；下一步确认是否是真人语伴社交而非纯学习工具。",
    };
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return {
    generatedAt: new Date().toISOString(),
    method:
      "Scores HelloTalk/Tandem adjacency by language-exchange core, real-human interaction, community/content network, AI/map/translation enhancement, nearby/offline potential, reachable channel evidence, and curated status.",
    totalRows: rows.length,
    baselineProducts: rows.filter((row) => row.similarity === "基准产品").length,
    highlySimilar: rows.filter((row) => row.similarity === "高度相似").length,
    adjacentVariants: rows.filter((row) => row.similarity === "相邻变体").length,
    boundaryRows: rows.filter((row) => row.similarity === "边界/待补").length,
    bySimilarity: Object.values(rows.reduce((acc, row) => {
      acc[row.similarity] ??= { similarity: row.similarity, count: 0 };
      acc[row.similarity].count += 1;
      return acc;
    }, {})),
    rows,
  };
}

brief.languageSimilarityAudit = languageSimilarityAudit();

function languageGrowthChannelEvidenceMap() {
  const languageCluster = brief.clusters.find((cluster) => cluster.id === "language");
  const curatedByName = new Map((languageCluster?.items ?? []).map((item) => [item.name, item]));
  const similarityByName = new Map((brief.languageSimilarityAudit?.rows ?? []).map((item) => [item.name, item]));
  const domainAliases = {
    "Conversation Exchange": ["conversationexchange.com"],
    SewaYou: ["sewayou.com"],
    Talk4Now: ["talk4now.com"],
    meeTalk: ["meetalk.com"],
    LangPal: ["lang-pal.com"],
    MatchaLingua: ["matchalingua.com"],
    RoamChat: ["roamchat.co"],
    SpeakyParrot: ["speakyparrot.com"],
    Fluently: ["fluently.chat", "getfluently.app"],
    Lingbe: ["lingbe.com"],
    Slowly: ["slowly.app"],
    LingoPraxis: ["lingopraxis.com"],
  };
  const manualAliases = {
    "Conversation Exchange": ["conversation exchange", "conversationexchange"],
    SewaYou: ["sewayou", "sewa you"],
    Talk4Now: ["talk4now", "talk 4 now"],
    meeTalk: ["meetalk", "mee talk"],
    LangPal: ["langpal", "lang-pal"],
    MatchaLingua: ["matchalingua", "matcha lingua"],
    RoamChat: ["roamchat", "roam chat"],
    SpeakyParrot: ["speakyparrot", "speaky parrot"],
    Fluently: ["fluently"],
    Lingbe: ["lingbe"],
    Slowly: ["slowly"],
    LingoPraxis: ["lingopraxis", "lingo praxis"],
  };
  function resultMatchesProduct(productName, result) {
    const text = evidenceIdentityText(result);
    const domains = domainAliases[productName] ?? [];
    if (domains.some((domain) => String(result.url ?? "").toLowerCase().includes(domain))) return true;
    return (manualAliases[productName] ?? [productName.toLowerCase()]).some((alias) => text.includes(alias));
  }
  function channelTagsFor(results, curatedItem) {
    const text = [
      curatedItem?.channel,
      curatedItem?.signal,
      ...results.flatMap((result) => [result.title, result.url, result.highlight]),
    ].join(" ").toLowerCase();
    return [
      /app store|apps\.apple\.com|ios/.test(text) ? "App Store / iOS" : null,
      /google play|play\.google\.com|android/.test(text) ? "Google Play / Android" : null,
      /seo|website|web|官网|organic|search/.test(text) ? "SEO / 官网自然流量" : null,
      /social|instagram|tiktok|twitter|x\.com|facebook|youtube|community|telegram|discord/.test(text) ? "社媒/社区" : null,
      /prnewswire|press release|launch|news|award|media/.test(text) ? "PR / 媒体发布" : null,
      /nearby|face to face|in-person|map|location|附近|线下/.test(text) ? "附近/线下场景" : null,
      /ai|translation|tutor|assistant/.test(text) ? "AI/翻译增强" : null,
      /users|downloads|visits|traffic|growth|rank|reviews|ratings/.test(text) ? "规模/增长口径" : null,
    ].filter(Boolean);
  }
  function evidenceStrength(productName, matchedResults, curatedItem) {
    const text = [
      curatedItem?.signal,
      curatedItem?.channel,
      ...matchedResults.flatMap((result) => [result.title, result.url, result.highlight]),
    ].join(" ").toLowerCase();
    const officialOrStore = matchedResults.filter((result) => ["官网", "App Store", "Google Play"].includes(officialLabelForUrl(result.url))).length;
    if (/60m|200\+ countries|96% natural|millions|million|downloads|traffic|visits|rank|reviews|ratings/i.test(text) || officialOrStore >= 2) return "strong";
    if (matchedResults.length >= 2 || officialOrStore >= 1) return "usable";
    return "thin";
  }
  const rows = (languageGrowthChannelDeepDive.searches ?? []).map((search) => {
    const curatedItem = curatedByName.get(search.productName);
    const matchedResults = (search.results ?? []).filter((result) => resultMatchesProduct(search.productName, result));
    const displayResults = matchedResults.length ? matchedResults : (search.results ?? []).slice(0, 2);
    const tags = channelTagsFor(displayResults, curatedItem);
    const strength = evidenceStrength(search.productName, matchedResults, curatedItem);
    const similarity = similarityByName.get(search.productName);
    return {
      name: search.productName,
      category: search.category,
      queryId: search.id,
      requestId: search.requestId,
      curatedStatus: curatedItem ? "主表语言产品" : "语言长尾留档",
      similarity: similarity?.similarity ?? "长尾/边界",
      evidenceStrength: strength,
      growthSignal: curatedItem?.signal ?? "targeted Exa 结果显示存在语言交换/语伴相关产品证据，仍需继续补规模和留存。",
      channelSignal: curatedItem?.channel ?? "targeted Exa 以官网、商店、社媒、PR 和搜索结果补渠道证据。",
      channelTags: [...new Set(tags.length ? tags : ["官网/自然发现"])],
      matchedResults: matchedResults.length,
      totalResults: search.results?.length ?? 0,
      nextCheck:
        strength === "strong"
          ? "可展示为语言交换相邻产品；下一轮补留存、收入或城市/国家覆盖口径。"
          : strength === "usable"
            ? "可作为展示备选；下一轮优先补独立增长数字和社媒活跃度。"
            : "保留为 thin evidence；继续用 monitor 或官方渠道验证是否值得升级。",
      evidence: displayResults.slice(0, 5).map((result) => ({
        label: officialLabelForUrl(result.url) === "新闻/第三方" ? result.title : officialLabelForUrl(result.url),
        url: result.url,
      })),
    };
  });
  return {
    generatedAt: languageGrowthChannelDeepDive.generatedAt ?? null,
    source: languageGrowthChannelDeepDive.source ?? "https://api.exa.ai/search",
    purpose: languageGrowthChannelDeepDive.purpose ?? "Targeted Exa language growth/channel pass.",
    searches: languageGrowthChannelDeepDive.searches?.length ?? 0,
    resultRows: (languageGrowthChannelDeepDive.searches ?? []).reduce((sum, search) => sum + (search.results?.length ?? 0), 0),
    productRows: rows.length,
    strongRows: rows.filter((row) => row.evidenceStrength === "strong").length,
    usableRows: rows.filter((row) => row.evidenceStrength === "usable").length,
    thinRows: rows.filter((row) => row.evidenceStrength === "thin").length,
    byChannelTag: Object.values(rows.flatMap((row) => row.channelTags).reduce((acc, tag) => {
      acc[tag] ??= { tag, count: 0 };
      acc[tag].count += 1;
      return acc;
    }, {})).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag)),
    rows,
  };
}

brief.languageGrowthChannelDeepDive = languageGrowthChannelEvidenceMap();

function irlCoverageAudit() {
  const rows = [];
  const irlCluster = brief.clusters.find((cluster) => cluster.id === "irl");
  for (const item of irlCluster?.items ?? []) {
    rows.push({
      name: item.name,
      sourceLayer: "competitive matrix",
      status: /边界/.test(item.irl) ? "core-boundary" : "core",
      lane: item.irl,
      decision: "已入 IRL 主表",
      reason: item.signal,
      evidence: item.evidence ?? [],
    });
  }
  for (const item of brief.fundingTimeline ?? []) {
    if (!/IRL|dating|travel|events|real-world|offline/i.test(item.lane)) continue;
    rows.push({
      name: item.name,
      sourceLayer: "funding/news timeline",
      status: "funding-news",
      lane: item.lane,
      decision: "已入近两年 IRL/边界事件",
      reason: item.amount,
      evidence: [{ label: item.amount, url: item.url }],
    });
  }
  for (const item of brief.discoveryScan?.supplementalFundingNews ?? []) {
    if (!/IRL|dating|travel|events|real-world|offline|matchmaking/i.test(`${item.lane} ${item.name} ${item.amount}`)) continue;
    rows.push({
      name: item.name,
      sourceLayer: "supplemental funding/news",
      status: "supplemental-signal",
      lane: item.lane,
      decision: "补充 IRL/AI dating 信号",
      reason: item.amount,
      evidence: [{ label: item.title ?? item.amount, url: item.url }],
    });
  }
  for (const item of brief.candidateReview?.recentSignalReview ?? []) {
    if (item.lane !== "线下真人社交") continue;
    rows.push({
      name: item.name,
      sourceLayer: "monitor recent",
      status: item.status === "new" ? "monitor-new" : "monitor-known",
      lane: item.lane,
      decision: item.decision,
      reason: item.action ?? item.reason,
      evidence: item.evidence ?? [],
    });
  }

  const byName = new Map();
  for (const row of rows) {
    const rawKey = normalizedEventName(row.name);
    const key = rawKey
      .replace(/\b(can|a|dutch|app|save|brits|from|swiping|past|our|dismal|dating|scene|independent|launches|across|london|global|insights|raises|million|series|expand|platform|united|states|techcrunch|airbnb|backed|to|take|group|travel|with)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const stableKey =
      /wemeet/.test(rawKey) ? "wemeet-by-weroad" : /breeze/.test(rawKey) ? "breeze" : /weroad/.test(rawKey) ? "weroad" : /tinder/.test(rawKey) ? "tinder" : /bumble/.test(rawKey) ? "bumble" : key;
    const current = byName.get(stableKey);
    if (!current) {
      byName.set(stableKey, {
        ...row,
        sources: [row.sourceLayer],
        decisions: [row.decision],
        evidence: row.evidence.slice(0, 8),
      });
      continue;
    }
    current.sources.push(row.sourceLayer);
    current.decisions.push(row.decision);
    current.evidence.push(...row.evidence);
    if (row.status === "core" && current.status !== "core") current.status = "core";
    if (row.status === "core-boundary" && !["core"].includes(current.status)) current.status = "core-boundary";
    if (row.reason && !current.reason.includes(row.reason)) current.reason = `${current.reason} / ${row.reason}`;
  }

  const uniqueRows = [...byName.values()].map((row) => ({
    ...row,
    sources: [...new Set(row.sources)],
    decisions: [...new Set(row.decisions)],
    evidence: [...new Map(row.evidence.map((item) => [item.url, item])).values()].slice(0, 8),
  }));

  return {
    generatedAt: new Date().toISOString(),
    method:
      "Combines IRL/offline-human products from the competitive matrix, near-two-year funding/news timeline, supplemental AI dating/IRL signals, and monitor recent lane routing.",
    totalUnique: uniqueRows.length,
    coreCount: uniqueRows.filter((row) => row.status === "core").length,
    boundaryCount: uniqueRows.filter((row) => row.status === "core-boundary").length,
    fundingNewsCount: uniqueRows.filter((row) => row.sources.includes("funding/news timeline")).length,
    monitorCount: uniqueRows.filter((row) => row.sources.includes("monitor recent")).length,
    rows: uniqueRows.sort((a, b) => {
      const order = { core: 0, "core-boundary": 1, "funding-news": 2, "supplemental-signal": 3, "monitor-known": 4, "monitor-new": 5 };
      return (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.name.localeCompare(b.name);
    }),
  };
}

brief.irlCoverageAudit = irlCoverageAudit();

function officialFor(name) {
  const normalized = name.toLowerCase();
  return officialItems
    .filter((item) => {
      const itemName = item.name.toLowerCase();
      return normalized.includes(itemName) || itemName.includes(normalized);
    })
    .flatMap((item) => item.evidence ?? []);
}

function evidenceTypeFor(url = "") {
  const value = String(url).toLowerCase();
  let host = "";
  try {
    host = new URL(value).hostname.replace(/^www\./, "");
  } catch {
    host = "";
  }
  if (value.includes("apps.apple.com")) return "App Store";
  if (value.includes("play.google.com")) return "Google Play";
  if (value.includes("linkedin.com")) return "LinkedIn";
  if (
    /reddit|discord|tiktok|instagram|youtube|twitter|facebook|medium|substack|threads/.test(value) ||
    host === "x.com"
  ) {
    return "Social/community";
  }
  if (/techcrunch|businesswire|prnewswire|crunchbase|signalbase|svpost|forbes|venturebeat|news|report|rankings|market/.test(value)) return "News/third-party";
  return "Official/web";
}

function mentioned(text, name) {
  return name
    .split("/")
    .map((part) => part.trim().toLowerCase())
    .some((part) => part && text.includes(part));
}

function evidenceScoreFor(item) {
  const official = officialFor(item.name);
  const hasOfficial = official.length > 0;
  const growthText = `${item.signal} ${item.channel}`;
  const hasFunding =
    mentioned(timelineText, item.name) ||
    /\$|融资|series|seed|funding|revenue|收入|访问量|downloads|arr|用户|自然增长|增长|月访问量|下载/i.test(growthText);
  const hasFinancial = mentioned(financialText, item.name);
  const hasPeople = mentioned(peopleText, item.name);
  const strongIrl = /最高|高/.test(item.irl);
  const evidenceCount = (item.evidence?.length ?? 0) + official.length;

  let score = 0;
  if (item.evidence?.length > 0) score += 1;
  if (hasOfficial) score += 2;
  if (hasFunding) score += 2;
  if (hasFinancial) score += 1;
  if (hasPeople) score += 1;
  if (strongIrl) score += 1;
  if (evidenceCount >= 4) score += 1;

  const grade = score >= 7 ? "A" : score >= 5 ? "B" : score >= 3 ? "C" : "D";
  const label = grade === "A" ? "A 强证据" : grade === "B" ? "B 可展示" : grade === "C" ? "C 待补强" : "D 仅观察";
  const reasons = [];
  if (hasOfficial) reasons.push("有官网/应用商店/社媒");
  if (hasFunding) reasons.push("有融资/增长/收入新闻");
  if (hasFinancial) reasons.push("有 financial report/市场规模口径");
  if (hasPeople) reasons.push("有 people/team/GTM 线索");
  if (strongIrl) reasons.push("IRL 强相关");
  if (!reasons.length) reasons.push("基础产品证据");
  return { score, grade, label, reasons, evidenceCount };
}

for (const cluster of brief.clusters) {
  for (const item of cluster.items) {
    item.evidenceScore = evidenceScoreFor(item);
  }
}

function reviewCoversUrl(review, url) {
  return (review.evidence ?? []).some((item) => item.url === url);
}

function monitorSignalIntent(item) {
  const text = `${item.monitorId} ${item.monitorLabel} ${item.title} ${item.highlight}`.toLowerCase();
  if (/research-risk|safety|lawsuit|regulation|teen|loneliness|paper|research/.test(text)) {
    return {
      lane: "研究/政策风险",
      upgradePath: "补 research risk，不进产品主表",
      action: "用于修正 AI companion 安全、青少年和依赖风险判断。",
    };
  }
  if (/irl|offline|meetup|dinner|date|dating|travel|event|friends|real-world|breeze|weroad|timeleft|pie|222|meet5/.test(text)) {
    return {
      lane: "线下真人社交",
      upgradePath: "优先判断是否补 IRL 产品或融资/新闻时间线",
      action: "如果出现新产品、融资金额或城市扩张，优先升级到 IRL 主线。",
    };
  }
  if (/coverage-signal-watchlist|status|soul ai|locpats|wearable ai|ai friend|official gap|signal watchlist/.test(text)) {
    return {
      lane: "覆盖缺口信号",
      upgradePath: "补 source linkage / candidate deep-dive / funding-news review",
      action: "用于追踪未闭环 signal-candidate；出现融资、上线、下载、收入或官方证据时再升级。",
    };
  }
  if (/paid-acquisition|付费获客|投放|advertis|ads library|creative|cac|roas|user acquisition|app install ads|marketing spend/.test(text)) {
    return {
      lane: "投放/付费获客证据",
      upgradePath: "补 paid-acquisition evidence audit",
      action: "用于判断是否存在明确广告投放、素材、获客成本、ROAS 或投放后下载变化；不直接升级产品或融资结论。",
    };
  }
  if (/funding|raised|series|seed|revenue|commercial|startup|venture|round/.test(text)) {
    return {
      lane: "融资/商业化",
      upgradePath: "补 funding timeline 或 funding-news review",
      action: "核对日期、金额、轮次和证据源后再升级进近两年融资/新闻统计。",
    };
  }
  if (/hellotalk|tandem|language|native speaker|cross-cultural|linguado|sewayou|hilokal|slowly/.test(text)) {
    return {
      lane: "语言交换/跨文化社交",
      upgradePath: "补语言交换长尾或主表功能差异",
      action: "优先补增长信号、渠道和是否有线下面基/地图/语音房能力。",
    };
  }
  if (/china|chinese|minimax|talkie|polybuzz|hiwaifu|link(y|ie)|overseas|export/.test(text)) {
    return {
      lane: "中国 AI 社交出海",
      upgradePath: "补 AI companion/export 观察",
      action: "核对下载、收入、海外渠道和角色经济信号。",
    };
  }
  if (/company-new|launch|new companies|ai social|companion|roleplay|character|chatbot/.test(text)) {
    return {
      lane: "新公司/新产品",
      upgradePath: "进入 source linkage 或 candidate deep-dive",
      action: "先进入候选补证，满足证据阈值后再进主表。",
    };
  }
  return {
    lane: "背景/低相关",
    upgradePath: "留档",
    action: "保留在 monitor 近窗队列，暂不升级。",
  };
}

brief.candidateReview.latestAlertReview = brief.candidateReview.latestAlertReview ?? [];

function monitorSignalResolution(item) {
  const text = `${item.title} ${item.url} ${item.highlight} ${item.monitorLabel}`.toLowerCase();
  if (/sesame ai launches ios app|headlinez\.news\/sesame-ai/.test(text)) {
    return {
      decision: "已覆盖/重复佐证",
      reason:
        "Headlinez 是 Sesame iOS app / $250M Series B 的二次转述，近窗里已有 TechCrunch 强来源；保留为 coverage signal 佐证，不新增产品卡，也不重复计入融资统计。",
    };
  }
  if (/pophie hits kickstarter|insbotics|pophie/.test(text)) {
    return {
      decision: "边界观察",
      reason:
        "Pophie 是 Kickstarter 上线的 AI companion / AI lifeform 硬件与泛娱乐边界信号，当前缺少 VC 融资、下载/收入或真人社交证据；保留在 AI wearable/friend monitor，不升级主表或融资时间线。",
    };
  }
  if (/social\.plus|make your community the storefront|introducing commerce/.test(text)) {
    return {
      decision: "暂缓/B2B 基础设施",
      reason:
        "social.plus Commerce 是社区商业化/SDK 产品更新，更偏 B2B community infrastructure；不是 consumer AI social app，也不包含线下真人社交或融资新闻，保留为低优先级背景信号。",
    };
  }
  if (/reactor emerges from stealth|reactor raises \$59m|real-time ai worlds/.test(text)) {
    return {
      decision: "已覆盖/重复佐证",
      reason:
        "Reactor $59M seed + Series A 已在近窗 monitor 和融资/商业化复核里出现；这是实时 AI worlds / generative video infrastructure 融资事件，作为 AI 泛娱乐基础设施边界信号保留，不重复计入核心 consumer social 产品。",
    };
  }
  if (/4月ai月报|全球原生ai下载3\.65亿|36kr|36氪/.test(text)) {
    return {
      decision: "市场口径佐证",
      reason:
        "36氪月报提供全球原生 AI app 下载与中国大陆投放/下载变化口径，可用于校准 AI companion/export 市场热度；不是单一产品融资或新增社交 app，不进入主表。",
    };
  }
  if (/applovin launches its own tiktok rival|applovin launches gist|gist, a social app/.test(text)) {
    return {
      decision: "边界观察",
      reason:
        "AppLovin/Gist 是 adtech 公司推出的 invite-only 内容/生活方式社交 feed，和消费社交相邻，但当前缺少 AI 社交、线下真人社交或融资事件证据；保留在 residual watchlist，不升级主矩阵。",
    };
  }
  if (/meta is trying to turn ai glasses into a subscription business|ai glasses into a subscription business/.test(text)) {
    return {
      decision: "市场口径佐证",
      reason:
        "Meta AI 眼镜订阅化更像 wearable distribution / monetization 背景信号，可用于校准 AI companion 与硬件入口的商业模式变化；当前不是新的 consumer social app、线下真人社交产品或独立融资事件，不进入主表。",
    };
  }
  if (/travelandtourworld.*weroad|weroad ignites massive europe-to-america adventure tourism revolution/.test(text)) {
    return {
      decision: "已覆盖/重复佐证",
      reason:
        "Travel and Tour World 是对 WeRoad 美国扩张与旅游叙事的二次放大，近窗里已保留官方博客和 TechCrunch 关于 WeRoad 融资及入美扩张的更强证据；不重复升级主表或时间线。",
    };
  }
  if (/partiful launches ticketing|partiful is turning party invites into a payments business|startupfortune.*partiful-is-turning-party-invites-into-a-payments-business|built-in ticketing/.test(text)) {
    return {
      decision: "已覆盖/继续观察",
      reason:
        "Partiful 已在 IRL 主表、官方覆盖和边界融资样本中保留；这次内置票务上线说明其从 invite graph 向线下活动交易延伸，属于值得继续追踪的商业化更新，但不需要重复新增产品卡或融资事件。",
    };
  }
  if (/bumble set to launch plans|bumble is launching a new paid group-dating feature|paid irl date feature|group-dating feature called plans/.test(text)) {
    return {
      decision: "已覆盖/继续观察",
      reason:
        "Bumble Plans 是头部 dating app 把付费线下组局做成产品化入口的 IRL 商业化信号，说明约会平台正在把线上匹配延伸到线下履约；但 Bumble 已在财报/AI dating 边界里覆盖，这次更适合作为 IRL 需求与 monetization 观察，不重复升级主表或融资时间线。",
    };
  }
  if (/promova is quietly becoming the most addictive ai language app|undercode news.*promova/.test(text)) {
    return {
      decision: "暂缓",
      reason:
        "Promova 更接近 AI language-learning app 增长信号，当前缺少陌生人连接、跨文化真人社交或线下面基证据；先保留在语言长尾观察，不升级到 HelloTalk/Tandem 相邻主表。",
    };
  }
  if (/hark raises \$700m series a|secretive '?universal'? ai interface|techcrunch.*hark-raises-700m-series-a/.test(text)) {
    return {
      decision: "暂缓/B2B 基础设施",
      reason:
        "Hark 的 7 亿美元 Series A 指向通用 AI interface / agent 平台级叙事，融资规模大但不属于 consumer AI social、AI companion 或 IRL 社交产品；保留为资本市场背景，不进入核心主线。",
    };
  }
  if (/sekai raises \$20m series a|sekai raises \$20 million|sekai raises \$26 million|social platform for ai-created mini-apps|15 million ai mini apps|sekai-raises-20m-series-a-ai-apps|axios.*sekai-mini-app-startup-funding|pulse2.*sekai-raises-26-million/.test(text)) {
    return {
      decision: "候选升级",
      reason:
        "Sekai 连续出现 2000 万/2600 万美元融资与 AI mini-app social platform 叙事，说明其具备 AI entertainment / creation 社区潜力；但轮次口径和融资金额在不同媒体间仍有差异，先保留为候选升级，后续补官方产品形态、社区互动机制和 round terms，再决定是否升级进主表或融资时间线。",
      };
  }
  if (/town'?s deeply personal ai assistants|town builds ai assistants|forerunner.*town|andreessen horowitz.*town/.test(text)) {
    return {
      decision: "候选升级",
      reason:
        "Town 的 5500 万美元融资和具人格化 avatar 的 AI assistants 与 AI companion 主线相邻，具备进入融资/产品深挖的价值；但当前更像 personal AI assistant/company thesis 信号，仍需补官方产品形态、社交互动机制和 consumer 分发证据，再决定是否升级进主表或融资时间线。",
    };
  }
  if (/town raises \$55m to expand personalized ai assistant|ventureburn\.com\/town-raises-55m-to-expand-personalized-ai-assistant/.test(text)) {
    return {
      decision: "候选升级",
      reason:
        "Town 的 5500 万美元融资与 personalized AI assistant 叙事和 AI companion 主线相邻，说明资本继续押注具备人格化、长期记忆和 workflow integration 的 assistant 产品；但当前仍更像 personal AI assistant/company thesis 信号，需补官方产品形态、社交互动机制和 consumer 分发证据后再决定是否升级进主表或融资时间线。",
    };
  }
  if (/board, the new game startup from mirror founder brynn putnam|techcrunch.*board-the-new-game-startup|board.*raises \$20m/.test(text)) {
    return {
      decision: "暂缓/泛娱乐边界",
      reason:
        "Board 的 2000 万美元融资和桌游式社交玩法说明其处在 AI/游戏化娱乐的相邻边界，但当前更像游戏 startup 而非 AI social app、AI companion 或线下真人社交主线；保留为泛娱乐融资观察，不进入核心主表。",
    };
  }
  if (/nectar social raises \$30m|rebrands itself as nectar agent|demandgenreport.*nectar-social-raises-30m|marketing operating system nectar social/.test(text)) {
    return {
      decision: "暂缓/B2B 社交营销",
      reason:
        "Nectar Social 的 3000 万美元融资和更名为 Nectar Agent 说明 agentic social marketing 赛道升温，但产品定位仍是品牌营销操作系统，不是 consumer AI social app、语言交换或 IRL 真人社交产品；继续作为 B2B 边界融资样本保留。",
    };
  }
  if (/aippy raises tens of millions|aippy.*250 million valuation|ai-native interactive entertainment|technode\.global\/prnasia\/aippy-raises/.test(text)) {
    return {
      decision: "候选升级",
      reason:
        "Aippy 的融资与 AI-native interactive entertainment 叙事对 AI 泛娱乐主线相关，说明资本正在押注互动内容形态；下一步应补官方产品形态、用户互动机制和是否具备社区/社交层证据，再决定是否升级进主表或融资时间线。",
    };
  }
  if (/meta develops ai pendant|ai-powered pendant|expands wearables lineup|wpnews\.pro\/news\/meta-develops-ai-pendant/.test(text)) {
    return {
      decision: "市场口径佐证",
      reason:
        "Meta AI pendant 是 AI wearable / ambient companion 入口的市场背景信号，能辅助判断硬件入口和订阅化方向；当前不是独立 consumer social app、线下真人社交产品或融资事件，不升级主表或融资时间线。",
    };
  }
  if (/teamily ai officially enters the singapore market|personal ai agent os|self-improving ai\+human social network/.test(text)) {
    return {
      decision: "边界观察/重复佐证",
      reason:
        "Teamily AI 进入新加坡是 Personal AI Agent OS / AI+human social network 的发布与转载信号；已有 PR Newswire 原始来源在 monitor 台账中，本次 Siam News Network 不构成新融资、独立 consumer social app 升级证据或线下真人社交样本，继续保留为 AI social 边界观察。",
    };
  }
  if (/breeze sees growing but gradual success after london expansion|breeze, a dutch dating app that launched in europe in 2020 and expanded to london in 2025/.test(text)) {
    return {
      decision: "已覆盖/继续观察",
      reason:
        "Breeze 已在 IRL 主表、官方覆盖、公司背景和近两年 IRL 边界事件中保留；这篇后续报道主要补充伦敦扩张后的履约和增长叙事，适合作为已覆盖样本继续观察，不重复新增产品卡或融资事件。",
    };
  }
  if (/minimax reports big growth as it plans mainland china listing|fast-growing international business and new model as it eyes new listing|minimax is on the charge after it revealed major growth/.test(text)) {
    return {
      decision: "已覆盖/继续观察",
      reason:
        "MiniMax / Talkie 已在中国 AI 社交出海与 AI companion 主线中保留，既有 SCMP 等证据已覆盖其海外增长与 consumer app 变现路径；这次 Mainland China listing 跟进更像同一增长叙事的补充佐证，继续观察即可，不重复升级融资时间线。",
    };
  }
  if (/china.?s top two large model firms seeking dual listing|dual listing in hong kong and chinese mainland|搜狐网/.test(text)) {
    return {
      decision: "已覆盖/继续观察",
      reason:
        "这条双重上市跟进延续的是 MiniMax 等中国 AI 公司出海与资本化叙事，和既有中国 AI 社交出海观察重合；当前更适合作为已覆盖公司的资本市场补充佐证，不单独升级融资时间线。",
    };
  }
  if (/the ai tutor trick that gets language learners talking|talkpal is one of the tools built around that gap|private space to rehearse out loud/.test(text)) {
    return {
      decision: "暂缓",
      reason:
        "这条信号更像 AI tutor / 口语练习工具的通用增长叙事，强调私密练习和语言学习效率，而不是陌生人连接、跨文化真人社交或线下见面；先作为语言学习边界信号留档，不升级到语言社交主表。",
    };
  }
  if (/uc berkeley graduate creates ai-powered app to make learning korean more immersive|how teuida turns language lessons into real-life simulations|venture that emerged became teuida/.test(text)) {
    return {
      decision: "暂缓",
      reason:
        "TEUIDA 已被识别为有增长势头的 AI Korean-learning app，但核心证据仍偏沉浸式课程与 AI 口语练习，不是陌生人社交或跨文化真人连接产品；保留在语言增长 watchlist，等出现社区、配对或线下连接证据后再升级。",
    };
  }
  if (/tiktok's new events app rewards users for generating buzz about big events|dedicated social event apps : tiktok pro events|tiktok pro events is arriving ahead of the 2026 fifa world cup|new standalone app from the social media platform that's dedicated to social events/.test(text)) {
    return {
      decision: "边界观察",
      reason:
        "TikTok Pro Events 说明头部内容平台正在把赛事和文化活动做成独立事件入口，属于 IRL/events 相邻信号；但它更像平台侧活动增长工具，不是新的 AI social app、AI companion 或独立融资事件，因此保留为边界观察。",
    };
  }
  if (/yaracircle is a social platform that turns strangers into genuine friends|ai-powered shared experiences called pulse, orbits & sparks|our ai companion yara learns from your conversations/.test(text)) {
    return {
      decision: "候选升级",
      reason:
        "YaraCircle 同时具备 AI companion、陌生人配对、shared experiences 和 real-world events 叙事，和 AI social + IRL 真人连接主线高度相关；目前仍缺融资、下载和更强第三方覆盖，先进入候选升级与人工复核队列。",
    };
  }
  if (/eat no solo|eating alone is becoming the norm|dinner with a stranger|spontaneous meals and drinks/.test(text)) {
    return {
      decision: "候选升级",
      reason:
        "Eat No Solo 直接命中 solo dining / shared table 的线下真人社交需求，属于值得关注的 IRL 新样本；但目前证据主要是媒体故事和区域性上线描述，仍需补官网、城市覆盖、增长或融资信息后再决定是否进入核心主表。",
    };
  }
  if (/awestruck: the world's first ai for your free time|awestruck is the world's first ai for your free time|finds the one experience you will love nearby and books it in under a minute/.test(text)) {
    return {
      decision: "候选升级",
      reason:
        "Awestruck 把 AI 推荐、附近活动发现和即时预订结合到 free-time planning 场景，和 IRL 真人体验分发主线高度相关；但目前主要还是单篇产品报道，仍需补官方产品页、城市覆盖、用户规模或融资信息后再决定是否升级进核心 IRL 主表。",
    };
  }
  if (/partiful threw its own party|partiful hosted a party during new york tech week|the social startup recently launched ticketing and threw a party/.test(text)) {
    return {
      decision: "已覆盖/继续观察",
      reason:
        "Partiful 已在 IRL 主表、官方覆盖和近期票务商业化更新中保留；这条纽约 Tech Week 派对报道更像品牌势能与线下渗透的补充佐证，说明其正从邀请工具延伸为更强的线下活动入口，但不需要重复新增产品卡或融资事件。",
    };
  }
  if (/can we swipe our way to friendship|friendship apps and curated dinners|victory point cafe in berkeley/.test(text)) {
    return {
      decision: "背景信号",
      reason:
        "KQED 这条故事型报道强化了 friendship apps 与 curated dinners 正在承接孤独经济和线下连接需求，可作为 IRL 真人社交需求背景；但当前没有新增可升级的产品、融资或城市扩张证据，保留为 monitor 背景信号。",
    };
  }
  if (/minimax launches m3 flagship model|million-token context|coding agent battle/.test(text)) {
    return {
      decision: "已覆盖/继续观察",
      reason:
        "MiniMax 已在中国 AI 社交出海 / companion 邻接观察中有既有覆盖，这条 M3 模型发布更偏基础模型与 coding agent 竞争信号；除非后续补到社交产品形态、出海分发或 companion 互动机制，否则先作为已覆盖的公司动态继续观察。",
    };
  }
  if (/minimax m3 beats gpt-5\.5|minimax m3|chinese ai firm eyes shanghai ipo|memeburn\.com\/minimax-m3/.test(text)) {
    return {
      decision: "已覆盖/继续观察",
      reason:
        "这条 MiniMax M3 / IPO 报道仍以模型能力和资本市场预期为主，不新增更强的社交产品形态或 companion 互动证据；保留为已覆盖公司的动态补充，不重复升级主表或融资时间线。",
    };
  }
  if (/aippy announces tens of millions|aippy raises tens of millions of dollars|aippy.*250m valuation|ai game creation platform aippy/.test(text)) {
    return {
      decision: "候选升级",
      reason:
        "Aippy 的融资与 AI-native interactive entertainment 叙事对 AI 泛娱乐主线仍然相关，但现阶段更像融资与产品方向信号，尚缺官方产品形态、用户互动机制和社区/社交层证据；先保留为候选升级，不直接并入主表或时间线。",
    };
  }
  if (/news: new course from ling|growing demand from heritage learners|digital nomads|language enthusiasts worldwide|enewschannels/.test(text)) {
    return {
      decision: "暂缓",
      reason:
        "LING 这条更新更像语言学习课程与品牌扩展信号，主要面向 heritage learners、travelers 和 digital nomads；当前没有陌生人连接、跨文化真人社交或线下见面机制的新增证据，先保留在语言学习边界观察。",
    };
  }
  if (/korean language app teuida surpasses 6 million downloads|teuida surpasses 6 million downloads|ai-driven conversation simulations/.test(text)) {
    return {
      decision: "已覆盖/继续观察",
      reason:
        "Teuida 已在语言增长 watchlist 中有既有覆盖，这次 600 万下载量报道补的是增长势头而非社交机制；继续作为已覆盖的语言学习邻接信号观察，不升级到语言社交主表。",
    };
  }
  if (/language app ling challenges automated education trend|human-first approach to fluency|accessnewswire/.test(text)) {
    return {
      decision: "已覆盖/继续观察",
      reason:
        "LING 的 human-first fluency 叙事主要是语言教育定位与品牌口径补充，和既有语言长尾观察重合；当前缺少陌生人社交、跨文化配对或线下连接的新证据，继续观察即可。",
    };
  }
  if (/meta launches creator assistant ai for facebook creators|creator assistant ai|facebook creators/.test(text)) {
    return {
      decision: "已覆盖/继续观察",
      reason:
        "Meta Creator Assistant 是平台侧创作者工具升级，说明社交平台继续把 AI 用在内容解释和分发优化；但它不是新的 consumer AI social app、IRL 产品或独立融资事件，保留为 coverage signal 观察即可。",
    };
  }
  if (/meta business agent: ai agents go global|meta business agent|be there for every customer with meta business agent|about\.fb\.com\/news\/2026\/06\/meta-business-agent/.test(text)) {
    return {
      decision: "已覆盖/继续观察",
      reason:
        "Meta Business Agent 属于平台级商家对话与服务自动化能力，虽然触达 WhatsApp、Instagram 和 Messenger，但本质仍是平台生态工具更新；继续作为已覆盖的社交平台能力信号观察，不升级主表或融资时间线。",
    };
  }
  if (/what.?s happening in lisbon app launches today|portugalresident\.com\/new-whats-happening-in-lisbon-app-launches-today/.test(text)) {
    return {
      decision: "已覆盖/继续观察",
      reason:
        "Lisbon 本地活动 app 这条报道更像区域性 IRL 发现工具补充，已进入 residual IRL watchlist；在出现更强的城市扩张、融资或产品规模证据前，继续观察即可。",
    };
  }
  if (/perdata\.ai launches '?friends, not feeds'?|four-product ecosystem built to replace social media|successfuldaily\.com/.test(text)) {
    return {
      decision: "已覆盖/继续观察",
      reason:
        "Perdata.ai 这条 Friends, Not Feeds 发布已作为 residual IRL / friendship 叙事样本进入既有 monitor 台账；当前仍偏 PR 与产品口径更新，继续观察即可，不重复升级主表或融资时间线。",
    };
  }
  if (/wtmf ai|what’s the matter, friend|emotionally intelligent companion/.test(text)) {
    return {
      decision: "边界观察",
      reason:
        "WTMF AI 具备 AI companion 邻接性，但当前证据主要是公司目录式简介，缺官方产品页、分发规模、留存或更强第三方报道；先保留为边界观察，不升级进主表或融资时间线。",
    };
  }
  if (/rippl launches a social recommendation platform|trust-led discovery|the rippl effect/.test(text)) {
    return {
      decision: "边界观察",
      reason:
        "Rippl 是印度信任推荐/社交发现平台上线信号，具备社交推荐相邻性，但当前缺少 AI 能力、线下真人连接、融资或规模证据；保留为低优先级观察，不升级主表。",
    };
  }
  if (/reddit expands first-party measurement|reddit introduces new optimisation|dual attribution|reddit ads manager|mobile-measurement partners|skadnetwork/.test(text)) {
    return {
      decision: "投放平台背景",
      reason:
        "Reddit first-party measurement / Dual Attribution 是 app install 和广告归因平台能力信号，可作为 paid-acquisition evidence audit 的生态背景；当前不指向某个 AI 社交、语言交换或 IRL 产品的投放行为，不能升级为产品级明确买量证据。",
    };
  }
  if (/caden lane|d2c-times|d2c times|meta signal stack|dtc acquisition|dtc ad economics|advantage\+/.test(text)) {
    return {
      decision: "投放平台背景",
      reason:
        "Caden Lane / D2C 广告归因文章是电商品牌投放与 Meta signal stack 的平台背景信号，可用于 paid-acquisition evidence audit 的补证方法论；当前不指向 AI 社交、语言交换或 IRL 产品的投放行为，不能升级为产品级明确买量证据。",
    };
  }
  if (/paid-acquisition|付费获客|advertis|ads library|creative|cac|roas|user acquisition|app install ads|marketing spend/.test(text)) {
    return {
      decision: "投放证据候选",
      reason:
        "该信号来自投放/付费获客 monitor lane，先进入 paid-acquisition evidence audit 的补证路径；只有出现广告素材库、投放平台、CAC/ROAS、买量或投放后下载变化等明确证据时，才把对应产品从方向性渠道升级为明确投放证据。",
    };
  }
  return null;
}

function reviewForMonitorAlert(alert) {
  const text = `${alert.title} ${alert.highlight} ${alert.monitorLabel}`.toLowerCase();
  const resolved = monitorSignalResolution(alert);
  if (resolved) return resolved;
  if (/sharing a table|share the table|drinks, dinners|real-world connection|face-to-face social interaction|irl experiences/.test(text)) {
    return {
      decision: "背景信号",
      reason:
        "这条新增提醒说明线下餐桌、晚餐和面对面体验的需求回潮，可作为 IRL 社交需求背景；当前不是新的 app、融资或产品功能发布，所以保留在 monitor，不升级进主表或融资时间线。",
    };
  }
  const intent = monitorSignalIntent(alert);
  return {
    decision: "边界观察",
    reason: `自动规则未命中强升级条件；按 ${intent.upgradePath} 留在 monitor 观察，不升级主表或融资时间线。后续若出现融资、下载/收入、官方发布、明确 IRL 履约或产品级投放证据，再进入升级复核。`,
  };
}

for (const alert of monitor.alertItems ?? []) {
  if (!alert.url) continue;
  const alertReview = reviewForMonitorAlert(alert);
  const existingReview = brief.candidateReview.latestAlertReview.find((review) => reviewCoversUrl(review, alert.url));
  if (existingReview) {
    if (
      (existingReview.decision === "待复核" && /自动补齐的新提醒记录/.test(existingReview.reason ?? "")) ||
      (existingReview.decision === "投放证据候选" && alertReview.decision === "投放平台背景")
    ) {
      existingReview.decision = alertReview.decision;
      existingReview.reason = alertReview.reason;
    }
    continue;
  }
  brief.candidateReview.latestAlertReview.unshift({
    name: alert.title,
    source: `${monitor.generatedAt.slice(0, 10)} monitor · ${alert.monitorLabel}`,
    decision: alertReview.decision,
    reason: alertReview.reason,
    evidence: [
      {
        label: alert.monitorLabel,
        url: alert.url,
      },
    ],
  });
}

for (const review of brief.candidateReview.latestAlertReview ?? []) {
  const syntheticAlert = {
    title: review.name,
    url: review.evidence?.[0]?.url ?? "",
    highlight: review.reason,
    monitorLabel: review.evidence?.[0]?.label ?? review.source ?? "",
  };
  const fallback = monitorSignalResolution(syntheticAlert) ?? reviewForMonitorAlert(syntheticAlert);
  const shouldUpdate =
    (review.decision === "待复核" && /自动补齐的新提醒记录/.test(review.reason ?? "")) ||
    (review.decision === "投放证据候选" && fallback.decision === "投放平台背景");
  if (!shouldUpdate) continue;
  review.decision = fallback.decision;
  review.reason = fallback.reason;
}

brief.candidateReview.latestAlertReviewGeneratedAt = monitor.generatedAt;
brief.candidateReview.recentSignalReviewGeneratedAt = monitor.generatedAt;
brief.candidateReview.recentSignalReview = (monitor.recentItems ?? []).map((item) => {
  const dateLabel = item.publishedDate ? item.publishedDate.slice(0, 10) : monitor.generatedAt.slice(0, 10);
  const resolved = monitorSignalResolution(item);
  const decision = item.isKnown ? "已覆盖/继续观察" : resolved?.decision ?? "边界观察";
  const intent = monitorSignalIntent(item);
  const reason = item.isKnown
    ? "该近窗信号已经进入 baseline、主表或既有 monitor 台账；保留在近窗队列里，用于观察热度和叙事变化。"
    : resolved?.reason ?? `自动规则未命中强升级条件；按 ${intent.upgradePath} 留在 monitor 观察，不升级主表或融资时间线。`;
  return {
    name: item.title,
    source: `${dateLabel} monitor · ${item.monitorLabel}`,
    decision,
    lane: intent.lane,
    upgradePath: intent.upgradePath,
    action: intent.action,
    priority: item.priority,
    status: item.isKnown ? "known" : "new",
    reason,
    publishedDate: item.publishedDate,
    evidence: [
      {
        label: item.monitorLabel,
        url: item.url,
      },
    ],
  };
});
brief.candidateReview.monitorLaneRouting = Object.values(
  (brief.candidateReview.recentSignalReview ?? []).reduce((acc, item) => {
    acc[item.lane] ??= { lane: item.lane, total: 0, new: 0, known: 0, critical: 0, examples: [] };
    acc[item.lane].total += 1;
    if (item.status === "new") acc[item.lane].new += 1;
    else acc[item.lane].known += 1;
    if (item.priority === "critical") acc[item.lane].critical += 1;
    if (acc[item.lane].examples.length < 3) acc[item.lane].examples.push(item.name);
    return acc;
  }, {}),
).sort((a, b) => b.total - a.total || a.lane.localeCompare(b.lane));

brief.candidateReview.alertClosure = {
  generatedAt: monitor.generatedAt,
  latestAlertReviewRows: brief.candidateReview.latestAlertReview?.length ?? 0,
  latestAlertPendingRows: (brief.candidateReview.latestAlertReview ?? []).filter((item) => item.decision === "待复核" || /自动补齐的新提醒记录/.test(item.reason ?? "")).length,
  recentSignalReviewRows: brief.candidateReview.recentSignalReview?.length ?? 0,
  recentSignalPendingRows: (brief.candidateReview.recentSignalReview ?? []).filter((item) => item.decision === "待复核").length,
  status:
    (brief.candidateReview.latestAlertReview ?? []).some((item) => item.decision === "待复核" || /自动补齐的新提醒记录/.test(item.reason ?? "")) ||
    (brief.candidateReview.recentSignalReview ?? []).some((item) => item.decision === "待复核")
      ? "needs-review"
      : "closed",
  validator: "node scripts/validate-brief.mjs",
};

brief.irlCoverageAudit = irlCoverageAudit();

function nameMatches(name, text) {
  const normalizedName = normalizedEventName(name);
  const normalizedText = normalizedEventName(text);
  if (!normalizedName || !normalizedText) return false;
  if (normalizedText.includes(normalizedName) || normalizedName.includes(normalizedText)) return true;
  const tokens = normalizedName.split(" ").filter((token) => token.length > 2 && !["the", "and", "for", "with"].includes(token));
  return tokens.length > 0 && tokens.some((token) => normalizedText.includes(token));
}

function offlineModeFor(row) {
  const text = `${row.name} ${row.lane} ${row.reason} ${row.decision}`.toLowerCase();
  if (/travel|weroad|trip|tour/.test(text)) return "group travel";
  if (/date|dating|matchmaking|swiping|bumble|tinder|breeze|thursday|sitch/.test(text)) return "dating / matchmaking";
  if (/dinner|table|restaurant|timeleft|222/.test(text)) return "dinner / restaurant";
  if (/event|party|partiful|posh|plots|saturday/.test(text)) return "events / party";
  if (/language|nearby|meet5|local|activity|paxmeet|meetmux|weekend|aglow|irl/.test(text)) return "local activity / nearby";
  if (/wearable|friend|companion/.test(text)) return "AI companion boundary";
  return "offline-human boundary";
}

function irlOfflineEvidenceMap() {
  const matrixProducts = brief.clusters.flatMap((cluster) => cluster.items.map((item) => item.name));
  const rows = (brief.irlCoverageAudit?.rows ?? []).map((row) => {
    const fundingEvents = (brief.fundingEventAudit?.rows ?? [])
      .filter((event) => event.keptInUniqueCount && event.irlRelated && nameMatches(row.name, event.name))
      .map((event) => ({
        date: event.date,
        name: event.name,
        amount: event.amount,
        sourceType: event.sourceType,
        url: event.url,
      }));
    const monitorSignals = (brief.candidateReview?.recentSignalReview ?? [])
      .filter((signal) => signal.lane === "线下真人社交" && nameMatches(row.name, signal.name))
      .map((signal) => ({
        name: signal.name,
        source: signal.source,
        priority: signal.priority,
        status: signal.status,
        action: signal.action,
        url: signal.evidence?.[0]?.url,
      }));
    const productInMatrix = matrixProducts.some((name) => nameMatches(row.name, name));
    const evidenceStrength =
      productInMatrix && fundingEvents.length > 0 && monitorSignals.length > 0
        ? "strong"
        : productInMatrix && (fundingEvents.length > 0 || monitorSignals.length > 0)
          ? "solid"
          : fundingEvents.length > 0 || monitorSignals.length > 0
            ? "watch"
            : "seed";
    const nextCheck =
      evidenceStrength === "strong"
        ? "保留为 IRL 重点样本，monitor 新信号直接进入融资/增长复核。"
        : productInMatrix
          ? "补一轮官方、社媒或下载量证据，再决定是否提升展示优先级。"
          : "继续由 monitor 观察，出现产品级官网/融资/增长证据后再升级。";
    return {
      name: row.name,
      status: row.status,
      offlineMode: offlineModeFor(row),
      productInMatrix,
      fundingEventCount: fundingEvents.length,
      monitorSignalCount: monitorSignals.length,
      evidenceStrength,
      sources: row.sources,
      decisions: row.decisions,
      reason: row.reason,
      nextCheck,
      fundingEvents,
      monitorSignals,
      evidence: row.evidence,
    };
  }).sort((a, b) => {
    const order = { strong: 0, solid: 1, watch: 2, seed: 3 };
    return (order[a.evidenceStrength] ?? 9) - (order[b.evidenceStrength] ?? 9) || b.fundingEventCount - a.fundingEventCount || a.name.localeCompare(b.name);
  });

  return {
    generatedAt: new Date().toISOString(),
    method:
      "Builds a product-level IRL/offline-human evidence map from the IRL coverage audit, funding event audit, monitor recent review, and competitive matrix. It classifies offline mode, linkage strength, and the next check for each entry.",
    totalRows: rows.length,
    matrixLinkedRows: rows.filter((row) => row.productInMatrix).length,
    fundingLinkedRows: rows.filter((row) => row.fundingEventCount > 0).length,
    monitorLinkedRows: rows.filter((row) => row.monitorSignalCount > 0).length,
    strongRows: rows.filter((row) => row.evidenceStrength === "strong").length,
    byMode: Object.values(rows.reduce((acc, row) => {
      acc[row.offlineMode] ??= { mode: row.offlineMode, count: 0 };
      acc[row.offlineMode].count += 1;
      return acc;
    }, {})).sort((a, b) => b.count - a.count || a.mode.localeCompare(b.mode)),
    rows,
  };
}

brief.irlOfflineEvidenceMap = irlOfflineEvidenceMap();

const channelDefinitions = [
  {
    id: "app-store-web",
    label: "应用商店 / Web 入口",
    pattern: /应用商店|App Store|Google Play|移动端|Web|官网/i,
    takeaway: "适合用榜单、商店评价、SEO 和落地页转化持续验证规模。",
  },
  {
    id: "seo-content",
    label: "SEO / 内容发现",
    pattern: /SEO|对比文|内容|笔友|语言学习|文化|博客|官网 SEO/i,
    takeaway: "HelloTalk/Tandem 相邻产品常靠搜索意图、学习内容和对比页承接低成本流量。",
  },
  {
    id: "community-social",
    label: "社区 / 社媒 / UGC",
    pattern: /社区|内容社区|粉丝|TikTok|Discord|Reddit|角色分享|用户自创|creator|创作者|群聊|邀请|社交裂变|口碑/i,
    takeaway: "AI 社交和 companion 更依赖 UGC、角色市场、社群传播和创作者飞轮。",
  },
  {
    id: "city-irl",
    label: "城市运营 / 线下活动",
    pattern: /城市|活动|餐厅|晚餐|派对|run club|附近|地图|本地|线下|local|real life/i,
    takeaway: "IRL 产品的获客不是纯投放问题，城市密度、活动供给、场地合作和安全信任是核心。",
  },
  {
    id: "pr-investor",
    label: "媒体 / 投资人叙事",
    pattern: /媒体|PR|YC|VC|创始人|背书|融资|报道|发布|首发|waitlist|预发布/i,
    takeaway: "早期 AI social/IRL 产品常靠融资新闻、创始人故事和发布叙事获得第一波关注。",
  },
  {
    id: "subscription-paid",
    label: "订阅 / 内购 / 付费转化",
    pattern: /订阅|内购|付费|收入|ARR|revenue|商业化/i,
    takeaway: "AI companion 与角色经济需要单独跟踪下载、留存、订阅和内容合规之间的关系。",
  },
];

const allProducts = brief.clusters.flatMap((cluster) =>
  cluster.items.map((item) => ({
    clusterId: cluster.id,
    clusterTitle: cluster.title,
    name: item.name,
    channel: item.channel,
    signal: item.signal,
    irl: item.irl,
    differentiator: item.differentiator,
    evidenceScore: item.evidenceScore,
    evidence: item.evidence,
  })),
);

function growthSignalStrength(item) {
  const text = `${item.signal} ${item.channel}`.toLowerCase();
  const hardMetrics = /\$\s?\d|融资|series|seed|funding|revenue|收入|营收|arr|mrr|下载|downloads|用户|mau|访问量|月访问量|million|万|亿|增长|yoy|自然增长/.test(text);
  const launchSignals = /launch|上线|发布|waitlist|beta|首发|报道|pr|媒体|融资新闻/.test(text);
  if (hardMetrics && launchSignals) return { level: "强", score: 3, reason: "同时出现规模/融资/收入等硬指标和发布/媒体信号。" };
  if (hardMetrics) return { level: "强", score: 3, reason: "出现融资、收入、下载、用户或增长等硬指标。" };
  if (launchSignals) return { level: "中", score: 2, reason: "出现上线、发布、waitlist 或媒体传播信号。" };
  return { level: "弱", score: 1, reason: "目前主要是定位、功能或场景描述，增长证据仍需补强。" };
}

brief.growthChannelAudit = {
  generatedAt: new Date().toISOString(),
  method:
    "Each product is mapped from its curated growth signal and channel fields into channel tags, growth strength, evidence grade, and next check. This turns the narrative channel field into an auditable GTM layer.",
  totalProducts: allProducts.length,
  rows: allProducts.map((item) => {
    const matchedChannels = channelDefinitions
      .filter((definition) => definition.pattern.test(`${item.channel} ${item.signal}`))
      .map((definition) => definition.label);
    const growth = growthSignalStrength(item);
    const nextCheck =
      growth.level === "强" && matchedChannels.length >= 2
        ? "可进入展示主结论；下一步验证渠道效率或留存。"
        : growth.level === "强"
          ? "增长信号强，但渠道标签偏少；下一步补官网/商店/社媒入口。"
          : matchedChannels.length >= 2
            ? "渠道路径清楚，但增长信号偏弱；下一步补下载、融资、收入或用户规模。"
            : "增长和渠道都需要继续补证；保留在 watchlist 或边界样本。";
    return {
      name: item.name,
      cluster: item.clusterTitle,
      irl: item.irl,
      evidenceGrade: item.evidenceScore?.grade ?? "",
      growthLevel: growth.level,
      growthScore: growth.score,
      growthReason: growth.reason,
      channelTags: matchedChannels,
      channelCount: matchedChannels.length,
      nextCheck,
      signal: item.signal,
      channel: item.channel,
      differentiator: item.differentiator,
      evidenceCount: item.evidence?.length ?? 0,
    };
  }),
};
brief.growthChannelAudit.byGrowthLevel = Object.values(
  brief.growthChannelAudit.rows.reduce((acc, row) => {
    acc[row.growthLevel] ??= { level: row.growthLevel, count: 0 };
    acc[row.growthLevel].count += 1;
    return acc;
  }, {}),
).sort((a, b) => b.count - a.count || a.level.localeCompare(b.level));
brief.growthChannelAudit.byChannelTag = channelDefinitions.map((definition) => ({
  id: definition.id,
  label: definition.label,
  count: brief.growthChannelAudit.rows.filter((row) => row.channelTags.includes(definition.label)).length,
}));
brief.growthChannelAudit.weakRows = brief.growthChannelAudit.rows
  .filter((row) => row.growthLevel !== "强" || row.channelCount < 2)
  .sort((a, b) => a.growthScore - b.growthScore || a.channelCount - b.channelCount || a.name.localeCompare(b.name))
  .slice(0, 12);

const acquisitionDefinitions = [
  {
    id: "store-web",
    label: "商店 / Web / 官网承接",
    mode: "自然/可控入口",
    pattern: /应用商店|App Store|Google Play|iOS|Android|Web|官网|落地页/i,
    nextCheck: "补商店排名、评价、下载趋势和落地页转化口径。",
  },
  {
    id: "seo-content",
    label: "SEO / 内容搜索",
    mode: "自然获客",
    pattern: /SEO|搜索|对比文|博客|内容|语言学习|文化|笔友|角色库|Web 流量/i,
    nextCheck: "补关键词排名、自然搜索来源和内容页转化证据。",
  },
  {
    id: "community-ugc",
    label: "社区 / UGC / 裂变",
    mode: "自然+社群裂变",
    pattern: /社区|社群|UGC|用户自创|角色分享|creator|创作者|邀请|短信|社交裂变|Discord|Reddit|TikTok|粉丝|口碑|群聊/i,
    nextCheck: "补社媒账号、Discord/Reddit/创作者生态、分享链路和留存证据。",
  },
  {
    id: "pr-investor",
    label: "PR / 媒体 / 投资人",
    mode: "发布传播",
    pattern: /PR|媒体|报道|首发|TechCrunch|融资|YC|VC|投资人|创始人|背书|waitlist|预发布|launch|上线/i,
    nextCheck: "区分一次性新闻热度和可复用获客渠道，补后续活跃/下载变化。",
  },
  {
    id: "city-ops",
    label: "城市运营 / 活动供给",
    mode: "线下运营获客",
    pattern: /城市|本地|local|附近|地图|活动|餐厅|晚餐|派对|run club|KYC|旅行|Airbnb|场地|dating PR|singles events/i,
    nextCheck: "补城市密度、活动供给、场地合作、线下履约率和安全机制。",
  },
  {
    id: "paid-conversion",
    label: "订阅 / 内购 / 付费转化",
    mode: "付费转化",
    pattern: /订阅|内购|付费|premium|ARR|收入|营收|revenue|商业化|paying|coins|credits/i,
    nextCheck: "补 ARPU、内购收入、订阅留存和区域付费能力。",
  },
  {
    id: "localization-export",
    label: "出海 / 本地化投放",
    mode: "区域扩张",
    pattern: /出海|海外|拉美|美国|全球|本地化|international|国家|地区|扩张|US|Europe|India|印度|Singapore|新加坡/i,
    nextCheck: "补区域下载、素材/语言本地化、投放渠道和付费表现。",
  },
];

function acquisitionConfidence(item, channels, growthRow) {
  const evidenceCount = item.evidence?.length ?? 0;
  if (channels.length >= 3 && growthRow?.growthLevel === "强" && evidenceCount >= 2) {
    return { level: "高", reason: "多渠道标签、强增长信号且至少两条证据支撑。" };
  }
  if (channels.length >= 2 || growthRow?.growthLevel === "强") {
    return { level: "中", reason: "渠道路径或增长信号足够用于展示，但仍需量化效率。" };
  }
  return { level: "低", reason: "当前主要是产品定位或单一入口，获客效率需要补证。" };
}

function acquisitionEvidenceMap() {
  const rows = allProducts.map((item) => {
    const growthRow = brief.growthChannelAudit.rows.find((row) => row.name === item.name);
    const text = `${item.name} ${item.clusterTitle} ${item.signal} ${item.channel} ${item.differentiator}`;
    const matched = acquisitionDefinitions.filter((definition) => definition.pattern.test(text));
    const channels = matched.length ? matched : [acquisitionDefinitions[0]];
    const primary = channels[0];
    const confidence = acquisitionConfidence(item, channels, growthRow);
    const paidOrOrganic =
      channels.some((channel) => channel.id === "paid-conversion")
        ? "含付费转化"
        : channels.some((channel) => channel.id === "city-ops")
          ? "线下运营驱动"
          : channels.some((channel) => channel.id === "pr-investor")
            ? "PR/发布驱动"
            : "自然/社区驱动";
    return {
      name: item.name,
      cluster: item.clusterTitle,
      irl: item.irl,
      evidenceGrade: item.evidenceScore?.grade ?? "",
      growthLevel: growthRow?.growthLevel ?? "",
      primaryChannel: primary.label,
      acquisitionMode: primary.mode,
      paidOrOrganic,
      channelTags: channels.map((channel) => channel.label),
      channelCount: channels.length,
      confidence: confidence.level,
      confidenceReason: confidence.reason,
      nextCheck: channels.map((channel) => channel.nextCheck).slice(0, 2).join("；"),
      signal: item.signal,
      channel: item.channel,
      evidence: item.evidence,
    };
  });
  return {
    generatedAt: new Date().toISOString(),
    method:
      "Maps every curated product from narrative channel fields into acquisition channel type, paid/organic mode, confidence, and the next channel-efficiency evidence check.",
    totalProducts: rows.length,
    highConfidenceRows: rows.filter((row) => row.confidence === "高").length,
    paidConversionRows: rows.filter((row) => row.paidOrOrganic === "含付费转化").length,
    cityOpsRows: rows.filter((row) => row.paidOrOrganic === "线下运营驱动").length,
    byPrimaryChannel: Object.values(rows.reduce((acc, row) => {
      acc[row.primaryChannel] ??= { channel: row.primaryChannel, count: 0 };
      acc[row.primaryChannel].count += 1;
      return acc;
    }, {})).sort((a, b) => b.count - a.count || a.channel.localeCompare(b.channel)),
    byPaidOrOrganic: Object.values(rows.reduce((acc, row) => {
      acc[row.paidOrOrganic] ??= { mode: row.paidOrOrganic, count: 0 };
      acc[row.paidOrOrganic].count += 1;
      return acc;
    }, {})).sort((a, b) => b.count - a.count || a.mode.localeCompare(b.mode)),
    weakRows: rows.filter((row) => row.confidence === "低").slice(0, 12),
    rows,
  };
}

brief.acquisitionChannelMap = acquisitionEvidenceMap();

function paidAcquisitionEvidenceAudit() {
  const rows = allProducts.map((item) => {
    const acquisition = brief.acquisitionChannelMap.rows.find((row) => row.name === item.name);
    const rawText = `${item.name} ${item.clusterTitle} ${item.signal} ${item.channel} ${item.differentiator}`.toLowerCase();
    const channelText = `${acquisition?.channelTags?.join(" ") ?? ""}`.toLowerCase();
    const text = `${rawText} ${channelText}`;
    const explicitPaid =
      /paid|advertis|performance marketing|user acquisition|campaign|ad network|买量|广告|获客成本|cac|roas/.test(rawText) ||
      (/投放|素材/.test(rawText) && !/本地化投放/.test(rawText));
    const paidConversion = acquisition?.paidOrOrganic === "含付费转化";
    const prDriven = acquisition?.paidOrOrganic === "PR/发布驱动";
    const cityOps = acquisition?.paidOrOrganic === "线下运营驱动";
    const localization = /出海|本地化|localization|international|singapore|新加坡|美国|europe|india|拉美/.test(text);
    const evidenceClass = explicitPaid
      ? "explicit-paid-acquisition"
      : localization || prDriven || cityOps || paidConversion
        ? "directional-channel-evidence"
        : "no-paid-channel-evidence";
    const paidSignalType = explicitPaid
      ? "明确投放/广告/素材线索"
      : paidConversion
        ? "付费转化，不等于投放"
        : prDriven
          ? "PR/发布传播线索"
          : cityOps
            ? "城市运营/线下供给线索"
            : localization
              ? "出海/本地化扩张线索"
              : "未见投放线索";
    const confidence =
      evidenceClass === "explicit-paid-acquisition"
        ? "高"
        : acquisition?.confidence === "高" && evidenceClass === "directional-channel-evidence"
          ? "中"
          : "低";
    const nextCheck =
      evidenceClass === "explicit-paid-acquisition"
        ? "补广告素材库、投放地区、渠道平台、CAC/ROAS 或投放后下载变化。"
        : evidenceClass === "directional-channel-evidence"
          ? "不要直接声称付费投放；下一步补 Meta/Google/TikTok ads library、商店排名变化、PR 后下载变化或城市活动转化。"
          : "当前只能讲自然/社区/商店/官网承接；如需投放结论，必须补广告素材、投放平台或付费获客数据。";
    const claimLevel =
      evidenceClass === "explicit-paid-acquisition"
        ? "可声称付费投放"
        : evidenceClass === "directional-channel-evidence"
          ? "只能声称渠道线索"
          : "不能声称投放";
    const safeClaim =
      evidenceClass === "explicit-paid-acquisition"
        ? "有明确 paid acquisition / ads / campaign / CAC/ROAS / 买量证据，可作为产品级投放证据展示。"
        : evidenceClass === "directional-channel-evidence"
          ? "可展示为获客渠道、PR、城市运营、出海、本地化或付费转化线索；不得表述为产品正在买量。"
          : "当前只能展示自然增长、社区、商店或官网承接口径；不得表述为投放或付费获客。";
    return {
      name: item.name,
      cluster: item.clusterTitle,
      irl: item.irl,
      evidenceGrade: item.evidenceScore?.grade ?? "",
      growthLevel: acquisition?.growthLevel ?? "",
      acquisitionMode: acquisition?.acquisitionMode ?? "",
      paidOrOrganic: acquisition?.paidOrOrganic ?? "",
      primaryChannel: acquisition?.primaryChannel ?? "",
      evidenceClass,
      paidSignalType,
      confidence,
      claimLevel,
      safeClaim,
      nextCheck,
      channelTags: acquisition?.channelTags ?? [],
      growthSignal: item.signal,
      channel: item.channel,
      evidence: item.evidence,
    };
  });
  const monitorPaidSignals = (brief.candidateReview?.recentSignalReview ?? []).filter((item) => item.lane === "投放/付费获客证据");
  return {
    generatedAt: new Date().toISOString(),
    method:
      "Separates explicit paid-acquisition evidence from broader acquisition/channel signals. It prevents PR, app-store, SEO, city operations, subscription monetization, or localization clues from being overstated as paid ad spend.",
    totalProducts: rows.length,
    explicitPaidRows: rows.filter((row) => row.evidenceClass === "explicit-paid-acquisition").length,
    directionalRows: rows.filter((row) => row.evidenceClass === "directional-channel-evidence").length,
    noPaidEvidenceRows: rows.filter((row) => row.evidenceClass === "no-paid-channel-evidence").length,
    highConfidenceRows: rows.filter((row) => row.confidence === "高").length,
    monitorPaidSignalRows: monitorPaidSignals.length,
    monitorPaidNewRows: monitorPaidSignals.filter((item) => item.status === "new").length,
    monitorPaidExamples: monitorPaidSignals.slice(0, 6).map((item) => ({
      name: item.name,
      source: item.source,
      decision: item.decision,
      url: item.evidence?.[0]?.url,
    })),
    byEvidenceClass: Object.values(rows.reduce((acc, row) => {
      acc[row.evidenceClass] ??= { evidenceClass: row.evidenceClass, count: 0 };
      acc[row.evidenceClass].count += 1;
      return acc;
    }, {})).sort((a, b) => b.count - a.count || a.evidenceClass.localeCompare(b.evidenceClass)),
    rows,
  };
}

brief.paidAcquisitionEvidenceAudit = paidAcquisitionEvidenceAudit();

const functionalMechanisms = [
  { id: "language-exchange", label: "语言交换 / 跨文化", pattern: /语言|language|native speaker|口语|文化|learner|fluency|translation|翻译/i },
  { id: "ai-agent", label: "AI 角色 / 代理", pattern: /AI|agent|bot|companion|角色|虚拟|assistant|tutor|matching|算法/i },
  { id: "multi-room", label: "多人房间 / 群聊", pattern: /房间|room|多人|group|群聊|audio|voice|live|Voiceroom|community/i },
  { id: "nearby-map", label: "附近 / 地图发现", pattern: /附近|nearby|地图|map|proximity|local|本地|near you/i },
  { id: "irl-event", label: "线下活动 / 见面", pattern: /线下|in-person|face-to-face|real-life|meet|dinner|event|活动|晚餐|派对|run club|旅行|travel|meet-cute/i },
  { id: "matching-quiz", label: "问卷 / 匹配机制", pattern: /问卷|matching|match|compatibility|swiping|swipe|profile|bios|算法匹配|推荐/i },
  { id: "ugc-market", label: "UGC / 角色市场", pattern: /UGC|creator|创作者|角色市场|market|分享|fan|粉丝|内容|story|自创/i },
  { id: "monetization", label: "订阅 / 付费内容", pattern: /订阅|内购|付费|premium|revenue|收入|商业化|coins|credits/i },
];

function functionalDepth(item, tags) {
  if (/最高/.test(item.irl) || tags.some((tag) => tag === "线下活动 / 见面")) return "线下兑现";
  if (tags.some((tag) => ["附近 / 地图发现", "多人房间 / 群聊"].includes(tag))) return "真人互动";
  if (tags.some((tag) => tag === "AI 角色 / 代理")) return "AI 陪伴/辅助";
  return "内容/学习关系";
}

brief.functionalDifferenceAudit = {
  generatedAt: new Date().toISOString(),
  method:
    "Each differentiator is translated into mechanism tags, AI role, human interaction mode, and next validation question, so product differences can be compared beyond free-text descriptions.",
  totalProducts: allProducts.length,
  rows: allProducts.map((item) => {
    const text = `${item.name} ${item.clusterTitle} ${item.differentiator} ${item.signal} ${item.channel}`;
    const mechanismTags = functionalMechanisms
      .filter((definition) => definition.pattern.test(text))
      .map((definition) => definition.label);
    const aiRole = /AI|agent|bot|companion|角色|虚拟|assistant|tutor|算法|matching/i.test(text)
      ? /线下|in-person|real-life|meet|活动|晚餐|event/i.test(text)
        ? "AI 辅助真人匹配/活动"
        : "AI 陪伴/内容/学习辅助"
      : "真人网络为主";
    const humanMode = functionalDepth(item, mechanismTags);
    const nextCheck =
      mechanismTags.length >= 3
        ? "机制差异可讲；下一步验证关键路径转化和留存。"
        : humanMode === "线下兑现"
          ? "线下卖点明确；下一步补城市密度、安全和活动供给证据。"
          : "机制标签偏少；下一步补产品截图、商店描述或官网功能页。";
    return {
      name: item.name,
      cluster: item.clusterTitle,
      irl: item.irl,
      evidenceGrade: item.evidenceScore?.grade ?? "",
      mechanismTags,
      mechanismCount: mechanismTags.length,
      aiRole,
      humanMode,
      nextCheck,
      differentiator: item.differentiator,
      signal: item.signal,
      channel: item.channel,
    };
  }),
};
brief.functionalDifferenceAudit.byHumanMode = Object.values(
  brief.functionalDifferenceAudit.rows.reduce((acc, row) => {
    acc[row.humanMode] ??= { mode: row.humanMode, count: 0 };
    acc[row.humanMode].count += 1;
    return acc;
  }, {}),
).sort((a, b) => b.count - a.count || a.mode.localeCompare(b.mode));
brief.functionalDifferenceAudit.byMechanism = functionalMechanisms.map((definition) => ({
  id: definition.id,
  label: definition.label,
  count: brief.functionalDifferenceAudit.rows.filter((row) => row.mechanismTags.includes(definition.label)).length,
}));
brief.functionalDifferenceAudit.weakRows = brief.functionalDifferenceAudit.rows
  .filter((row) => row.mechanismCount < 2)
  .sort((a, b) => a.mechanismCount - b.mechanismCount || a.name.localeCompare(b.name))
  .slice(0, 12);

brief.officialSocialCoverageAudit = {
  generatedAt: new Date().toISOString(),
  method:
    "Combines each product's curated evidence with the official/social Exa pass, then classifies links into official web, app stores, LinkedIn, social/community, and third-party news so evidence gaps stay visible.",
  totalProducts: allProducts.length,
  rows: allProducts.map((item) => {
    const directEvidence = item.evidence ?? [];
    const officialEvidence = officialFor(item.name);
    const links = [...directEvidence, ...officialEvidence];
    const typeCounts = links.reduce((acc, evidence) => {
      const type = evidenceTypeFor(evidence.url);
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    }, {});
    const hasOfficial = Boolean(typeCounts["Official/web"]);
    const hasStore = Boolean(typeCounts["App Store"] || typeCounts["Google Play"]);
    const hasLinkedIn = Boolean(typeCounts.LinkedIn);
    const hasSocial = Boolean(typeCounts["Social/community"]);
    const gaps = [
      !hasOfficial ? "补官网/产品页" : null,
      !hasStore ? "补 App Store/Google Play" : null,
      !hasLinkedIn ? "补 LinkedIn/团队页" : null,
      !hasSocial ? "补社区/社媒" : null,
    ].filter(Boolean);
    const status =
      hasOfficial && hasStore && (hasLinkedIn || hasSocial)
        ? "证据完整"
        : hasOfficial || hasStore
          ? "可展示但待补"
          : "需补官方证据";
    return {
      name: item.name,
      cluster: item.clusterTitle,
      evidenceGrade: item.evidenceScore?.grade ?? "",
      totalLinks: links.length,
      officialWebLinks: typeCounts["Official/web"] ?? 0,
      appStoreLinks: typeCounts["App Store"] ?? 0,
      googlePlayLinks: typeCounts["Google Play"] ?? 0,
      linkedInLinks: typeCounts.LinkedIn ?? 0,
      socialCommunityLinks: typeCounts["Social/community"] ?? 0,
      newsThirdPartyLinks: typeCounts["News/third-party"] ?? 0,
      status,
      gaps,
      nextCheck: gaps.length ? gaps.join("；") : "证据类型较完整；下一步验证活跃度和更新频率。",
      evidence: links.slice(0, 6),
    };
  }),
};
brief.officialSocialCoverageAudit.summary = {
  complete: brief.officialSocialCoverageAudit.rows.filter((row) => row.status === "证据完整").length,
  displayable: brief.officialSocialCoverageAudit.rows.filter((row) => row.status === "可展示但待补").length,
  needsOfficial: brief.officialSocialCoverageAudit.rows.filter((row) => row.status === "需补官方证据").length,
  withOfficialWeb: brief.officialSocialCoverageAudit.rows.filter((row) => row.officialWebLinks > 0).length,
  withStore: brief.officialSocialCoverageAudit.rows.filter((row) => row.appStoreLinks + row.googlePlayLinks > 0).length,
  withLinkedIn: brief.officialSocialCoverageAudit.rows.filter((row) => row.linkedInLinks > 0).length,
  withSocialCommunity: brief.officialSocialCoverageAudit.rows.filter((row) => row.socialCommunityLinks > 0).length,
};
brief.officialSocialCoverageAudit.gapRows = brief.officialSocialCoverageAudit.rows
  .filter((row) => row.gaps.length > 0)
  .sort((a, b) => b.gaps.length - a.gaps.length || a.name.localeCompare(b.name))
  .slice(0, 14);

function languageOfficialEvidenceMap() {
  const languageCluster = brief.clusters.find((cluster) => cluster.id === "language");
  const officialRows = new Map(
    (brief.officialSocialCoverageAudit?.rows ?? [])
      .filter((row) => row.cluster === languageCluster?.title)
      .map((row) => [row.name, row]),
  );
  const similarityRows = new Map((brief.languageSimilarityAudit?.rows ?? []).map((row) => [row.name, row]));
  const rows = (languageCluster?.items ?? []).map((item) => {
    const official = officialRows.get(item.name) ?? {};
    const similarity = similarityRows.get(item.name) ?? {};
    const storeLinks = (official.appStoreLinks ?? 0) + (official.googlePlayLinks ?? 0);
    const socialProofLinks = (official.linkedInLinks ?? 0) + (official.socialCommunityLinks ?? 0);
    const evidenceReadiness =
      official.status === "证据完整"
        ? "ready"
        : (official.officialWebLinks && (storeLinks > 0 || socialProofLinks > 0)) || (storeLinks > 0 && socialProofLinks > 0)
          ? "displayable"
          : official.officialWebLinks || storeLinks > 0 || socialProofLinks > 0
            ? "thin"
            : "needs-official";
    return {
      name: item.name,
      similarity: similarity.similarity ?? "",
      similarityScore: similarity.score ?? 0,
      growthSignal: item.signal,
      channel: item.channel,
      functionalDifference: item.differentiator,
      irlMode: item.irl,
      evidenceGrade: item.evidenceScore?.label ?? "",
      officialStatus: official.status ?? "需补官方证据",
      evidenceReadiness,
      totalLinks: official.totalLinks ?? 0,
      officialWebLinks: official.officialWebLinks ?? 0,
      appStoreLinks: official.appStoreLinks ?? 0,
      googlePlayLinks: official.googlePlayLinks ?? 0,
      linkedInLinks: official.linkedInLinks ?? 0,
      socialCommunityLinks: official.socialCommunityLinks ?? 0,
      gaps: official.gaps ?? ["补官网/产品页"],
      nextCheck: official.nextCheck ?? "优先补官网、商店页和社媒证据。",
      evidence: official.evidence?.length ? official.evidence : item.evidence ?? [],
    };
  });
  return {
    generatedAt: new Date().toISOString(),
    method:
      "Language-specific evidence map for HelloTalk/Tandem-adjacent products. It joins growth signal, channel, functional difference, similarity, and official/social/store evidence status into one review layer.",
    totalRows: rows.length,
    readyRows: rows.filter((row) => row.evidenceReadiness === "ready").length,
    displayableRows: rows.filter((row) => row.evidenceReadiness === "displayable").length,
    thinRows: rows.filter((row) => row.evidenceReadiness === "thin").length,
    needsOfficialRows: rows.filter((row) => row.evidenceReadiness === "needs-official").length,
    withStoreRows: rows.filter((row) => row.appStoreLinks + row.googlePlayLinks > 0).length,
    withLinkedInRows: rows.filter((row) => row.linkedInLinks > 0).length,
    withSocialCommunityRows: rows.filter((row) => row.socialCommunityLinks > 0).length,
    byReadiness: Object.values(rows.reduce((acc, row) => {
      acc[row.evidenceReadiness] ??= { readiness: row.evidenceReadiness, count: 0 };
      acc[row.evidenceReadiness].count += 1;
      return acc;
    }, {})).sort((a, b) => b.count - a.count || a.readiness.localeCompare(b.readiness)),
    rows,
  };
}

brief.languageOfficialEvidenceMap = languageOfficialEvidenceMap();

brief.channelSummary = {
  totalProducts: allProducts.length,
  generatedFrom: "product channel fields in data/brief.json",
  groups: channelDefinitions.map((definition) => {
    const matches = allProducts.filter((item) => definition.pattern.test(`${item.channel} ${item.signal}`));
    const lanes = [...new Set(matches.map((item) => item.clusterTitle))];
    return {
      id: definition.id,
      label: definition.label,
      count: matches.length,
      takeaway: definition.takeaway,
      lanes,
      examples: matches.slice(0, 6).map((item) => ({
        name: item.name,
        cluster: item.clusterTitle,
        channel: item.channel,
      })),
    };
  }),
};

const rankedProducts = brief.clusters
  .flatMap((cluster) =>
    cluster.items.map((item) => {
      const irlBonus = /最高/.test(item.irl) ? 3 : /高/.test(item.irl) ? 2 : /中/.test(item.irl) ? 1 : 0;
      const gradeBonus = item.evidenceScore.grade === "A" ? 4 : item.evidenceScore.grade === "B" ? 2 : item.evidenceScore.grade === "C" ? 1 : 0;
      const score = item.evidenceScore.score + irlBonus + gradeBonus;
      return {
        name: item.name,
        clusterId: cluster.id,
        cluster: cluster.title,
        score,
        evidenceGrade: item.evidenceScore.label,
        irl: item.irl,
        signal: item.signal,
        channel: item.channel,
        differentiator: item.differentiator,
        why: [
          item.evidenceScore.reasons.join(" / "),
          /最高|高/.test(item.irl) ? "真人连接强度高" : "线上关系或内容网络更强",
        ].join("；"),
        evidence: item.evidence.slice(0, 3),
      };
    }),
  )
  .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

function capabilityFor(item, cluster) {
  const text = `${item.signal} ${item.channel} ${item.differentiator} ${item.irl}`;
  const evidenceBase = Math.min(item.evidenceScore.score, 8);
  const growth = /融资|\$|用户|下载|收入|营收|growth|revenue|MAU|访问量|launch|上线|PR|媒体|Series|seed|自然增长/i.test(text) ? 2 : 0;
  const channel = /应用商店|App Store|Google Play|SEO|社区|城市|活动|官网|TikTok|Discord|Reddit|PR|waitlist|地图|附近|内容|自然增长/i.test(text) ? 2 : 0;
  const differentiation = item.differentiator?.length > 20 ? 2 : 0;
  const irl = /最高/.test(item.irl) ? 3 : /高/.test(item.irl) ? 2 : /中/.test(item.irl) ? 1 : 0;
  const total = evidenceBase + growth + channel + differentiation + irl;
  const tier = total >= 14 ? "优先展示" : total >= 10 ? "重点观察" : total >= 7 ? "补证观察" : "长尾留档";
  const reasons = [
    `证据 ${item.evidenceScore.label}`,
    growth ? "有增长/融资/发布信号" : "增长信号待补",
    channel ? "渠道路径清楚" : "渠道待补",
    differentiation ? "功能差异可讲" : "功能差异待补",
    irl ? `IRL ${item.irl}` : "IRL 弱或纯线上",
  ];
  return {
    name: item.name,
    clusterId: cluster.id,
    cluster: cluster.title,
    score: total,
    tier,
    evidenceScore: item.evidenceScore.label,
    irl: item.irl,
    growthSignal: growth,
    channelSignal: channel,
    differentiationSignal: differentiation,
    irlSignal: irl,
    reasons,
    signal: item.signal,
    channel: item.channel,
    differentiator: item.differentiator,
    evidence: item.evidence.slice(0, 3),
  };
}

const productCapabilityRows = brief.clusters
  .flatMap((cluster) => cluster.items.map((item) => capabilityFor(item, cluster)))
  .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

brief.productCapability = {
  method:
    "Derived from curated fields: evidenceScore up to 8, growth/funding signal +2, channel clarity +2, functional differentiation +2, IRL strength up to +3.",
  generatedAt: new Date().toISOString(),
  totalProducts: productCapabilityRows.length,
  tiers: ["优先展示", "重点观察", "补证观察", "长尾留档"].map((tier) => ({
    tier,
    count: productCapabilityRows.filter((item) => item.tier === tier).length,
  })),
  rows: productCapabilityRows,
};

function topBy(predicate, limit) {
  return rankedProducts.filter(predicate).slice(0, limit);
}

brief.opportunityRanking = {
  method: "evidenceScore + IRL strength + evidence grade bonus, generated by scripts/refresh-derived.mjs",
  groups: [
    {
      id: "top-overall",
      label: "综合优先级最高",
      takeaway: "证据强、增长/融资信号明确，适合先拆产品机制和商业化。",
      items: rankedProducts.slice(0, 6),
    },
    {
      id: "irl-first",
      label: "线下真人优先",
      takeaway: "最贴近“AI 帮真人见到真人”的机会，重点看城市冷启动和活动供给。",
      items: topBy((item) => /最高|高/.test(item.irl), 6),
    },
    {
      id: "language-adjacent",
      label: "语言交换相邻机会",
      takeaway: "从语言学习、跨文化聊天和实时翻译切入低压力真人互动。",
      items: topBy((item) => item.clusterId === "language", 5),
    },
    {
      id: "ai-social-export",
      label: "AI 伴侣 / 泛娱乐 / 出海",
      takeaway: "适合跟踪角色经济、订阅收入、UGC 分发和中国 consumer AI 出海。",
      items: topBy((item) => ["companions", "ai-entertainment"].includes(item.clusterId), 6),
    },
  ],
};

const languageCount = brief.clusters.find((cluster) => cluster.id === "language")?.items.length ?? 0;
const irlProductCount = brief.clusters.find((cluster) => cluster.id === "irl")?.items.length ?? 0;
const totalProductCount = brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0);
brief.completionAudit = [
  {
    requirement: "使用 Exa company / people / research paper / news / financial report 等类别做市场、公司背景和产品能力判断",
    status: "已覆盖",
    evidence: `${brief.exaQueryMatrix.totalSearches} 个 Exa 查询、${brief.exaQueryMatrix.totalResults} 条原始结果；主矩阵包含 company、news、research paper、financial report、people，另有 official/social profile pass。`,
    proof: ["Exa query matrix", "coverage grid", "requestId run log"],
  },
  {
    requirement: "找 HelloTalk / Tandem 类似社交 app，并按增长信号、渠道、功能差异、官网/社媒证据整理成表",
    status: "已覆盖",
    evidence: `竞品主表 ${totalProductCount} 行、9 列；语言交换相邻产品 ${languageCount} 个；表格包含增长信号、渠道、功能差异、证据、官方/社媒、证据等级，并支持搜索/筛选/CSV 导出。`,
    proof: ["competitive matrix", "official/social evidence", "CSV export"],
  },
  {
    requirement: "统计近两年 AI 社交、泛娱乐相关产品融资和新闻",
    status: "已覆盖",
    evidence: `${brief.fundingSummary.dateWindowAudit.exactWindowStart} - ${brief.fundingSummary.dateWindowAudit.exactWindowEnd} 对应月份窗口 ${brief.fundingSummary.yearRange}；主时间线 ${brief.fundingSummary.totalEvents} 条，另有 discovery supplemental ${brief.fundingSummary.supplementalEvents} 条候选融资/新闻；funding summary 按年份、赛道、IRL 占比、明确美元融资口径统计，产品聚合覆盖 ${brief.fundingProductRollup.totalProducts} 个产品/公司。`,
    proof: ["funding summary", "funding timeline", "supplemental funding/news", "product funding rollup", "timeline CSV export"],
  },
  {
    requirement: "特别关注包含线下真人社交的产品",
    status: "已覆盖",
    evidence: `IRL 主表 ${irlProductCount} 个产品/边界样本；IRL 相关融资/新闻 ${brief.fundingSummary.irlEvents} 条，占时间线 ${brief.fundingSummary.irlShare}；线下真人筛选和机会排序均独立展示。`,
    proof: ["IRL showcase", "matrix filter", "opportunity ranking", "funding summary"],
  },
  {
    requirement: "用 monitor 监控新的动向和内容",
    status: "已覆盖",
    evidence: `Codex automation 每日 09:00 运行 Exa monitor；monitor 当前 ${monitor.summary.monitors} 条 lane，历史运行 ${(await readFile(new URL("../data/monitor-history.json", import.meta.url), "utf8").then(JSON.parse)).runs.length} 次，台账保留 ${(await readFile(new URL("../data/monitor-ledger.json", import.meta.url), "utf8").then(JSON.parse)).totalItems} 条已发现 URL，最新新增 ${monitor.summary.newAlerts} 条。`,
    proof: ["daily monitor section", "monitor history", "alert ledger", "latest alert review"],
  },
  {
    requirement: "前端网页友好展示，而不是表格文件",
    status: "已覆盖",
    evidence: "本地网页包含结论 shortlist、渠道观察、机会排序、筛选矩阵、融资统计、monitor、官方/社媒证据、query matrix、候选升级记录和 completion audit。",
    proof: ["localhost page", "frontend structure validator", "browser validation"],
  },
  {
    requirement: "“所有”相关产品的穷尽性",
    status: "保守说明",
    evidence: `消费社交产品持续变化，页面用 broad evidence pass + watchlist + monitor 逼近覆盖，但不声称数学穷尽；另有 ${brief.discoveryScan.totalScans} 组盲区扫描、${brief.discoveryScan.totalResults} 条补充结果覆盖 AI friend/wearable、AI-native social、AI dating、companion 长尾、IRL 长尾和语言交换长尾。`,
    proof: ["coverage audit", "discovery scan", "candidate review", "monitor policy"],
  },
];

const blockingCoverageGapGroups = (brief.coverageGapRegister.groups ?? []).filter(
  (group) => group.reviewTier === "product-candidate" && group.unresolvedCount > 0,
);
const monitoredCoverageGapGroups = (brief.coverageGapRegister.groups ?? []).filter(
  (group) => group.reviewTier === "signal-candidate" && group.unresolvedCount > 0,
);
const backgroundCoverageGapGroups = (brief.coverageGapRegister.groups ?? []).filter((group) =>
  ["background-source", "low-relevance"].includes(group.reviewTier),
);
brief.goalReadiness = {
  generatedAt: new Date().toISOString(),
  status: blockingCoverageGapGroups.length === 0 && brief.candidatePromotionQueue.totalRows === 0 && brief.candidateReview.alertClosure.status === "closed" ? "ready-with-monitoring-boundary" : "needs-work",
  blockingGaps: {
    totalGroups: blockingCoverageGapGroups.length,
    rows: blockingCoverageGapGroups.reduce((sum, group) => sum + group.unresolvedCount, 0),
    reason: "Unresolved product-candidate gaps would block claiming broad coverage of relevant products.",
  },
  monitoredGaps: {
    totalGroups: monitoredCoverageGapGroups.length,
    rows: monitoredCoverageGapGroups.reduce((sum, group) => sum + group.unresolvedCount, 0),
    lane: "coverage-signal-watchlist",
    reason: "Signal-candidate gaps are not promoted into conclusions until monitor finds stronger launch, funding, revenue, download, official, or IRL evidence.",
  },
  backgroundGaps: {
    totalGroups: backgroundCoverageGapGroups.length,
    rows: backgroundCoverageGapGroups.reduce((sum, group) => sum + group.unresolvedCount, 0),
    reason: "Background and low-relevance rows are retained for auditability but do not count as missing products or funding events.",
  },
  hardGates: [
    {
      gate: "candidatePromotionQueue",
      value: brief.candidatePromotionQueue.totalRows,
      pass: brief.candidatePromotionQueue.totalRows === 0,
      evidence: "No remaining language or funding/news promotion queue rows.",
    },
    {
      gate: "latestAlertReviewPendingRows",
      value: brief.candidateReview.alertClosure.latestAlertPendingRows,
      pass: brief.candidateReview.alertClosure.latestAlertPendingRows === 0,
      evidence: "Latest alert review has no unresolved auto-filled monitor items.",
    },
    {
      gate: "monitorRecentReviewPendingRows",
      value: brief.candidateReview.alertClosure.recentSignalPendingRows,
      pass: brief.candidateReview.alertClosure.recentSignalPendingRows === 0,
      evidence: "Monitor recent signal review has no unresolved pending items.",
    },
    {
      gate: "blockingProductCandidateGapRows",
      value: blockingCoverageGapGroups.reduce((sum, group) => sum + group.unresolvedCount, 0),
      pass: blockingCoverageGapGroups.length === 0,
      evidence: "High-priority product-candidate gaps have all been handled by candidate deep-dive.",
    },
  ],
  boundary:
    "Ready means the current evidence set is presentation-ready under broad monitored coverage. It still does not claim mathematical exhaustiveness across the changing consumer social market.",
};
brief.strictCompletionVerdict = {
  generatedAt: new Date().toISOString(),
  status: "not-mathematically-complete",
  presentationReady: brief.goalReadiness.status === "ready-with-monitoring-boundary",
  reason:
    "当前证据集已经满足展示交付：阻塞候选、latest alert pending 和 recent signal pending 均为 0；但原始目标里的“所有相关产品”无法在实时变化的消费社交市场中被数学证明，因此保持 broad monitored coverage，并继续通过 monitor 与 full rebuild 推进。",
  blockingGapRows: brief.goalReadiness.blockingGaps.rows,
  monitoredGapRows: brief.goalReadiness.monitoredGaps.rows,
  latestAlertPendingRows: brief.candidateReview.alertClosure.latestAlertPendingRows,
  recentSignalPendingRows: brief.candidateReview.alertClosure.recentSignalPendingRows,
  hardConditions: [
    "阻塞型 product-candidate 缺口必须为 0。",
    "latest alert review 待复核必须为 0。",
    "monitor recent review 待复核必须为 0。",
    "页面必须继续披露 broad monitored coverage，不声称数学穷尽。",
  ],
  nextMechanism:
    "日常 monitor 捕获新 URL，latest alert review 给处理结论；每周 full rebuild 重跑 Exa category / official-social / discovery / deep-dive 层。",
};

brief.originalObjectiveAuditSummary = {
  generatedAt: new Date().toISOString(),
  rows: 9,
  status: brief.strictCompletionVerdict.status,
  presentationReady: brief.strictCompletionVerdict.presentationReady,
  currentEvidenceStatus: "presentation-ready-with-monitoring-boundary",
  counts: {
    products: totalProductCount,
    languageAdjacentUnique: brief.languageCoverageAudit.totalUnique,
    fundingTimelineEvents: brief.fundingSummary.totalEvents,
    fundingReviewRows: brief.fundingSummary.combinedEvents,
    uniqueFundingEvents: brief.fundingSummary.uniqueCombinedEvents,
    irlOfflineEvidenceRows: brief.irlOfflineEvidenceMap.totalRows,
    monitorLanes: monitor.summary.monitors,
    monitorRecentResults: monitor.summary.recentResults,
    monitorNewAlerts: monitor.summary.newAlerts,
    latestAlertPendingRows: brief.candidateReview.alertClosure.latestAlertPendingRows,
    recentSignalPendingRows: brief.candidateReview.alertClosure.recentSignalPendingRows,
  },
  files: {
    markdown: "exports/original-objective-audit.md",
    csv: "exports/original-objective-audit.csv",
    json: "exports/original-objective-audit.json",
  },
  boundary:
    "原始目标中的“所有相关产品与新闻”保持 not-mathematically-complete；当前可展示版本依赖 monitor 和 full rebuild 持续逼近。",
};

brief.objectiveEvidenceMap = [
  {
    id: "exa-categories",
    requirement: "用 Exa company / people / research paper / news / financial report 判断市场、公司背景和产品能力",
    status: "已落库",
    evidence: `${brief.exaQueryMatrix.totalSearches} 个 Exa 查询、${brief.exaQueryMatrix.totalResults} 条原始结果；category evidence audit 覆盖 ${brief.exaCategoryEvidenceAudit.totalCategories} 类 Exa category，并把每类连接到下游判断和导出附件。`,
    views: ["#evidence", "#playbook"],
    dataFiles: ["data/exa-results.json", "data/exa-social-profiles.json", "data/exa-synthesis.json", "data/brief.json"],
    exportFiles: ["exports/source-coverage.csv", "exports/exa-category-evidence-audit.csv", "exports/source-linkage-audit.csv", "exports/product-capability-score.csv", "exports/company-background-review.csv", "exports/company-background-coverage-audit.csv", "exports/market-decision-evidence-map.csv"],
    validators: ["validate-brief", "validate-frontend"],
    boundary: "按 Exa 当前返回结果和官方/社媒补证整理；未关联结果进入 source linkage review queue。",
  },
  {
    id: "language-products",
    requirement: "找 HelloTalk / Tandem 类似社交 app，并整理增长信号、渠道、功能差异、官网/社媒证据",
    status: "已落库",
    evidence: `${totalProductCount} 个产品进入主矩阵；语言相似度审计覆盖 ${brief.languageSimilarityAudit.totalRows} 个 HelloTalk/Tandem 相邻条目，其中高度相似 ${brief.languageSimilarityAudit.highlySimilar} 个、相邻变体 ${brief.languageSimilarityAudit.adjacentVariants} 个；语言官方证据地图覆盖 ${brief.languageOfficialEvidenceMap.totalRows} 个主表语言产品；语言增长/渠道 targeted deep-dive 新增 ${brief.languageGrowthChannelDeepDive.searches} 组 Exa 查询、${brief.languageGrowthChannelDeepDive.resultRows} 条结果。`,
    views: ["#matrix", "#evidence", "#playbook"],
    dataFiles: ["data/brief.json", "data/exa-discovery-scan.json", "data/exa-candidate-deep-dive.json", "data/exa-language-growth-channel-deep-dive.json"],
    exportFiles: ["exports/competitive-matrix.csv", "exports/language-similarity-audit.csv", "exports/language-official-evidence-map.csv", "exports/language-growth-channel-deep-dive.csv", "exports/growth-channel-audit.csv", "exports/acquisition-channel-map.csv", "exports/paid-acquisition-evidence-audit.csv", "exports/functional-difference-audit.csv", "exports/official-social-coverage-audit.csv", "exports/language-coverage-audit.csv", "exports/language-long-tail-review.csv", "exports/candidate-deep-dive.csv"],
    validators: ["validate-brief", "validate-deliverable"],
    boundary: "长尾语言交换结果区分 core、watchlist、boundary，避免把弱相关产品强行并入主表。",
  },
  {
    id: "funding-news",
    requirement: "统计近两年 AI 社交、AI 泛娱乐相关产品融资和新闻",
    status: "已落库",
    evidence: `${brief.fundingSummary.dateWindowAudit.exactWindowStart} - ${brief.fundingSummary.dateWindowAudit.exactWindowEnd} 精确窗口，对应月份窗口 ${brief.fundingSummary.yearRange}；主时间线 ${brief.fundingSummary.totalEvents} 条，补充候选 ${brief.fundingSummary.supplementalEvents} 条；事件级审计 ${brief.fundingEventAudit.totalRows} 行，去重后 ${brief.fundingEventAudit.uniqueRows} 个唯一事件，其中 IRL/线下真人相关 ${brief.fundingEventAudit.irlRows} 个；产品聚合 ${brief.fundingProductRollup.totalProducts} 行，其中 IRL 产品 ${brief.fundingProductRollup.irlProducts} 个；补充候选升级映射 ${brief.fundingUpgradeMap.totalRows} 行，保留候选 ${brief.fundingUpgradeMap.retainedCandidates} 行、重复佐证 ${brief.fundingUpgradeMap.duplicateEvidenceRows} 行。`,
    views: ["#funding", "#playbook"],
    dataFiles: ["data/brief.json", "data/exa-discovery-scan.json"],
    exportFiles: ["exports/funding-timeline.csv", "exports/funding-news-review.csv", "exports/funding-news-dedup-audit.csv", "exports/funding-event-audit.csv", "exports/funding-upgrade-map.csv", "exports/funding-product-rollup.csv", "exports/supplemental-funding-news.csv"],
    validators: ["validate-brief", "validate-deliverable"],
    boundary: "美元融资总额只统计金额明确的主时间线事件；补充候选进入复核表但不直接混入主结论。",
  },
  {
    id: "irl-focus",
    requirement: "特别关注包含线下真人社交的产品",
    status: "已落库",
    evidence: `IRL 覆盖审计 ${brief.irlCoverageAudit.totalUnique} 个唯一线下真人/IRL 条目；线下真人证据地图 ${brief.irlOfflineEvidenceMap.totalRows} 行，其中融资/新闻链接 ${brief.irlOfflineEvidenceMap.fundingLinkedRows} 行、monitor 近窗链接 ${brief.irlOfflineEvidenceMap.monitorLinkedRows} 行、强证据 ${brief.irlOfflineEvidenceMap.strongRows} 行；主时间线 IRL 事件 ${brief.fundingSummary.irlEvents} 条。`,
    views: ["#products", "#funding", "#monitor", "#evidence"],
    dataFiles: ["data/brief.json", "data/monitor.json"],
    exportFiles: ["exports/irl-coverage-audit.csv", "exports/irl-offline-evidence-map.csv", "exports/funding-news-review.csv", "exports/monitor-lane-routing.csv"],
    validators: ["validate-brief", "validate-frontend"],
    boundary: "把 dating、events、travel、local activity 等真人线下相邻样本分层，避免只看 AI companion。",
  },
  {
    id: "monitor",
    requirement: "用 monitor 持续监控新的动向和内容",
    status: "已落库",
    evidence: `当前 ${monitor.summary.monitors} 条 monitor lane，近窗高相关信号 ${monitor.summary.recentResults} 条，最新新增 ${monitor.summary.newAlerts} 条，历史运行 ${(await readFile(new URL("../data/monitor-history.json", import.meta.url), "utf8").then(JSON.parse)).runs.length} 次。`,
    views: ["#monitor", "#evidence", "#playbook"],
    dataFiles: ["data/monitor.json", "data/monitor-history.json", "data/monitor-ledger.json", "data/monitor-digest.json"],
    exportFiles: ["exports/latest-alert-review.csv", "exports/monitor-recent-review.csv", "exports/monitor-lane-routing.csv", "exports/monitor-recent-signals.csv"],
    validators: ["validate-brief", "validate-deliverable"],
    boundary: "当前 Exa Websets Monitor API 权限不可用，使用 Exa Search API + Codex automation fallback，并在页面披露。",
  },
  {
    id: "friendly-web",
    requirement: "前端网页友好展示，而不是把所有内容堆在首页或只给表格",
    status: "已落库",
    evidence: "页面拆成 home、matrix、products、funding、monitor、evidence、playbook 多视图；首页只展示结论和优先级，细节分路由承接。",
    views: ["#home", "#matrix", "#products", "#funding", "#monitor", "#evidence", "#playbook"],
    dataFiles: ["index.html", "styles.css", "app.js", "data/brief.json"],
    exportFiles: ["exports/exa-ai-social-report.html", "exports/executive-brief.md"],
    validators: ["validate-frontend", "validate-deliverable"],
    boundary: "保留真实 comparison table 和 CSV 导出，但展示主体验是网页视图。",
  },
  {
    id: "all-boundary",
    requirement: "“所有”相关产品的覆盖边界与后续补证",
    status: "保守落库",
    evidence: `source linkage audit 覆盖 ${brief.sourceLinkageAudit.totalResults} 条原始结果，已关联 ${brief.sourceLinkageAudit.linkedResults} 条，coverage gap register 保留 ${brief.coverageGapRegister.totalGaps} 条复核缺口，其中高优先级 ${brief.coverageGapRegister.highPriorityGaps} 条；candidate deep dive ${brief.candidateDeepDive.candidates} 个候选、${brief.candidateDeepDive.totalResults} 条结果。`,
    views: ["#evidence", "#playbook"],
    dataFiles: ["data/brief.json", "data/exa-discovery-scan.json", "data/exa-candidate-deep-dive.json"],
    exportFiles: ["exports/source-linkage-audit.csv", "exports/coverage-gap-register.csv", "exports/candidate-deep-dive.csv", "exports/completion-audit.md", "exports/completion-manifest.json"],
    validators: ["validate-brief", "validate-deliverable"],
    boundary: "消费社交产品持续变化，因此只声明 broad monitored coverage，不声明数学穷尽。",
  },
];

brief.evidenceScoring = {
  method: [
    "基础证据链接 +1。",
    "官网、App Store、Google Play、LinkedIn 或社区证据 +2。",
    "融资、增长、收入、下载、ARR、用户规模或上线新闻 +2。",
    "financial report / 市场规模口径 +1。",
    "people / founder / GTM 团队线索 +1。",
    "IRL 强相关产品 +1；总证据链接数不少于 4 再 +1。",
  ],
  grades: {
    A: "强证据，适合进入展示主结论",
    B: "可展示，但仍需继续补商业/团队或官方证据",
    C: "可作为边界或 watch item",
    D: "仅保留观察",
  },
  counts: brief.clusters
    .flatMap((cluster) => cluster.items)
    .reduce((counts, item) => {
      counts[item.evidenceScore.grade] = (counts[item.evidenceScore.grade] ?? 0) + 1;
      return counts;
    }, {}),
};

await writeFile(briefUrl, `${JSON.stringify(brief, null, 2)}\n`);

console.log(JSON.stringify({
  ok: true,
  coverage: brief.coverage,
  exaQueryMatrix: {
    totalSearches: brief.exaQueryMatrix.totalSearches,
    totalResults: brief.exaQueryMatrix.totalResults,
  },
  fundingSummary: {
    totalEvents: brief.fundingSummary.totalEvents,
    explicitUsdFundingM: brief.fundingSummary.explicitUsdFundingM,
  },
  evidenceScoring: brief.evidenceScoring.counts,
}, null, 2));
