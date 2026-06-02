import { mkdir, readFile, writeFile } from "node:fs/promises";

const brief = JSON.parse(await readFile(new URL("../data/brief.json", import.meta.url), "utf8"));
const monitor = JSON.parse(await readFile(new URL("../data/monitor.json", import.meta.url), "utf8"));
const exa = JSON.parse(await readFile(new URL("../data/exa-results.json", import.meta.url), "utf8"));
const social = JSON.parse(await readFile(new URL("../data/exa-social-profiles.json", import.meta.url), "utf8"));
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

const exportDir = new URL("../exports/", import.meta.url);

function csvEscape(value) {
  return `"${String(value ?? "").replace(/\s*\r?\n\s*/g, " ").replaceAll('"', '""')}"`;
}

function toCsv(headers, rows) {
  return [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
}

function evidenceText(items = []) {
  return items.map((item) => `${item.label}: ${item.url}`).join(" | ");
}

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function topDomains(results = []) {
  const counts = new Map();
  for (const result of results) {
    const domain = domainOf(result.url);
    if (!domain) continue;
    counts.set(domain, (counts.get(domain) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([domain, count]) => `${domain} (${count})`)
    .join(" | ");
}

const sourceCoverageRows = [
  ...(exa.searches ?? []).map((search) => ({ ...search, source: "main research" })),
  ...(social.searches ?? []).map((search) => ({ ...search, source: "official/social pass", category: "official/social profile" })),
  ...(languageGrowthChannelDeepDive.searches ?? []).map((search) => ({ ...search, source: "language growth/channel deep-dive" })),
  ...(languageOfficialSocialDeepDive.searches ?? []).map((search) => ({ ...search, source: "language official/social deep-dive", category: "official/social profile" })),
].map((search) => {
  const domains = new Set((search.results ?? []).map((result) => domainOf(result.url)).filter(Boolean));
  return [
    search.source,
    search.id,
    search.category,
    search.requestId,
    search.results?.length ?? 0,
    domains.size,
    topDomains(search.results),
    search.query,
  ];
});

const categoryEvidenceRows = (brief.exaCategoryEvidenceAudit?.rows ?? []).map((item) => [
  item.category,
  item.searches,
  item.results,
  item.queryIds.join(" | "),
  item.useCase,
  item.outputViews.join(" | "),
  item.exportFiles.join(" | "),
  item.evidenceObject,
  item.nextCheck,
]);

const officialItems = (brief.officialSocialEvidence?.groups ?? []).flatMap((group) => group.items ?? []);
function officialEvidenceFor(name) {
  const normalized = name.toLowerCase();
  return officialItems
    .filter((item) => {
      const itemName = item.name.toLowerCase();
      return normalized.includes(itemName) || itemName.includes(normalized);
    })
    .flatMap((item) => item.evidence ?? [])
    .slice(0, 4);
}

const productRows = brief.clusters.flatMap((cluster) =>
  cluster.items.map((item) => {
    const officialEvidence = officialEvidenceFor(item.name);
    const officialDisplayEvidence = officialEvidence.length > 0 ? officialEvidence : item.evidence.slice(0, 2);
    return [
      item.name,
      cluster.title,
      item.irl,
      item.evidenceScore?.label,
      item.signal,
      item.channel,
      item.differentiator,
      evidenceText(item.evidence),
      evidenceText(officialDisplayEvidence),
    ];
  }),
);

const productCapabilityRows = (brief.productCapability?.rows ?? []).map((item) => [
  item.name,
  item.cluster,
  item.score,
  item.tier,
  item.evidenceScore,
  item.irl,
  item.growthSignal,
  item.channelSignal,
  item.differentiationSignal,
  item.irlSignal,
  item.reasons.join(" | "),
  item.signal,
  item.channel,
  item.differentiator,
  evidenceText(item.evidence),
]);

const growthChannelRows = (brief.growthChannelAudit?.rows ?? []).map((item) => [
  item.name,
  item.cluster,
  item.irl,
  item.evidenceGrade,
  item.growthLevel,
  item.growthScore,
  item.channelCount,
  item.channelTags.join(" | "),
  item.growthReason,
  item.nextCheck,
  item.signal,
  item.channel,
  item.differentiator,
  item.evidenceCount,
]);

const acquisitionChannelRows = (brief.acquisitionChannelMap?.rows ?? []).map((item) => [
  item.name,
  item.cluster,
  item.irl,
  item.evidenceGrade,
  item.growthLevel,
  item.primaryChannel,
  item.acquisitionMode,
  item.paidOrOrganic,
  item.channelTags.join(" | "),
  item.channelCount,
  item.confidence,
  item.confidenceReason,
  item.nextCheck,
  item.signal,
  item.channel,
  evidenceText(item.evidence),
]);

const paidAcquisitionEvidenceRows = (brief.paidAcquisitionEvidenceAudit?.rows ?? []).map((item) => [
  item.name,
  item.cluster,
  item.irl,
  item.evidenceGrade,
  item.growthLevel,
  item.primaryChannel,
  item.acquisitionMode,
  item.paidOrOrganic,
  item.evidenceClass,
  item.paidSignalType,
  item.confidence,
  item.claimLevel,
  item.safeClaim,
  item.nextCheck,
  item.channelTags.join(" | "),
  item.growthSignal,
  item.channel,
  evidenceText(item.evidence),
]);

const functionalDifferenceRows = (brief.functionalDifferenceAudit?.rows ?? []).map((item) => [
  item.name,
  item.cluster,
  item.irl,
  item.evidenceGrade,
  item.mechanismCount,
  item.mechanismTags.join(" | "),
  item.aiRole,
  item.humanMode,
  item.nextCheck,
  item.differentiator,
  item.signal,
  item.channel,
]);

const officialSocialCoverageRows = (brief.officialSocialCoverageAudit?.rows ?? []).map((item) => [
  item.name,
  item.cluster,
  item.evidenceGrade,
  item.status,
  item.totalLinks,
  item.officialWebLinks,
  item.appStoreLinks,
  item.googlePlayLinks,
  item.linkedInLinks,
  item.socialCommunityLinks,
  item.newsThirdPartyLinks,
  item.gaps.join(" | "),
  item.nextCheck,
  evidenceText(item.evidence),
]);

const officialGapDeepDiveRows = (brief.officialSocialEvidence?.groups ?? [])
  .flatMap((group) => group.items.map((item) => ({ group: group.title, ...item })))
  .filter((item) => (brief.officialGapDeepDive?.products ?? []).includes(item.name))
  .map((item) => [
    item.name,
    item.group,
    item.type,
    evidenceText(item.evidence),
  ]);

const languageOfficialSocialDeepDiveRows = (languageOfficialSocialDeepDive.searches ?? []).map((search) => [
  search.productName,
  search.query,
  search.ok ? "ok" : "error",
  search.status,
  search.requestId,
  search.results?.length ?? 0,
  (search.results ?? [])
    .slice(0, 5)
    .map((result) => `${result.title}: ${result.url}`)
    .join(" | "),
]);

const companyBackgroundRows = (brief.companyBackgroundReview?.rows ?? []).map((item) => [
  item.sourceCategory,
  item.subject,
  item.linkedProducts.join(" | "),
  item.lane,
  item.dimension,
  item.signal,
  item.interpretation,
  evidenceText(item.evidence),
]);

const companyBackgroundDeepDiveRows = (brief.companyBackgroundReview?.rows ?? [])
  .filter((item) => item.sourceCategory === "company")
  .map((item) => [
    item.sourceCategory,
    item.subject,
    item.linkedProducts.join(" | "),
    item.dimension,
    item.signal,
    item.interpretation,
    evidenceText(item.evidence),
  ]);

const companyBackgroundCoverageRows = (brief.companyBackgroundCoverageAudit?.rows ?? []).map((item) => [
  item.name,
  item.cluster,
  item.evidenceGrade,
  item.capabilityTier,
  item.status,
  item.directPeopleSignals,
  item.directCompanySignals,
  item.directFinancialSignals,
  (item.directDimensions ?? []).join(" | "),
  (item.missingDirectDimensions ?? []).join(" | "),
  item.productLevelSignalCount ?? "",
  item.marketPeopleSignals,
  item.marketFinancialSignals,
  item.linkedSubjects.join(" | "),
  item.marketSignals.join(" | "),
  item.nextCheck,
]);

const marketDecisionEvidenceRows = (brief.marketDecisionEvidenceMap?.rows ?? []).map((item) => [
  item.sourceCategory,
  item.signalName,
  item.decisionArea,
  item.linkedProducts.join(" | "),
  item.judgment,
  item.businessImpact,
  item.evidenceStrength,
  item.targetViews.join(" | "),
  item.nextAction,
  evidenceText(item.evidence),
]);

const timelineRows = brief.fundingTimeline.map((item) => [
  item.date,
  item.name,
  item.amount,
  item.lane,
  item.url,
]);

function explicitUsdM(amount) {
  const match = String(amount ?? "").match(/\$\s?([\d.]+)\s?M/i);
  return match ? Number(match[1]) : "";
}

function isIrlLane(lane) {
  return /IRL|offline|dating|travel|events|real-world|human/i.test(String(lane ?? "")) ? "yes" : "no";
}

const fundingNewsReviewRows = [
  ...brief.fundingTimeline.map((item) => ({
    source: "core timeline",
    date: item.date,
    name: item.name,
    amount: item.amount,
    lane: item.lane,
    url: item.url,
    title: "",
    highlight: "",
  })),
  ...(brief.discoveryScan?.supplementalFundingNews ?? []).map((item) => ({
    source: "supplemental discovery",
    date: item.date,
    name: item.name,
    amount: item.amount,
    lane: item.lane,
    url: item.url,
    title: item.title,
    highlight: item.highlight,
  })),
].map((item) => [
  item.source,
  item.date,
  item.name,
  item.amount,
  item.lane,
  isIrlLane(item.lane),
  explicitUsdM(item.amount),
  item.url,
  item.title,
  item.highlight,
]);

const fundingNewsDedupRows = (brief.fundingSummary?.dedupAudit?.rows ?? []).map((item) => [
  item.key,
  item.source,
  item.date,
  item.name,
  item.amount,
  item.lane,
  item.duplicateGroupSize,
  item.keptInUniqueCount ? "yes" : "no",
  item.url,
]);

const fundingEventAuditRows = (brief.fundingEventAudit?.rows ?? []).map((item) => [
  item.key,
  item.source,
  item.date,
  item.datePrecision,
  item.inWindow ? "yes" : "no",
  item.name,
  item.amount,
  item.amountType,
  item.explicitUsdM ?? "",
  item.lane,
  item.normalizedLane,
  item.irlRelated ? "yes" : "no",
  item.sourceType,
  item.duplicateGroupSize,
  item.keptInUniqueCount ? "yes" : "no",
  item.conclusion,
  item.url,
]);

const fundingUpgradeRows = (brief.fundingUpgradeMap?.rows ?? []).map((item) => [
  item.key,
  item.date,
  item.name,
  item.amount,
  item.lane,
  item.normalizedLane,
  item.upgradeStatus,
  item.keptInUniqueCount ? "yes" : "no",
  item.duplicateOf,
  item.irlRelated ? "yes" : "no",
  item.explicitUsdM ?? "",
  item.amountType,
  item.sourceType,
  item.targetView,
  item.nextAction,
  item.url,
  item.duplicateOfUrl,
]);

const fundingProductRollupRows = (brief.fundingProductRollup?.rows ?? []).map((item) => [
  item.name,
  item.dominantLane,
  item.eventCount,
  item.coreEventCount,
  item.supplementalEventCount,
  item.supportingEvidenceRows,
  item.explicitUsdEvents,
  item.explicitUsdM,
  item.irlRelated ? "yes" : "no",
  item.latestDate,
  item.amountTypes.join(" | "),
  item.sourceTypes.join(" | "),
  item.conclusion,
  evidenceText(item.evidence),
]);

const fundingDiscoveryCandidateRows = (brief.discoveryScan?.fundingCandidateReview ?? []).map((item) => [
  item.scanId,
  item.scanLabel,
  item.candidateName,
  item.publishedMonth,
  item.lane,
  item.amountMention,
  item.handlingStatus,
  item.nextAction,
  item.title,
  item.url,
  item.highlight,
]);

const candidatePromotionQueueRows = (brief.candidatePromotionQueue?.rows ?? []).map((item) => [
  item.type,
  item.name,
  item.lane,
  item.priority,
  item.currentStatus,
  item.promotionDecision,
  item.amountOrSignal,
  item.missingEvidence.join(" | "),
  item.nextAction,
  item.source,
  evidenceText(item.evidence),
]);

const alertReviewRows = (brief.candidateReview?.latestAlertReview ?? []).map((item) => [
  item.name,
  item.source,
  item.decision,
  item.reason,
  evidenceText(item.evidence),
]);

const recentSignalReviewRows = (brief.candidateReview?.recentSignalReview ?? []).map((item) => [
  item.name,
  item.source,
  item.decision,
  item.lane,
  item.upgradePath,
  item.action,
  item.priority,
  item.status,
  item.publishedDate,
  item.reason,
  evidenceText(item.evidence),
]);

const monitorRows = (monitor.recentItems ?? []).map((item) => [
  item.monitorLabel,
  item.priority,
  item.isKnown ? "known" : "new",
  item.title,
  item.publishedDate,
  item.url,
  item.highlight,
]);

const monitorLaneRoutingRows = (brief.candidateReview?.monitorLaneRouting ?? []).map((item) => [
  item.lane,
  item.total,
  item.new,
  item.known,
  item.critical,
  item.examples.join(" | "),
]);

const discoveryRows = (brief.discoveryScan?.reviewItems ?? []).map((item) => [
  item.name,
  item.lane,
  item.decision,
  item.reason,
  evidenceText(item.evidence),
]);

const languageLongTailRows = (brief.discoveryScan?.languageLongTailReview ?? []).map((item) => [
  item.name,
  item.source,
  item.decision,
  item.publishedDate,
  item.reason,
  item.highlight,
  evidenceText(item.evidence),
]);

const languageCoverageRows = (brief.languageCoverageAudit?.rows ?? []).map((item) => [
  item.name,
  item.status,
  item.decision,
  item.sources.join(" | "),
  item.decisions.join(" | "),
  item.evidenceCount,
  item.reason,
  evidenceText(item.evidence),
]);

const languageSimilarityRows = (brief.languageSimilarityAudit?.rows ?? []).map((item) => [
  item.name,
  item.status,
  item.decision,
  item.similarity,
  item.score,
  item.features.join(" | "),
  item.difference,
  item.growthSignal,
  item.channel,
  item.evidenceGrade,
  item.evidenceCount,
  item.sources.join(" | "),
  item.nextCheck,
  evidenceText(item.evidence),
]);

const languageOfficialEvidenceRows = (brief.languageOfficialEvidenceMap?.rows ?? []).map((item) => [
  item.name,
  item.similarity,
  item.similarityScore,
  item.evidenceReadiness,
  item.officialStatus,
  item.officialWebLinks,
  item.appStoreLinks,
  item.googlePlayLinks,
  item.linkedInLinks,
  item.socialCommunityLinks,
  item.growthSignal,
  item.channel,
  item.functionalDifference,
  item.irlMode,
  item.evidenceGrade,
  item.gaps.join(" | "),
  item.nextCheck,
  evidenceText(item.evidence),
]);

const languageGrowthChannelDeepDiveRows = (brief.languageGrowthChannelDeepDive?.rows ?? []).map((item) => [
  item.name,
  item.category,
  item.queryId,
  item.requestId,
  item.curatedStatus,
  item.similarity,
  item.evidenceStrength,
  item.matchedResults,
  item.totalResults,
  item.channelTags.join(" | "),
  item.growthSignal,
  item.channelSignal,
  item.nextCheck,
  evidenceText(item.evidence),
]);

const irlCoverageRows = (brief.irlCoverageAudit?.rows ?? []).map((item) => [
  item.name,
  item.status,
  item.lane,
  item.decision,
  item.sources.join(" | "),
  item.decisions.join(" | "),
  item.reason,
  evidenceText(item.evidence),
]);

const irlOfflineEvidenceRows = (brief.irlOfflineEvidenceMap?.rows ?? []).map((item) => [
  item.name,
  item.status,
  item.offlineMode,
  item.productInMatrix ? "yes" : "no",
  item.fundingEventCount,
  item.monitorSignalCount,
  item.evidenceStrength,
  item.sources.join(" | "),
  item.decisions.join(" | "),
  item.reason,
  item.nextCheck,
  (item.fundingEvents ?? []).map((event) => `${event.date} ${event.name} ${event.amount}: ${event.url}`).join(" | "),
  (item.monitorSignals ?? []).map((signal) => `${signal.source} ${signal.name}: ${signal.url}`).join(" | "),
  evidenceText(item.evidence),
]);

const supplementalTimelineRows = (brief.discoveryScan?.supplementalFundingNews ?? []).map((item) => [
  item.date,
  item.name,
  item.amount,
  item.lane,
  item.url,
  item.title,
  item.highlight,
]);

const sourceLinkageRows = (brief.sourceLinkageAudit?.rows ?? []).map((item) => [
  item.sourceLayer,
  item.queryId,
  item.category,
  item.requestId,
  item.linkageType,
  item.reviewTier,
  item.reviewDecision,
  item.matchedEntities.join(" | "),
  item.matchedTypes.join(" | "),
  item.reviewReason,
  item.publishedDate,
  item.title,
  item.url,
]);

const coverageGapRows = (brief.coverageGapRegister?.groups ?? []).map((item) => [
  item.reviewTier,
  item.reviewDecision,
  item.priority,
  item.queryId,
  item.category,
  item.count,
  item.deepDiveReviewed ?? 0,
  item.signalReviewed ?? 0,
  item.unresolvedCount ?? item.count,
  item.handlingStatus ?? "",
  (item.reviewedDecisions ?? []).join(" | "),
  (item.signalDecisions ?? []).join(" | "),
  item.nextAction,
  item.reason,
  (item.reviewed ?? []).map((review) => `${review.name}: ${review.decision} (${review.lane})`).join(" | "),
  (item.signalReviewedItems ?? []).map((review) => `${review.name}: ${review.decision} (${review.lane})`).join(" | "),
  item.examples.map((example) => `${example.title}: ${example.url}`).join(" | "),
]);

const candidateDeepDiveRows = (brief.candidateDeepDive?.rows ?? []).map((item) => [
  item.name,
  item.lane,
  item.decision,
  item.priority,
  item.totalResults,
  item.sourceQueryId,
  item.seedUrl,
  item.reason,
  item.requestIds.join(" | "),
  evidenceText(item.evidence),
]);

const residualSignalReviewRows = (brief.residualSignalReview?.rows ?? []).map((item) => [
  item.name,
  item.sourceQueryId,
  item.sourceCategory,
  item.requestId,
  item.lane,
  item.decision,
  item.reason,
  item.publishedDate,
  item.title,
  item.url,
  item.highlight,
]);

const objectiveEvidenceRows = (brief.objectiveEvidenceMap ?? []).map((item) => [
  item.id,
  item.requirement,
  item.status,
  item.views.join(" | "),
  item.dataFiles.join(" | "),
  item.exportFiles.join(" | "),
  item.validators.join(" | "),
  item.evidence,
  item.boundary,
]);

const goalReadinessRows = [
  ...(brief.goalReadiness?.hardGates ?? []).map((item) => [
    "hard-gate",
    item.gate,
    item.pass ? "pass" : "fail",
    item.value,
    item.evidence,
  ]),
  [
    "coverage-gap",
    "blocking-product-candidate",
    brief.goalReadiness?.blockingGaps?.rows === 0 ? "pass" : "fail",
    brief.goalReadiness?.blockingGaps?.rows ?? "",
    brief.goalReadiness?.blockingGaps?.reason ?? "",
  ],
  [
    "coverage-gap",
    "monitored-signal-candidate",
    "monitoring",
    brief.goalReadiness?.monitoredGaps?.rows ?? "",
    brief.goalReadiness?.monitoredGaps?.reason ?? "",
  ],
  [
    "coverage-gap",
    "background-low-relevance",
    "retained",
    brief.goalReadiness?.backgroundGaps?.rows ?? "",
    brief.goalReadiness?.backgroundGaps?.reason ?? "",
  ],
];

await mkdir(exportDir, { recursive: true });

const files = [
  {
    path: new URL("objective-evidence-map.csv", exportDir),
    headers: ["目标ID", "需求", "状态", "网页视图", "数据文件", "导出附件", "验证门", "证据摘要", "边界说明"],
    rows: objectiveEvidenceRows,
  },
  {
    path: new URL("goal-readiness.csv", exportDir),
    headers: ["类型", "检查项", "状态", "数值", "证据/原因"],
    rows: goalReadinessRows,
  },
  {
    path: new URL("competitive-matrix.csv", exportDir),
    headers: ["产品/公司", "赛道", "IRL", "证据等级", "增长信号", "渠道", "功能差异", "证据", "官方/社媒"],
    rows: productRows,
  },
  {
    path: new URL("source-coverage.csv", exportDir),
    headers: ["来源层", "查询ID", "类别", "requestId", "结果数", "唯一域名数", "头部来源域名", "查询语句"],
    rows: sourceCoverageRows,
  },
  {
    path: new URL("exa-category-evidence-audit.csv", exportDir),
    headers: ["Exa类别", "查询数", "结果数", "查询ID", "下游用途", "网页视图", "导出附件", "证据对象", "下一步补证"],
    rows: categoryEvidenceRows,
  },
  {
    path: new URL("source-linkage-audit.csv", exportDir),
    headers: ["来源层", "查询ID", "类别", "requestId", "关联状态", "复核层级", "复核结论", "匹配实体", "匹配类型", "复核原因", "发布日期", "原始标题", "URL"],
    rows: sourceLinkageRows,
  },
  {
    path: new URL("coverage-gap-register.csv", exportDir),
    headers: ["复核层级", "复核结论", "优先级", "查询ID", "类别", "缺口数", "已深挖候选数", "已分流信号数", "剩余数", "处理状态", "深挖结论", "信号分流结论", "下一步动作", "原因", "深挖候选", "已分流信号", "示例"],
    rows: coverageGapRows,
  },
  {
    path: new URL("candidate-deep-dive.csv", exportDir),
    headers: ["名称", "赛道/边界", "补证结论", "优先级", "Exa结果数", "来源查询ID", "种子URL", "原因", "requestIds", "证据"],
    rows: candidateDeepDiveRows,
  },
  {
    path: new URL("residual-signal-review.csv", exportDir),
    headers: ["名称", "来源查询ID", "类别", "requestId", "赛道/边界", "处理结论", "原因", "发布日期", "原始标题", "URL", "摘要"],
    rows: residualSignalReviewRows,
  },
  {
    path: new URL("product-capability-score.csv", exportDir),
    headers: ["产品/公司", "赛道", "能力分", "展示层级", "证据等级", "IRL", "增长信号分", "渠道分", "功能差异分", "IRL分", "评分原因", "增长信号", "渠道", "功能差异", "证据"],
    rows: productCapabilityRows,
  },
  {
    path: new URL("growth-channel-audit.csv", exportDir),
    headers: ["产品/公司", "赛道", "IRL", "证据等级", "增长强度", "增长分", "渠道标签数", "渠道标签", "增长判断", "下一步校验", "增长信号", "渠道原文", "功能差异", "证据数"],
    rows: growthChannelRows,
  },
  {
    path: new URL("acquisition-channel-map.csv", exportDir),
    headers: ["产品/公司", "赛道", "IRL", "证据等级", "增长强度", "主获客渠道", "获客模式", "自然/付费属性", "渠道标签", "渠道标签数", "置信度", "置信原因", "下一步校验", "增长信号", "渠道原文", "证据"],
    rows: acquisitionChannelRows,
  },
  {
    path: new URL("paid-acquisition-evidence-audit.csv", exportDir),
    headers: [
      "产品/公司",
      "赛道",
      "IRL",
      "证据等级",
      "增长强度",
      "主获客渠道",
      "获客模式",
      "自然/付费属性",
      "投放证据等级",
      "投放信号类型",
      "置信度",
      "可声称级别",
      "安全表述",
      "下一步校验",
      "渠道标签",
      "增长信号",
      "渠道原文",
      "证据",
    ],
    rows: paidAcquisitionEvidenceRows,
  },
  {
    path: new URL("functional-difference-audit.csv", exportDir),
    headers: ["产品/公司", "赛道", "IRL", "证据等级", "机制标签数", "机制标签", "AI角色", "真人互动形态", "下一步校验", "功能差异原文", "增长信号", "渠道原文"],
    rows: functionalDifferenceRows,
  },
  {
    path: new URL("official-social-coverage-audit.csv", exportDir),
    headers: ["产品/公司", "赛道", "证据等级", "覆盖状态", "总证据数", "官网", "App Store", "Google Play", "LinkedIn", "社媒/社区", "新闻/第三方", "缺口", "下一步校验", "证据"],
    rows: officialSocialCoverageRows,
  },
  {
    path: new URL("official-gap-deep-dive.csv", exportDir),
    headers: ["产品/公司", "分组", "证据类型", "证据"],
    rows: officialGapDeepDiveRows,
  },
  {
    path: new URL("language-official-social-deep-dive.csv", exportDir),
    headers: ["产品/公司", "Exa query", "状态", "HTTP", "requestId", "结果数", "Top results"],
    rows: languageOfficialSocialDeepDiveRows,
  },
  {
    path: new URL("company-background-review.csv", exportDir),
    headers: ["来源类别", "主体", "关联主表产品", "赛道/参照", "维度", "信号", "解释", "证据"],
    rows: companyBackgroundRows,
  },
  {
    path: new URL("company-background-deep-dive.csv", exportDir),
    headers: ["来源类别", "主体", "关联主表产品", "维度", "信号", "解释", "证据"],
    rows: companyBackgroundDeepDiveRows,
  },
  {
    path: new URL("company-background-coverage-audit.csv", exportDir),
    headers: [
      "产品/公司",
      "赛道",
      "证据等级",
      "能力层级",
      "背景覆盖状态",
      "直接people信号",
      "直接company信号",
      "直接financial信号",
      "已覆盖直接维度",
      "仍缺直接维度",
      "产品级信号数",
      "市场people信号",
      "市场financial信号",
      "直接关联主体",
      "市场背景信号",
      "下一步校验",
    ],
    rows: companyBackgroundCoverageRows,
  },
  {
    path: new URL("market-decision-evidence-map.csv", exportDir),
    headers: ["来源类别", "信号名称", "判断区域", "关联主表产品", "判断结论", "业务影响", "证据强度", "目标视图", "下一步动作", "证据"],
    rows: marketDecisionEvidenceRows,
  },
  {
    path: new URL("funding-timeline.csv", exportDir),
    headers: ["日期", "产品/公司", "金额/事件", "赛道", "证据"],
    rows: timelineRows,
  },
  {
    path: new URL("funding-news-review.csv", exportDir),
    headers: ["来源", "日期", "产品/公司", "金额/事件", "赛道", "IRL/线下真人相关", "明确美元融资M", "证据", "原始标题", "摘要"],
    rows: fundingNewsReviewRows,
  },
  {
    path: new URL("funding-news-dedup-audit.csv", exportDir),
    headers: ["去重键", "来源", "日期", "产品/公司", "金额/事件", "赛道", "重复组大小", "计入唯一事件", "证据"],
    rows: fundingNewsDedupRows,
  },
  {
    path: new URL("funding-event-audit.csv", exportDir),
    headers: ["去重键", "来源", "日期", "日期精度", "近两年窗口内", "产品/公司", "金额/事件", "金额类型", "明确美元融资M", "原赛道", "归一赛道", "IRL/线下真人相关", "来源类型", "重复组大小", "计入唯一事件", "结论", "证据"],
    rows: fundingEventAuditRows,
  },
  {
    path: new URL("funding-upgrade-map.csv", exportDir),
    headers: ["去重键", "日期", "产品/公司", "金额/事件", "原赛道", "归一赛道", "升级/处理状态", "计入唯一事件", "重复对应主事件", "IRL/线下真人相关", "明确美元融资M", "金额类型", "来源类型", "目标视图", "下一步动作", "证据", "对应主事件证据"],
    rows: fundingUpgradeRows,
  },
  {
    path: new URL("funding-product-rollup.csv", exportDir),
    headers: ["产品/公司", "主赛道", "唯一事件数", "主时间线事件数", "补充候选事件数", "重复佐证行", "明确美元融资事件数", "明确美元融资M", "IRL/线下真人相关", "最近日期", "金额类型", "来源类型", "结论", "证据"],
    rows: fundingProductRollupRows,
  },
  {
    path: new URL("funding-discovery-candidates.csv", exportDir),
    headers: ["扫描ID", "扫描主题", "候选名称", "发布日期/月", "赛道", "金额/规模信号", "处理状态", "下一步动作", "原始标题", "证据", "摘要"],
    rows: fundingDiscoveryCandidateRows,
  },
  {
    path: new URL("candidate-promotion-queue.csv", exportDir),
    headers: ["候选类型", "名称", "赛道", "优先级", "当前状态", "升级判断", "金额/信号", "缺失证据", "下一步动作", "来源", "证据"],
    rows: candidatePromotionQueueRows,
  },
  {
    path: new URL("latest-alert-review.csv", exportDir),
    headers: ["名称", "来源", "处理结论", "原因", "证据"],
    rows: alertReviewRows,
  },
  {
    path: new URL("monitor-recent-review.csv", exportDir),
    headers: ["名称", "来源", "处理结论", "目标主线", "升级路径", "动作建议", "优先级", "状态", "发布日期", "原因", "证据"],
    rows: recentSignalReviewRows,
  },
  {
    path: new URL("monitor-lane-routing.csv", exportDir),
    headers: ["目标主线", "近窗信号数", "新增", "已知", "critical", "示例"],
    rows: monitorLaneRoutingRows,
  },
  {
    path: new URL("monitor-recent-signals.csv", exportDir),
    headers: ["监控主题", "优先级", "状态", "标题", "发布日期", "URL", "摘要"],
    rows: monitorRows,
  },
  {
    path: new URL("discovery-candidates.csv", exportDir),
    headers: ["名称", "赛道", "处理建议", "原因", "证据"],
    rows: discoveryRows,
  },
  {
    path: new URL("language-long-tail-review.csv", exportDir),
    headers: ["名称", "来源", "处理建议", "发现日期", "原因", "Exa 摘要", "证据"],
    rows: languageLongTailRows,
  },
  {
    path: new URL("language-coverage-audit.csv", exportDir),
    headers: ["名称", "覆盖状态", "主结论", "来源层", "所有结论", "证据数", "原因", "证据"],
    rows: languageCoverageRows,
  },
  {
    path: new URL("language-similarity-audit.csv", exportDir),
    headers: ["名称", "覆盖状态", "主结论", "相似度", "相似度分", "相似特征", "差异点", "增长信号", "渠道", "证据等级", "证据数", "来源层", "下一步校验", "证据"],
    rows: languageSimilarityRows,
  },
  {
    path: new URL("language-official-evidence-map.csv", exportDir),
    headers: ["名称", "相似度", "相似度分", "证据准备度", "官方证据状态", "官网数", "App Store数", "Google Play数", "LinkedIn数", "社媒/社区数", "增长信号", "渠道", "功能差异", "IRL模式", "证据等级", "缺口", "下一步校验", "证据"],
    rows: languageOfficialEvidenceRows,
  },
  {
    path: new URL("language-growth-channel-deep-dive.csv", exportDir),
    headers: ["名称", "Exa类别", "查询ID", "requestId", "收录状态", "相似度", "证据强度", "匹配结果数", "总结果数", "渠道标签", "增长信号", "渠道原文/判断", "下一步校验", "证据"],
    rows: languageGrowthChannelDeepDiveRows,
  },
  {
    path: new URL("irl-coverage-audit.csv", exportDir),
    headers: ["名称", "覆盖状态", "IRL/赛道", "主结论", "来源层", "所有结论", "原因", "证据"],
    rows: irlCoverageRows,
  },
  {
    path: new URL("irl-offline-evidence-map.csv", exportDir),
    headers: ["名称", "覆盖状态", "线下模式", "进入主表", "融资/新闻事件数", "monitor 近窗信号数", "证据强度", "来源层", "所有结论", "原因", "下一步校验", "融资/新闻证据", "monitor 证据", "原始证据"],
    rows: irlOfflineEvidenceRows,
  },
  {
    path: new URL("supplemental-funding-news.csv", exportDir),
    headers: ["日期", "产品/公司", "金额/事件", "赛道", "证据", "原始标题", "摘要"],
    rows: supplementalTimelineRows,
  },
];

for (const file of files) {
  await writeFile(file.path, `\ufeff${toCsv(file.headers, file.rows)}\n`);
}

console.log(JSON.stringify({
  ok: true,
  exportDir: exportDir.pathname,
  files: files.map((file) => ({
    name: file.path.pathname.split("/").pop(),
    rows: file.rows.length,
  })),
}, null, 2));
