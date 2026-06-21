import { access, readFile } from "node:fs/promises";

const brief = JSON.parse(await readFile(new URL("../data/brief.json", import.meta.url), "utf8"));
const exa = JSON.parse(await readFile(new URL("../data/exa-results.json", import.meta.url), "utf8"));
const synthesis = JSON.parse(await readFile(new URL("../data/exa-synthesis.json", import.meta.url), "utf8"));
const monitor = JSON.parse(await readFile(new URL("../data/monitor.json", import.meta.url), "utf8"));
const monitorHistory = JSON.parse(await readFile(new URL("../data/monitor-history.json", import.meta.url), "utf8"));
const monitorLedger = JSON.parse(await readFile(new URL("../data/monitor-ledger.json", import.meta.url), "utf8"));
const monitorDigest = JSON.parse(await readFile(new URL("../data/monitor-digest.json", import.meta.url), "utf8"));
const websetsMonitor = JSON.parse(await readFile(new URL("../data/exa-websets-monitor.json", import.meta.url), "utf8"));
const discovery = JSON.parse(await readFile(new URL("../data/exa-discovery-scan.json", import.meta.url), "utf8"));
const candidateDeepDive = JSON.parse(await readFile(new URL("../data/exa-candidate-deep-dive.json", import.meta.url), "utf8"));
const runAllScript = await readFile(new URL("./run-all.mjs", import.meta.url), "utf8");
const snapshotScript = await readFile(new URL("./snapshot-current.mjs", import.meta.url), "utf8");
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
const featureVersionLog = await readFile(new URL("../功能与版本记录.md", import.meta.url), "utf8");
const deliveryNote = await readFile(new URL("../交付说明.md", import.meta.url), "utf8");
const completionAudit = await readFile(new URL("../exports/completion-audit.md", import.meta.url), "utf8");
const completionManifest = JSON.parse(await readFile(new URL("../exports/completion-manifest.json", import.meta.url), "utf8"));
const originalObjectiveAudit = await readFile(new URL("../exports/original-objective-audit.md", import.meta.url), "utf8");
const originalObjectiveAuditJson = JSON.parse(await readFile(new URL("../exports/original-objective-audit.json", import.meta.url), "utf8"));
const currentState = await readFile(new URL("../exports/current-state.md", import.meta.url), "utf8");
const currentStateJson = JSON.parse(await readFile(new URL("../exports/current-state.json", import.meta.url), "utf8"));
const browserQaReport = await readFile(new URL("../exports/browser-qa-report.md", import.meta.url), "utf8");
const latestMonitorRun = await readFile(new URL("../exports/latest-monitor-run.md", import.meta.url), "utf8");
const latestMonitorRunJson = JSON.parse(await readFile(new URL("../exports/latest-monitor-run.json", import.meta.url), "utf8"));
const exaCategoryCoverageGuide = await readFile(new URL("../exports/exa-category-coverage-guide.md", import.meta.url), "utf8");
const automationAudit = await readFile(new URL("../exports/automation-audit.md", import.meta.url), "utf8");
const demoChecklist = await readFile(new URL("../exports/demo-checklist.md", import.meta.url), "utf8");
const latestAlertReviewCsv = await readFile(new URL("../exports/latest-alert-review.csv", import.meta.url), "utf8");
const monitorRecentReviewCsv = await readFile(new URL("../exports/monitor-recent-review.csv", import.meta.url), "utf8");
const paidClaimCounts = (brief.paidAcquisitionEvidenceAudit?.rows ?? []).reduce((acc, row) => {
  acc[row.claimLevel] = (acc[row.claimLevel] ?? 0) + 1;
  return acc;
}, {});
const monitorZeroNewAlertStreak = (monitorHistory.runs ?? []).findIndex((run) => (run.summary?.newAlerts ?? 0) > 0);
const zeroNewAlertRunCount = monitorZeroNewAlertStreak === -1 ? (monitorHistory.runs ?? []).length : monitorZeroNewAlertStreak;

const requiredProducts = [
  "HelloTalk",
  "Tandem",
  "SewaYou",
  "Hilokal",
  "Lingbe",
  "Conversation Exchange",
  "Linguado",
  "SpeakyParrot",
  "Fluently",
  "Slowly",
  "Character.AI",
  "Replika",
  "Chai",
  "Talkie",
  "PolyBuzz",
  "HiWaifu",
  "222",
  "Pie",
  "Timeleft",
  "Partiful",
  "Meet5",
  "Breeze",
  "WeRoad",
  "Aglow Life",
  "Paxmeet",
  "MeetMux",
  "Weekend",
  "Thursday",
  "WeMeet by WeRoad",
];

const requiredTimelineNames = [
  "Butterflies AI",
  "Dippy AI",
  "Daze",
  "Tolan",
  "Pie",
  "222",
  "Timeleft",
  "Partiful",
  "Status AI",
  "PolyBuzz",
  "HiWaifu",
  "Meet5",
  "Breeze",
  "WeRoad",
  "Thursday",
  "Bumble Bee",
  "Tinder Live Events",
];

const allProductText = brief.clusters
  .flatMap((cluster) => cluster.items)
  .map((item) => `${item.name} ${item.signal} ${item.differentiator}`)
  .join("\n");

const timelineText = brief.fundingTimeline
  .map((item) => `${item.name} ${item.amount} ${item.lane}`)
  .join("\n");

const allEvidenceText = [
  allProductText,
  timelineText,
  (brief.financialSignals ?? []).map((item) => `${item.name} ${item.signal}`).join("\n"),
  (brief.officialSocialEvidence?.groups ?? [])
    .flatMap((group) => group.items)
    .map((item) => item.name)
    .join("\n"),
].join("\n");

const rawResultCount = exa.searches.reduce((count, search) => count + (search.results?.length ?? 0), 0);
const rawRequestIds = exa.searches.map((search) => search.requestId);
const rawUrls = new Set();
const rawDomains = new Set();
for (const search of exa.searches) {
  for (const result of search.results ?? []) {
    if (!result.url) continue;
    rawUrls.add(result.url);
    try {
      rawDomains.add(new URL(result.url).hostname.replace(/^www\./, ""));
    } catch {
      // Exa occasionally returns nonstandard URLs; they still stay in rawUrls.
    }
  }
}
const currentProductCandidateNames = new Set(
  (brief.sourceLinkageAudit?.rows ?? [])
    .filter((row) => row.reviewTier === "product-candidate")
    .map((row) =>
      String(row.title ?? "")
        .replace(/\s+-\s+.*$/, "")
        .replace(/\s+\|\s+.*$/, "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean),
);

const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

async function fileExists(path) {
  try {
    await access(new URL(path, import.meta.url));
    return true;
  } catch {
    return false;
  }
}

async function csvRowCount(path) {
  const text = await readFile(new URL(path, import.meta.url), "utf8");
  return text.trim().split(/\r?\n/).length - 1;
}

expect(brief.coverage.queries === exa.searches.length, "brief.coverage.queries must match Exa search count");
expect(brief.coverage.results === rawResultCount, "brief.coverage.results must match raw Exa result count");
expect(brief.coverage.uniqueUrls === rawUrls.size, "brief.coverage.uniqueUrls must match raw unique URLs");
expect(brief.coverage.uniqueDomains === rawDomains.size, "brief.coverage.uniqueDomains must match raw unique domains");
expect(brief.requestIds.length === rawRequestIds.length, "brief.requestIds length must match raw requestIds");
expect(rawRequestIds.every((id) => brief.requestIds.includes(id)), "brief.requestIds must include every raw Exa requestId");
expect(brief.clusters.length >= 4, "brief must contain at least four product clusters");
expect(brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0) >= 38, "brief must contain at least 38 product evidence cards");
expect(brief.clusters.find((cluster) => cluster.id === "language")?.items.length >= 10, "language exchange cluster must include broad HelloTalk/Tandem adjacent coverage");
expect(brief.clusters.find((cluster) => cluster.id === "irl")?.items.length >= 14, "IRL cluster must include offline social boundary coverage");
expect(brief.fundingTimeline.length >= 24, "brief must contain at least 24 funding/news timeline events");
expect(brief.fundingSummary?.totalEvents === brief.fundingTimeline.length, "funding summary must match timeline event count");
expect(brief.fundingSummary?.supplementalEvents === (brief.discoveryScan?.supplementalFundingNews?.length ?? 0), "funding summary must count supplemental funding/news events");
expect(brief.fundingSummary?.combinedEvents === brief.fundingSummary.totalEvents + brief.fundingSummary.supplementalEvents, "funding summary combined event count must match main plus supplemental");
expect(brief.fundingSummary?.uniqueCombinedEvents < brief.fundingSummary?.combinedEvents, "funding summary must expose deduped combined funding/news count");
expect(brief.fundingSummary?.duplicateCombinedEvents === brief.fundingSummary.combinedEvents - brief.fundingSummary.uniqueCombinedEvents, "funding/news duplicate row count must match raw minus unique");
expect(brief.fundingSummary?.dedupAudit?.rows?.length === brief.fundingSummary.combinedEvents, "funding/news dedupe audit must cover every combined row");
expect(brief.fundingSummary?.dedupAudit?.duplicateGroups?.length >= 3, "funding/news dedupe audit must identify duplicate groups");
expect(brief.fundingSummary?.dateWindowAudit?.windowStart === "2024.06", "funding summary must record near-two-year window start");
expect(brief.fundingSummary?.dateWindowAudit?.windowEnd === "2026.06", "funding summary must record near-two-year window end");
expect(brief.fundingSummary?.dateWindowAudit?.main?.total === brief.fundingTimeline.length, "main date-window audit must cover every timeline event");
expect(brief.fundingSummary?.dateWindowAudit?.main?.inWindow === brief.fundingTimeline.length, "every main timeline event must be inside the near-two-year window");
expect(brief.fundingSummary?.dateWindowAudit?.supplemental?.total === (brief.discoveryScan?.supplementalFundingNews?.length ?? 0), "supplemental date-window audit must cover every supplemental event");
expect(brief.fundingSummary?.dateWindowAudit?.supplemental?.inWindow === (brief.discoveryScan?.supplementalFundingNews?.length ?? 0), "every supplemental funding/news event must be inside the near-two-year window");
expect(brief.fundingSummary?.dateWindowAudit?.outOfWindowTotal === 0, "funding/news date-window audit must have no out-of-window events");
expect(brief.fundingSummary?.irlEvents >= 8, "funding summary must count IRL funding/news events");
expect(brief.fundingSummary?.explicitUsdFundingEvents >= 15, "funding summary must count explicit USD funding events");
expect(brief.fundingSummary?.explicitUsdFundingM >= 150, "funding summary must include explicit USD funding total");
expect(brief.fundingSummary?.byYear?.length >= 3, "funding summary must include year breakdown");
expect(brief.fundingSummary?.byLane?.length >= 5, "funding summary must include lane breakdown");
expect(brief.fundingSummary?.topUsdRounds?.length >= 5, "funding summary must include top USD rounds");
expect(Boolean(brief.fundingSummary?.caveat), "funding summary must include caveat for amount methodology");
expect(brief.fundingEventAudit?.totalRows === brief.fundingSummary.combinedEvents, "funding event audit must cover every combined funding/news row");
expect(brief.fundingEventAudit?.uniqueRows === brief.fundingSummary.uniqueCombinedEvents, "funding event audit unique rows must match dedupe unique count");
expect(brief.fundingEventAudit?.outOfWindowRows === 0, "funding event audit must have no out-of-window rows");
expect(brief.fundingEventAudit?.irlRows >= brief.fundingSummary.irlEvents, "funding event audit must preserve IRL/offline-human event count");
expect(brief.fundingEventAudit?.rows?.every((item) => item.datePrecision && item.amountType && item.sourceType && item.conclusion), "funding event audit rows must include date precision, amount type, source type, and conclusion");
expect(brief.fundingIntegritySummary?.status === "window-clean", "funding integrity summary must report a clean audited window");
expect(brief.fundingIntegritySummary?.combinedRows === brief.fundingEventAudit.totalRows, "funding integrity summary combined rows must match event audit");
expect(brief.fundingIntegritySummary?.uniqueRows === brief.fundingEventAudit.uniqueRows, "funding integrity summary unique rows must match event audit");
expect(brief.fundingIntegritySummary?.outOfWindowRows === brief.fundingEventAudit.outOfWindowRows, "funding integrity summary out-of-window rows must match event audit");
expect(brief.fundingIntegritySummary?.productRollupRows === brief.fundingProductRollup?.totalProducts, "funding integrity summary product rollup rows must match product rollup");
expect(brief.fundingUpgradeMap?.totalRows === brief.discoveryScan.supplementalFundingNews.length, "funding upgrade map must cover every supplemental funding/news row");
expect(brief.fundingUpgradeMap?.retainedCandidates + brief.fundingUpgradeMap?.duplicateEvidenceRows === brief.fundingUpgradeMap?.totalRows, "funding upgrade map statuses must partition supplemental rows");
expect(brief.fundingUpgradeMap?.duplicateEvidenceRows === brief.fundingSummary.duplicateCombinedEvents, "funding upgrade map duplicate evidence count must match dedupe duplicate rows");
expect(brief.fundingUpgradeMap?.rows?.every((item) => item.upgradeStatus && item.nextAction && item.targetView), "funding upgrade map rows must include handling status, next action, and target view");
expect(brief.fundingProductRollup?.totalProducts >= 20, "funding product rollup must aggregate funding/news by product");
expect(brief.fundingProductRollup?.irlProducts >= 5, "funding product rollup must preserve IRL/offline-human product count");
expect(brief.fundingProductRollup?.explicitUsdFundingM >= brief.fundingSummary.explicitUsdFundingM, "funding product rollup explicit USD total must preserve the main timeline USD amount");
expect(brief.fundingProductRollup?.explicitUsdFundingM === Number((brief.fundingProductRollup?.rows ?? []).reduce((sum, item) => sum + item.explicitUsdM, 0).toFixed(1)), "funding product rollup explicit USD total must match product row totals");
expect(brief.fundingProductRollup?.rows?.every((item) => item.name && item.dominantLane && item.eventCount > 0 && item.latestDate && item.conclusion && item.evidence?.length > 0), "funding product rollup rows must include product, lane, event count, latest date, conclusion, and evidence");
expect(brief.fundingProductRollup?.byLane?.length >= 5, "funding product rollup must group products by lane");
expect(brief.researchSignals.length >= 4, "brief must contain at least four research/safety signals");
expect(brief.coverageAudit?.coreCovered?.length >= 5, "coverage audit must list core covered areas");
expect(brief.coverageAudit?.watchlist?.length >= 3, "coverage audit must list watchlist gaps");
expect(brief.coverageAudit?.method?.length >= 3, "coverage audit must document method boundaries");
expect(brief.discoveryScan?.totalScans >= 6, "discovery scan must include broad blind-spot scans");
expect(brief.discoveryScan?.totalResults >= 50, "discovery scan must include enough supplementary results");
expect(brief.discoveryScan?.requestIds?.length === discovery.scans?.length, "discovery scan must retain requestIds");
expect(brief.discoveryScan?.groups?.some((group) => group.id === "ai_friend_wearables"), "discovery scan must cover AI friend/wearable blind spot");
expect(brief.discoveryScan?.groups?.some((group) => group.id === "ai_dating_discovery"), "discovery scan must cover AI dating blind spot");
expect(brief.discoveryScan?.groups?.some((group) => group.id === "companion_long_tail"), "discovery scan must cover companion long tail");
expect(brief.discoveryScan?.reviewItems?.length >= 7, "discovery scan must include classified candidate review items");
expect(brief.discoveryScan?.languageLongTailReview?.length >= 8, "discovery scan must include language-exchange long-tail review");
expect(brief.discoveryScan?.languageLongTailReview?.some((item) => item.decision === "已入主表"), "language long-tail review must identify products already in the main table");
expect(brief.discoveryScan?.languageLongTailReview?.some((item) => ["候选补证", "继续观察", "长尾留档"].includes(item.decision)), "language long-tail review must identify candidates needing more evidence or resolved long-tail handling");
expect(brief.languageCoverageAudit?.totalUnique >= 19, "language coverage audit must combine core, long-tail, and deep-dive language candidates");
expect(brief.languageCoverageAudit?.coreCount === brief.clusters.find((cluster) => cluster.id === "language")?.items.length, "language coverage core count must match language cluster");
expect(
  brief.languageCoverageAudit?.watchlistCount >= 1 ||
    brief.languageCoverageAudit?.rows?.some((item) => item.name === "LingoPraxis" && item.status === "boundary" && /长尾留档|targeted Exa/.test(`${item.decision} ${item.reason}`)),
  "language coverage audit must keep unresolved language candidates or explicit resolved long-tail boundary handling",
);
expect(brief.languageCoverageAudit?.rows?.some((item) => item.name === "LingoPraxis"), "language coverage audit must include candidate deep-dive language products");
expect(brief.languageSimilarityAudit?.totalRows === brief.languageCoverageAudit.totalUnique, "language similarity audit must cover every language coverage row");
expect(brief.languageSimilarityAudit?.baselineProducts === 2, "language similarity audit must keep HelloTalk and Tandem as baselines");
expect(brief.languageSimilarityAudit?.highlySimilar >= 3, "language similarity audit must identify highly similar products beyond the baselines");
expect(brief.languageSimilarityAudit?.rows?.every((item) => item.similarity && item.score >= 0 && item.features && item.nextCheck), "language similarity rows must include similarity, score, features, and next check");
expect(brief.languageOfficialEvidenceMap?.totalRows === brief.clusters.find((cluster) => cluster.id === "language")?.items.length, "language official evidence map must cover every curated language product");
expect(brief.languageOfficialEvidenceMap?.rows?.every((item) => item.growthSignal && item.channel && item.functionalDifference && item.officialStatus && item.nextCheck), "language official evidence map rows must include growth, channel, functional difference, official status, and next check");
expect(brief.languageOfficialEvidenceMap?.withStoreRows >= 6, "language official evidence map must identify app-store coverage");
expect(brief.languageOfficialEvidenceMap?.thinRows > 0, "language official evidence map must retain thin-evidence rows for follow-up");
expect(brief.languageGrowthChannelDeepDive?.searches >= 10, "language growth/channel deep-dive must include targeted Exa searches");
expect(brief.languageGrowthChannelDeepDive?.resultRows >= 80, "language growth/channel deep-dive must retain raw Exa result coverage");
expect(brief.languageGrowthChannelDeepDive?.rows?.every((item) => item.name && item.evidenceStrength && item.channelTags?.length && item.nextCheck && item.evidence?.length > 0), "language growth/channel deep-dive rows must include product, strength, channel tags, next check, and evidence");
expect(brief.irlCoverageAudit?.totalUnique >= 14, "IRL coverage audit must combine IRL matrix, funding/news, and monitor signals");
expect(brief.irlCoverageAudit?.coreCount >= 5, "IRL coverage audit must include core offline-human products");
expect(brief.irlCoverageAudit?.monitorCount >= 2, "IRL coverage audit must include monitor-linked signals");
expect(brief.irlCoverageAudit?.rows?.some((item) => item.name === "Breeze"), "IRL coverage audit must include Breeze");
expect(brief.irlCoverageAudit?.rows?.some((item) => item.name === "WeRoad"), "IRL coverage audit must include WeRoad");
expect(brief.irlOfflineEvidenceMap?.totalRows === brief.irlCoverageAudit.totalUnique, "IRL offline evidence map must cover every IRL coverage row");
expect(brief.irlOfflineEvidenceMap?.fundingLinkedRows >= 8, "IRL offline evidence map must link funding/news evidence");
expect(brief.irlOfflineEvidenceMap?.monitorLinkedRows >= 2, "IRL offline evidence map must link monitor signals");
expect(brief.irlOfflineEvidenceMap?.rows?.every((item) => item.offlineMode && item.evidenceStrength && item.nextCheck), "IRL offline evidence map rows must include offline mode, evidence strength, and next check");
expect(brief.discoveryScan?.reviewItems?.some((item) => item.name === "Friend"), "discovery review must classify Friend");
expect(brief.discoveryScan?.reviewItems?.some((item) => /dating|matchmaking/i.test(`${item.name} ${item.lane}`)), "discovery review must classify AI dating/matchmaking candidates");
expect(brief.discoveryScan?.reviewItems?.some((item) => /Posh/.test(item.name)), "discovery review must classify IRL long-tail candidates");
expect(brief.discoveryScan?.supplementalFundingNews?.length >= 6, "discovery scan must include supplemental funding/news events");
expect(brief.discoveryScan?.supplementalFundingNews?.some((item) => item.name === "Friend"), "supplemental funding/news must include Friend");
expect(brief.discoveryScan?.supplementalFundingNews?.some((item) => item.name === "Oasiz"), "supplemental funding/news must include Oasiz");
expect(brief.discoveryScan?.supplementalFundingNews?.some((item) => /dating|Bumble|Tinder|Breeze/i.test(`${item.name} ${item.lane}`)), "supplemental funding/news must include AI dating candidate");
expect(brief.fundingSummary?.dateWindowAudit?.exactWindowStart === "2024-06-02", "funding date-window audit must retain exact near-two-year start date");
expect(brief.fundingSummary?.dateWindowAudit?.exactWindowEnd === "2026-06-02", "funding date-window audit must retain exact near-two-year end date");
expect(brief.fundingSummary?.dateWindowAudit?.outOfWindowTotal === 0, "funding date-window audit must report zero out-of-window rows");
expect(brief.discoveryScan?.fundingCandidateRows >= 20, "discovery scan must retain funding/news blind-spot candidate rows");
expect(
  brief.discoveryScan?.fundingCandidatePendingRows > 0 ||
    brief.discoveryScan?.fundingCandidateReview?.some((item) => ["已并入市场判断", "低可信市场口径留档"].includes(item.handlingStatus)),
  "funding/news blind-spot candidates must keep unresolved rows or explicit resolved market-routing rows for review",
);
expect(brief.discoveryScan?.fundingCandidateReview?.every((item) => item.scanId && item.candidateName && item.amountMention && item.handlingStatus && item.nextAction && item.url), "funding/news candidate rows must include scan, candidate, amount signal, handling status, next action, and URL");
expect(brief.candidatePromotionQueue?.totalRows + brief.candidatePromotionQueue?.integratedMarketRows >= brief.discoveryScan.fundingCandidatePendingRows + brief.languageCoverageAudit.watchlistCount, "candidate promotion queue must account for funding pending rows, integrated market rows, and language watchlist rows");
expect(brief.candidatePromotionQueue?.fundingRows + brief.candidatePromotionQueue?.integratedMarketRows === brief.discoveryScan.fundingCandidatePendingRows, "candidate promotion queue funding count plus integrated market count must match pending funding candidates");
expect(brief.candidatePromotionQueue?.languageRows === brief.languageCoverageAudit.watchlistCount, "candidate promotion queue language count must match language watchlist");
expect(brief.candidatePromotionQueue?.rows?.every((item) => item.type && item.name && item.priority && item.promotionDecision && item.nextAction && item.missingEvidence?.length && item.evidence?.length), "candidate promotion queue rows must include type, name, priority, decision, next action, missing evidence, and evidence");
expect(brief.candidateReview?.promoted?.length >= 3, "candidate review must list promoted candidates");
expect(brief.candidateReview?.deferred?.length >= 3, "candidate review must list deferred candidates");
expect(brief.candidateReview?.monitorPolicy?.length >= 3, "candidate review must document monitor upgrade policy");
expect(brief.candidateReview?.latestAlertReview?.length >= monitor.alertItems.length, "candidate review must classify latest monitor alerts");
expect(brief.candidateReview?.latestAlertReviewGeneratedAt === monitor.generatedAt, "latest alert review timestamp must match current monitor run");
expect(
  (brief.candidateReview?.latestAlertReview ?? []).every((item) => item.decision !== "待复核" && !/自动补齐的新提醒记录/.test(item.reason ?? "")),
  "latest alert review must not retain unresolved auto-filled pending items",
);
expect(!latestAlertReviewCsv.includes("\"待复核\""), "latest alert review CSV must not retain pending decisions");
expect(!latestAlertReviewCsv.includes("自动补齐的新提醒记录"), "latest alert review CSV must not retain auto-filled pending reasons");
expect(brief.candidateReview?.recentSignalReview?.length === monitor.recentItems.length, "candidate review must classify every recent monitor signal");
expect(brief.candidateReview?.recentSignalReviewGeneratedAt === monitor.generatedAt, "recent signal review timestamp must match current monitor run");
expect(brief.candidateReview?.recentSignalReview?.every((item) => item.lane && item.upgradePath && item.action), "every recent monitor signal must include lane routing and upgrade path");
expect(
  (brief.candidateReview?.recentSignalReview ?? []).every((item) => item.decision !== "待复核"),
  "monitor recent review must not retain unresolved pending items after refresh-derived classification",
);
expect(!monitorRecentReviewCsv.includes("\"待复核\""), "monitor recent review CSV must not retain pending decisions");
expect(brief.candidateReview?.monitorLaneRouting?.length >= 3, "monitor lane routing must group recent signals into objective lanes");
expect(brief.candidateReview?.monitorLaneRouting?.some((item) => item.lane === "线下真人社交"), "monitor lane routing must include IRL/offline social lane");
expect(brief.candidateReview?.alertClosure?.status === "closed", "candidate review alert closure status must be closed");
expect(brief.candidateReview?.alertClosure?.latestAlertPendingRows === 0, "candidate review alert closure must report zero latest alert pending rows");
expect(brief.candidateReview?.alertClosure?.recentSignalPendingRows === 0, "candidate review alert closure must report zero recent signal pending rows");
expect(brief.peopleSignals?.length >= 5, "brief must include people category signals");
expect(brief.financialSignals?.length >= 7, "brief must include financial report / market signals");
expect(
  brief.companyBackgroundReview?.rows?.length ===
    brief.peopleSignals.length + brief.financialSignals.length + (brief.companyBackgroundDeepDive?.linkedProducts?.length ?? 0),
  "company background review must combine people, company, and financial signals",
);
expect(brief.companyBackgroundReview?.linkedSignals >= 5, "company background review must link several signals to curated products");
expect(brief.companyBackgroundDeepDive?.searches >= 10, "company background deep-dive must include targeted Exa searches");
expect(brief.companyBackgroundCoverageAudit?.rows?.filter((item) => item.directCompanySignals > 0).length >= 8, "company background coverage audit must include product-level company signals");
expect(brief.companyBackgroundCoverageAudit?.totalProducts === brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0), "company background coverage audit must cover every product");
expect(brief.companyBackgroundCoverageAudit?.rows?.every((item) => item.status && item.nextCheck && item.capabilityTier !== undefined), "company background coverage rows must include status, next check, and capability tier");
expect(
  brief.companyBackgroundCoverageAudit?.rows?.every(
    (item) =>
      Array.isArray(item.directDimensions) &&
      Array.isArray(item.missingDirectDimensions) &&
      Number.isFinite(item.productLevelSignalCount),
  ),
  "company background coverage rows must include direct and missing dimension fields",
);
expect(brief.companyBackgroundCoverageAudit?.summary?.length >= 1, "company background coverage audit must summarize coverage status");
expect(
  brief.companyBackgroundCoverageAudit?.summary?.some((item) =>
    ["产品级公司已覆盖", "产品级背景较强", "产品级背景强", "产品级财务/规模覆盖", "产品级团队覆盖", "产品级部分覆盖"].includes(
      item.status,
    ),
  ),
  "company background coverage audit must include product-level background coverage",
);
expect(brief.marketDecisionEvidenceMap?.totalRows === brief.researchSignals.length + brief.financialSignals.length, "market decision evidence map must cover every research and financial signal");
expect(brief.marketDecisionEvidenceMap?.researchRows === brief.researchSignals.length, "market decision evidence map must count research paper rows");
expect(brief.marketDecisionEvidenceMap?.financialRows === brief.financialSignals.length, "market decision evidence map must count financial report rows");
expect(brief.marketDecisionEvidenceMap?.byDecisionArea?.length >= 3, "market decision evidence map must group judgment areas");
expect(brief.marketDecisionEvidenceMap?.rows?.every((item) => item.sourceCategory && item.signalName && item.decisionArea && item.judgment && item.businessImpact && item.evidenceStrength && item.nextAction && item.evidence?.length > 0), "market decision evidence rows must include judgment, impact, strength, action, and evidence");
expect(brief.officialSocialEvidence?.requestIds?.length >= 4, "official/social evidence must include Exa requestIds");
expect(brief.officialSocialEvidence?.groups?.length >= 3, "official/social evidence must include evidence groups");
expect(brief.officialSocialEvidence?.summary?.officialOrStoreLinks >= 15, "official/social evidence must include official or app-store links");
expect(brief.officialSocialEvidence?.summary?.socialOrCommunityLinks >= 3, "official/social evidence must include social/community links");
expect(brief.exaQueryMatrix?.totalSearches >= 28, "Exa query matrix must include main and official/social searches");
expect(brief.exaQueryMatrix?.rows?.length === brief.exaQueryMatrix?.totalSearches, "Exa query matrix rows must match totalSearches");
expect(brief.exaQueryMatrix?.totalResults >= brief.coverage.results, "Exa query matrix must include at least main research results");
expect(brief.sourceLinkageAudit?.totalResults >= brief.exaQueryMatrix.totalResults, "source linkage audit must cover at least Exa query matrix results");
expect(brief.sourceLinkageAudit?.rows?.length === brief.sourceLinkageAudit?.totalResults, "source linkage audit rows must match total result count");
expect(brief.sourceLinkageAudit?.linkedResults > 0, "source linkage audit must identify linked raw results");
expect(brief.sourceLinkageAudit?.unlinkedResults > 0, "source linkage audit must retain unmatched results for review");
expect(brief.sourceLinkageAudit?.reviewBuckets?.length >= 4, "source linkage audit must classify raw results into review buckets");
expect(brief.sourceLinkageAudit?.reviewBuckets?.some((item) => item.tier === "product-candidate"), "source linkage audit must identify product candidates in unmatched results");
expect(brief.sourceLinkageAudit?.reviewBuckets?.some((item) => item.tier === "background-source"), "source linkage audit must separate background sources");
expect(brief.sourceLinkageAudit?.rows?.every((item) => item.reviewTier && item.reviewDecision && item.reviewReason), "every source linkage row must include review tier, decision, and reason");
expect(brief.sourceLinkageAudit?.byLayer?.some((item) => item.sourceLayer === "main research"), "source linkage audit must include main research results");
expect(brief.sourceLinkageAudit?.byLayer?.some((item) => item.sourceLayer === "official/social pass"), "source linkage audit must include official/social pass results");
expect(brief.sourceLinkageAudit?.byLayer?.some((item) => item.sourceLayer === "discovery scan"), "source linkage audit must include discovery scan results");
expect(brief.coverageGapRegister?.totalGaps === brief.sourceLinkageAudit.unlinkedResults, "coverage gap register must account for every unlinked source result");
expect(brief.coverageGapRegister?.groups?.length >= 4, "coverage gap register must group unlinked results by review lane");
expect(brief.coverageGapRegister?.highPriorityGaps > 0, "coverage gap register must preserve high-priority product candidates");
expect(brief.coverageGapRegister?.groups?.every((item) => item.reviewTier && item.priority && item.nextAction && item.examples?.length > 0), "coverage gap groups must include priority, next action, and examples");
expect(brief.candidateDeepDive?.candidates === currentProductCandidateNames.size, "candidate deep dive must review the current source-linkage product candidate set");
expect(brief.coverageGapRegister?.deepDiveReviewedGaps >= brief.candidateDeepDive.candidates, "coverage gap register must reflect candidate deep-dive coverage");
expect(brief.coverageGapRegister?.groups?.filter((item) => item.priority === "high").every((item) => item.deepDiveReviewed > 0 && item.handlingStatus !== "queued"), "high-priority coverage gaps must include deep-dive handling status");
expect(brief.candidateDeepDive?.searches === candidateDeepDive.searches.length, "candidate deep dive search count must match raw artifact");
expect(brief.candidateDeepDive?.totalResults >= brief.candidateDeepDive.candidates * 8, "candidate deep dive must collect meaningful Exa evidence");
expect(brief.candidateDeepDive?.rows?.every((item) => item.decision && item.reason && item.evidence?.length > 0), "candidate deep dive rows must include decision, reason, and evidence");
expect(brief.residualSignalReview?.totalRows >= 8, "residual signal review must classify remaining signal-candidate gaps");
expect(brief.residualSignalReview?.monitorWatchlistRows >= 2, "residual signal review must retain monitor watchlist items");
expect(brief.residualSignalReview?.rows?.every((item) => item.name && item.decision && item.reason && item.url), "residual signal review rows must include name, decision, reason, and URL");
expect(brief.candidateDeepDive?.byDecision?.some((item) => ["候选补证", "继续观察", "信号复核", "边界参照"].includes(item.decision)), "candidate deep dive must retain non-excluded candidates for future review");
expect(brief.candidateDeepDive?.byDecision?.some((item) => item.decision === "排除主表"), "candidate deep dive must explicitly exclude weak candidates");
for (const category of ["company", "news", "research paper", "financial report", "people", "official/social profile"]) {
  expect(brief.exaQueryMatrix?.byCategory?.some((item) => item.category === category), `Exa query matrix must include category: ${category}`);
}
expect(brief.exaCategoryEvidenceAudit?.rows?.length === brief.exaQueryMatrix.byCategory.length, "Exa category evidence audit must cover every category");
expect(brief.exaCategoryEvidenceAudit?.rows?.every((item) => item.category && item.searches > 0 && item.results > 0 && item.useCase && item.outputViews?.length && item.exportFiles?.length && item.nextCheck), "Exa category evidence rows must include use case, views, exports, and next check");
expect(brief.exaCategoryEvidenceAudit?.rows?.some((item) => item.category === "financial report" && item.evidenceObject.includes("financialSignals")), "Exa category evidence audit must map financial report to financial signals");
expect(brief.exaCategoryEvidenceAudit?.rows?.some((item) => item.category === "people" && item.evidenceObject.includes("peopleSignals")), "Exa category evidence audit must map people to people signals");
expect(brief.priorityShortlist?.length >= 4, "priority shortlist must include at least four lanes");
expect(brief.priorityShortlist?.every((group) => group.picks?.length >= 3), "each priority shortlist lane must include at least three picks");
expect(brief.channelSummary?.totalProducts === brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0), "channel summary totalProducts must match product count");
expect(brief.channelSummary?.groups?.length >= 6, "channel summary must include at least six channel groups");
expect(brief.channelSummary?.groups?.every((group) => group.count > 0 && group.examples?.length > 0), "every channel summary group must include examples");
expect(brief.growthChannelAudit?.totalProducts === brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0), "growth/channel audit must cover every product");
expect(brief.growthChannelAudit?.rows?.every((item) => item.growthLevel && item.channelTags && item.nextCheck), "growth/channel audit rows must include growth level, channel tags, and next check");
expect(brief.growthChannelAudit?.byGrowthLevel?.some((item) => item.level === "强" && item.count > 0), "growth/channel audit must identify strong growth signals");
expect(brief.growthChannelAudit?.byChannelTag?.length >= 6, "growth/channel audit must preserve channel tag distribution");
expect(brief.acquisitionChannelMap?.totalProducts === brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0), "acquisition channel map must cover every product");
expect(brief.acquisitionChannelMap?.rows?.every((item) => item.primaryChannel && item.acquisitionMode && item.paidOrOrganic && item.confidence && item.nextCheck && item.channelTags?.length > 0), "acquisition channel rows must include primary channel, mode, confidence, tags, and next check");
expect(brief.acquisitionChannelMap?.byPrimaryChannel?.length >= 4, "acquisition channel map must include several primary channel groups");
expect(brief.acquisitionChannelMap?.byPaidOrOrganic?.length >= 3, "acquisition channel map must classify paid/organic modes");
expect(brief.acquisitionChannelMap?.cityOpsRows >= 5, "acquisition channel map must identify city/IRL operations rows");
expect(brief.paidAcquisitionEvidenceAudit?.totalProducts === brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0), "paid acquisition evidence audit must cover every product");
expect(
  brief.paidAcquisitionEvidenceAudit?.rows?.every(
    (item) => item.evidenceClass && item.paidSignalType && item.confidence && item.claimLevel && item.safeClaim && item.nextCheck,
  ),
  "paid acquisition evidence rows must include evidence class, signal type, confidence, safe external claim fields, and next check",
);
expect(brief.paidAcquisitionEvidenceAudit?.byEvidenceClass?.length >= 2, "paid acquisition evidence audit must classify paid evidence strength");
expect(brief.paidAcquisitionEvidenceAudit?.noPaidEvidenceRows > 0, "paid acquisition evidence audit must keep no-paid-evidence rows visible");
expect(
  brief.paidAcquisitionEvidenceAudit?.explicitPaidRows + brief.paidAcquisitionEvidenceAudit?.directionalRows + brief.paidAcquisitionEvidenceAudit?.noPaidEvidenceRows === brief.paidAcquisitionEvidenceAudit?.totalProducts,
  "paid acquisition evidence audit class counts must partition all products",
);
expect(brief.opportunityRanking?.groups?.length >= 4, "opportunity ranking must include decision groups");
expect(brief.opportunityRanking?.groups?.every((group) => group.items?.length >= 5), "each opportunity ranking group must include at least five products");
expect(brief.opportunityRanking?.groups?.some((group) => group.id === "irl-first" && group.items.some((item) => /最高|高/.test(item.irl))), "opportunity ranking must include IRL-first products");
expect(brief.opportunityRanking?.groups?.some((group) => group.id === "language-adjacent" && group.items.filter((item) => item.clusterId === "language").length >= 5), "opportunity ranking must include at least five language-adjacent products");
expect(brief.productCapability?.rows?.length === brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0), "product capability rows must match product count");
expect(brief.productCapability?.tiers?.reduce((sum, item) => sum + item.count, 0) === brief.productCapability?.rows?.length, "product capability tier counts must match rows");
expect(brief.productCapability?.rows?.some((item) => item.tier === "优先展示"), "product capability must identify priority display products");
expect(brief.functionalDifferenceAudit?.totalProducts === brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0), "functional difference audit must cover every product");
expect(brief.functionalDifferenceAudit?.rows?.every((item) => item.mechanismTags && item.aiRole && item.humanMode && item.nextCheck), "functional difference audit rows must include mechanism tags, AI role, human mode, and next check");
expect(brief.functionalDifferenceAudit?.byMechanism?.length >= 8, "functional difference audit must preserve mechanism distribution");
expect(brief.functionalDifferenceAudit?.byHumanMode?.some((item) => item.mode === "线下兑现" && item.count > 0), "functional difference audit must identify offline-real-world products");
expect(brief.officialSocialCoverageAudit?.totalProducts === brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0), "official/social coverage audit must cover every product");
expect(brief.officialSocialCoverageAudit?.rows?.every((item) => item.status && item.gaps && item.nextCheck && item.evidence?.length > 0), "official/social coverage rows must include status, gaps, next check, and evidence");
expect(brief.officialSocialCoverageAudit?.summary?.withOfficialWeb >= 20, "official/social coverage audit must identify official web coverage");
expect(brief.officialGapDeepDive?.searches >= 15, "official gap deep-dive must include targeted official/social searches");
expect(brief.officialSocialEvidence?.summary?.targetedGapSearches >= 15, "official/social evidence summary must count targeted gap searches");
expect(brief.languageOfficialSocialDeepDive?.searches >= 10, "language official/social deep-dive must include targeted searches");
expect(brief.languageOfficialSocialDeepDive?.resultRows >= 80, "language official/social deep-dive must retain raw Exa result coverage");
expect(brief.officialSocialCoverageAudit?.summary?.withStore >= 25, "official/social coverage audit must preserve app-store coverage after targeted gap pass");
expect(brief.officialSocialCoverageAudit?.summary?.needsOfficial === 0, "official/social coverage audit must have no products missing both official and store evidence after targeted gap pass");
expect(brief.officialSocialCoverageAudit?.gapRows?.length > 0, "official/social coverage audit must retain evidence gap rows");
expect(Boolean(brief.evidenceScoring?.method?.length), "evidence scoring method must be documented");
expect(Object.values(brief.evidenceScoring?.counts ?? {}).reduce((sum, count) => sum + count, 0) === brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0), "evidence scoring counts must match product count");
expect(brief.completionAudit?.length >= 7, "completion audit must cover objective requirements");
expect(brief.completionAudit?.some((item) => item.status === "保守说明"), "completion audit must include conservative note for exhaustive coverage");
expect(brief.goalReadiness?.status === "ready-with-monitoring-boundary", "goal readiness must be ready under monitoring boundary");
expect(brief.goalReadiness?.blockingGaps?.rows === 0, "goal readiness must report zero blocking product-candidate gap rows");
expect(brief.goalReadiness?.hardGates?.every((gate) => gate.pass), "goal readiness hard gates must all pass");
expect(brief.goalReadiness?.monitoredGaps?.rows >= 1, "goal readiness must preserve monitored signal gaps instead of hiding them");
expect(brief.objectiveEvidenceMap?.length >= 7, "objective evidence map must persist target-to-artifact evidence rows");
expect(brief.objectiveEvidenceMap?.some((item) => item.id === "all-boundary" && item.status.includes("保守")), "objective evidence map must preserve conservative boundary row");
expect(brief.objectiveEvidenceMap?.every((item) => item.id && item.requirement && item.status && item.evidence && item.boundary), "objective evidence map rows must include core narrative fields");
expect(brief.objectiveEvidenceMap?.every((item) => item.views?.length && item.dataFiles?.length && item.exportFiles?.length && item.validators?.length), "objective evidence map rows must include views, data files, export files, and validators");
expect(await fileExists("./run-all.mjs"), "run-all workflow script must exist");
expect(runAllScript.indexOf("Refresh derived display fields") < runAllScript.indexOf("Export CSV attachments"), "monitor workflow must refresh derived fields before exporting CSV attachments");
expect(runAllScript.indexOf("Export CSV attachments") < runAllScript.indexOf("Validate page data"), "monitor workflow must export CSV attachments before validation");
expect(runAllScript.indexOf("Export CSV attachments") < runAllScript.indexOf("Export SQLite database"), "monitor workflow must export CSV attachments before SQLite database");
expect(runAllScript.indexOf("Export SQLite database") < runAllScript.indexOf("Export completion audit"), "monitor workflow must export SQLite database before completion audit");
expect(runAllScript.indexOf("Export completion audit") < runAllScript.indexOf("Validate page data"), "monitor workflow must export completion audit before validation");
expect(runAllScript.indexOf("Export completion audit") < runAllScript.indexOf("Export original objective audit"), "monitor workflow must build completion manifest before original objective audit");
expect(runAllScript.indexOf("Export completion audit") < runAllScript.indexOf("Export current state lock"), "monitor workflow must build completion manifest before current-state handoff");
expect(runAllScript.indexOf("Export original objective audit") < runAllScript.indexOf("Export standalone HTML report"), "monitor workflow must export original objective audit before standalone HTML");
expect(runAllScript.indexOf("Export original objective audit") < runAllScript.indexOf("Export current state lock"), "monitor workflow must build original objective audit before current state lock");
expect(runAllScript.indexOf("Export current state lock") < runAllScript.indexOf("Export standalone HTML report"), "monitor workflow must export current state lock before standalone HTML");
expect(runAllScript.indexOf("Export current state lock") < runAllScript.indexOf("Export latest monitor run receipt"), "monitor workflow must export current state lock before latest monitor receipt");
expect(runAllScript.indexOf("Export latest monitor run receipt") < runAllScript.indexOf("Export standalone HTML report"), "monitor workflow must export latest monitor receipt before standalone HTML");
expect(runAllScript.indexOf("Export standalone HTML report") < runAllScript.indexOf("Validate standalone deliverable"), "monitor workflow must export standalone HTML before deliverable validation");
expect(runAllScript.indexOf("Export latest monitor run receipt") < runAllScript.indexOf("Save timestamped snapshot"), "monitor workflow must export latest monitor receipt before snapshot");
expect(runAllScript.indexOf("Validate standalone deliverable") < runAllScript.indexOf("Save timestamped snapshot"), "monitor workflow must validate deliverable before saving snapshot");
expect(runAllScript.indexOf("Save timestamped snapshot") < runAllScript.indexOf("Validate latest snapshot"), "monitor workflow must validate latest snapshot after saving snapshot");
expect(snapshotScript.includes('"automation-audit.md"'), "snapshot workflow must copy automation audit");
expect(snapshotScript.includes('"demo-checklist.md"'), "snapshot workflow must copy demo checklist");
expect(snapshotScript.includes('"exa-category-coverage-guide.md"'), "snapshot workflow must copy Exa category coverage guide");
expect(snapshotScript.includes("latest-snapshot.json"), "snapshot workflow must write latest snapshot JSON pointer");
expect(snapshotScript.includes("latest-snapshot.md"), "snapshot workflow must write latest snapshot Markdown pointer");
expect(snapshotScript.includes('automationAudit: "exports/automation-audit.md"'), "snapshot manifest must expose automation audit entrypoint");
expect(snapshotScript.includes('demoChecklist: "exports/demo-checklist.md"'), "snapshot manifest must expose demo checklist entrypoint");
expect(runAllScript.indexOf("Build source-linkage candidate pool") < runAllScript.indexOf("Run candidate deep-dive补证"), "full rebuild must build the source-linkage candidate pool before candidate deep-dive");
expect(runAllScript.indexOf("Run candidate deep-dive补证") < runAllScript.indexOf("Refresh final derived display fields"), "full rebuild must refresh final derived fields after candidate deep-dive");
expect(await fileExists("./export-csv.mjs"), "CSV export script must exist");
expect(await fileExists("./export-sqlite.mjs"), "SQLite export script must exist");
expect(await fileExists("./export-completion-audit.mjs"), "completion audit export script must exist");
expect(await fileExists("./export-standalone-html.mjs"), "standalone HTML export script must exist");
expect(await fileExists("./exa-websets-monitor.mjs"), "Exa Websets monitor probe script must exist");
expect(await fileExists("./exa-discovery-scan.mjs"), "Exa discovery scan script must exist");
expect(await fileExists("./validate-deliverable.mjs"), "standalone deliverable validator script must exist");
expect(await fileExists("../功能与版本记录.md"), "feature/version Markdown log must exist");
expect(readme.includes("交付说明.md"), "README must list the delivery note as a handoff artifact");
expect(readme.includes("For the complete handoff/export set, use the daily workflow"), "README must direct complete handoff refresh through run-all");
expect(readme.includes("The current handoff pack includes"), "README export section must describe the current handoff pack, not only partial export commands");
expect(readme.includes("exports/current-state.md"), "README must list current-state Markdown handoff artifact");
expect(readme.includes("exports/latest-monitor-run.md"), "README must list latest monitor run receipt artifact");
expect(readme.includes("exports/exa-category-coverage-guide.md"), "README must list Exa category coverage guide artifact");
expect(readme.includes("exports/automation-audit.md"), "README must list automation audit artifact");
expect(readme.includes("exports/demo-checklist.md"), "README must list demo checklist artifact");
expect(readme.includes("exports/latest-snapshot.md"), "README must list latest snapshot Markdown pointer");
expect(readme.includes("exports/latest-snapshot.json"), "README must list latest snapshot JSON pointer");
expect(readme.includes("exports/original-objective-audit.md"), "README must list original objective audit artifact");
expect(featureVersionLog.includes("## 功能清单"), "feature/version Markdown log must include feature checklist");
expect(featureVersionLog.includes("## 版本记录"), "feature/version Markdown log must include version history");
expect(featureVersionLog.includes("v0.9"), "feature/version Markdown log must include latest version entry");
expect(await fileExists("../exports/executive-brief.md"), "executive brief Markdown export must exist");
expect(await fileExists("../exports/objective-evidence-map.csv"), "objective evidence map CSV export must exist");
expect(await fileExists("../exports/goal-readiness.csv"), "goal readiness CSV export must exist");
expect(await fileExists("../exports/competitive-matrix.csv"), "competitive matrix CSV export must exist");
expect(await fileExists("../exports/source-coverage.csv"), "source coverage CSV export must exist");
expect(await fileExists("../exports/exa-category-evidence-audit.csv"), "Exa category evidence audit CSV export must exist");
expect(await fileExists("../exports/source-linkage-audit.csv"), "source linkage audit CSV export must exist");
expect(await fileExists("../exports/coverage-gap-register.csv"), "coverage gap register CSV export must exist");
expect(await fileExists("../exports/candidate-deep-dive.csv"), "candidate deep-dive CSV export must exist");
expect(await fileExists("../exports/residual-signal-review.csv"), "residual signal review CSV export must exist");
expect(await fileExists("../exports/product-capability-score.csv"), "product capability score CSV export must exist");
expect(await fileExists("../exports/growth-channel-audit.csv"), "growth/channel audit CSV export must exist");
expect(await fileExists("../exports/acquisition-channel-map.csv"), "acquisition channel map CSV export must exist");
expect(await fileExists("../exports/paid-acquisition-evidence-audit.csv"), "paid acquisition evidence audit CSV export must exist");
expect(await fileExists("../exports/functional-difference-audit.csv"), "functional difference audit CSV export must exist");
expect(await fileExists("../exports/official-social-coverage-audit.csv"), "official/social coverage audit CSV export must exist");
expect(await fileExists("../exports/official-gap-deep-dive.csv"), "official/social gap deep-dive CSV export must exist");
expect(await fileExists("../exports/language-official-social-deep-dive.csv"), "language official/social deep-dive CSV export must exist");
expect(await fileExists("../exports/company-background-review.csv"), "company background review CSV export must exist");
expect(await fileExists("../exports/company-background-deep-dive.csv"), "company background deep-dive CSV export must exist");
expect(await fileExists("../exports/company-background-coverage-audit.csv"), "company background coverage audit CSV export must exist");
expect(await fileExists("../exports/market-decision-evidence-map.csv"), "market decision evidence map CSV export must exist");
expect(await fileExists("../exports/funding-timeline.csv"), "funding timeline CSV export must exist");
expect(await fileExists("../exports/funding-news-review.csv"), "funding/news review CSV export must exist");
expect(await fileExists("../exports/funding-news-dedup-audit.csv"), "funding/news dedupe audit CSV export must exist");
expect(await fileExists("../exports/funding-event-audit.csv"), "funding event audit CSV export must exist");
expect(await fileExists("../exports/funding-product-rollup.csv"), "funding product rollup CSV export must exist");
expect(await fileExists("../exports/funding-discovery-candidates.csv"), "funding discovery candidates CSV export must exist");
expect(await fileExists("../exports/candidate-promotion-queue.csv"), "candidate promotion queue CSV export must exist");
expect(await fileExists("../exports/latest-alert-review.csv"), "latest alert review CSV export must exist");
expect(await fileExists("../exports/monitor-recent-review.csv"), "monitor recent review CSV export must exist");
expect(await fileExists("../exports/monitor-lane-routing.csv"), "monitor lane routing CSV export must exist");
expect(await fileExists("../exports/monitor-recent-signals.csv"), "monitor recent signals CSV export must exist");
expect(await fileExists("../exports/discovery-candidates.csv"), "discovery candidates CSV export must exist");
expect(await fileExists("../exports/language-long-tail-review.csv"), "language long-tail review CSV export must exist");
expect(await fileExists("../exports/language-coverage-audit.csv"), "language coverage audit CSV export must exist");
expect(await fileExists("../exports/language-similarity-audit.csv"), "language similarity audit CSV export must exist");
expect(await fileExists("../exports/language-growth-channel-deep-dive.csv"), "language growth/channel deep-dive CSV export must exist");
expect(await fileExists("../exports/irl-coverage-audit.csv"), "IRL coverage audit CSV export must exist");
expect(await fileExists("../exports/supplemental-funding-news.csv"), "supplemental funding/news CSV export must exist");
expect(await fileExists("../exports/completion-audit.md"), "completion audit Markdown export must exist");
expect(await fileExists("../exports/completion-manifest.json"), "completion manifest JSON export must exist");
expect(await fileExists("../exports/exa-social-research.sqlite"), "SQLite database export must exist");
expect(await fileExists("../exports/sqlite-database-guide.md"), "SQLite database guide export must exist");
expect(await fileExists("../exports/current-state.md"), "current-state Markdown export must exist");
expect(await fileExists("../exports/current-state.json"), "current-state JSON export must exist");
expect(await fileExists("../exports/latest-monitor-run.md"), "latest monitor run Markdown receipt must exist");
expect(await fileExists("../exports/latest-monitor-run.json"), "latest monitor run JSON receipt must exist");
expect(await fileExists("../exports/exa-category-coverage-guide.md"), "Exa category coverage guide Markdown must exist");
expect(await fileExists("../exports/automation-audit.md"), "automation audit Markdown must exist");
expect(exaCategoryCoverageGuide.includes("Exa Category Coverage Guide"), "Exa category coverage guide must include title");
expect(exaCategoryCoverageGuide.includes("company") && exaCategoryCoverageGuide.includes("people") && exaCategoryCoverageGuide.includes("research paper") && exaCategoryCoverageGuide.includes("news") && exaCategoryCoverageGuide.includes("financial report"), "Exa category coverage guide must cover requested Exa categories");
expect(exaCategoryCoverageGuide.includes("presentation-ready-with-monitoring-boundary"), "Exa category coverage guide must preserve monitored boundary");
expect(await fileExists("../exports/original-objective-audit.md"), "original objective audit Markdown export must exist");
expect(await fileExists("../exports/original-objective-audit.csv"), "original objective audit CSV export must exist");
expect(await fileExists("../exports/original-objective-audit.json"), "original objective audit JSON export must exist");
expect(await fileExists("../exports/exa-ai-social-report.html"), "standalone HTML report export must exist");
expect(await fileExists("../exports/browser-qa-report.md"), "browser QA Markdown report must exist");
expect(await fileExists("../exports/demo-checklist.md"), "demo checklist Markdown must exist");
expect(automationAudit.includes("exa-ai-social-market-monitor"), "automation audit must include daily monitor automation id");
expect(automationAudit.includes("FREQ=DAILY;BYHOUR=9;BYMINUTE=0;BYSECOND=0"), "automation audit must include daily monitor schedule");
expect(automationAudit.includes("exa-ai-social-weekly-full-rebuild"), "automation audit must include weekly full rebuild automation id");
expect(automationAudit.includes("FREQ=WEEKLY;BYDAY=MO;BYHOUR=9;BYMINUTE=30;BYSECOND=0"), "automation audit must include weekly full rebuild schedule");
expect(automationAudit.includes("codex-cron-search-api-fallback"), "automation audit must disclose Search API fallback mode");
expect(demoChecklist.includes("3 分钟打开路径"), "demo checklist must include short live-demo path");
expect(demoChecklist.includes("http://127.0.0.1:8000/#home"), "demo checklist must include local homepage entrypoint");
expect(demoChecklist.includes("exports/exa-social-research.sqlite"), "demo checklist must include SQLite database path");
expect(demoChecklist.includes("CSV 是复核和二次分析附件，不是主要阅读入口"), "demo checklist must state CSV is not the main reading entry");
expect(demoChecklist.includes("presentation-ready / broad monitored coverage"), "demo checklist must preserve presentation-ready monitored boundary");
expect(browserQaReport.includes("SQLite Query Handoff Check"), "browser QA report must include SQLite query handoff verification");
expect(browserQaReport.includes("SQLite guide cards: 5"), "browser QA report must record five SQLite guide cards");
expect(browserQaReport.includes("SQL snippets present on every card: yes"), "browser QA report must record SQL snippet verification");
expect(browserQaReport.includes("view_language_adjacent_products"), "browser QA report must list language adjacent SQLite view");
expect(browserQaReport.includes("view_irl_funding_news"), "browser QA report must list IRL funding/news SQLite view");
expect(browserQaReport.includes("view_latest_monitor_signals"), "browser QA report must list latest monitor SQLite view");
expect(browserQaReport.includes("view_unresolved_coverage_gaps"), "browser QA report must list unresolved coverage gaps SQLite view");
expect(browserQaReport.includes("view_paid_acquisition_claims"), "browser QA report must list paid acquisition claims SQLite view");
expect(browserQaReport.includes("Demo Checklist Live Route Check"), "browser QA report must include demo checklist live route verification");
expect(browserQaReport.includes("Demo checklist export card present: `现场演示清单 MD`"), "browser QA report must record demo checklist card");
expect(browserQaReport.includes("Demo checklist link target: `exports/demo-checklist.md`"), "browser QA report must record demo checklist link target");
expect(browserQaReport.includes("Latest snapshot pointer targets: `exports/latest-snapshot.md`, `exports/latest-snapshot.json`"), "browser QA report must record latest snapshot pointer targets");
expect(browserQaReport.includes("Exa category coverage guide target: `exports/exa-category-coverage-guide.md`"), "browser QA report must record Exa category coverage guide target");
expect(browserQaReport.includes("Export cards visible: 62"), "browser QA report must record updated export card count");
expect(browserQaReport.includes("Browser URL re-checked after asset versioning: `http://127.0.0.1:8000/#playbook`"), "browser QA report must record plain Playbook route re-check after asset versioning");
expect(browserQaReport.includes("Versioned assets loaded: `styles.css?v=20260602-v96`, `app.js?v=20260602-v96`"), "browser QA report must record versioned CSS and JS assets");
expect(browserQaReport.includes("plain route now loads the updated Playbook without requiring a page-level cache-bust parameter"), "browser QA report must record cache-bust-free Playbook route status");
expect(browserQaReport.includes("Monitor Alert Closure Check"), "browser QA report must include monitor alert closure verification");
expect(browserQaReport.includes("Monitor closure card present: yes"), "browser QA report must record monitor closure card presence");
expect(browserQaReport.includes("Closure headline: `新增提醒已闭环`"), "browser QA report must record closed alert headline");
expect(browserQaReport.includes(`Latest alert review: ${brief.candidateReview.alertClosure.latestAlertReviewRows} rows, pending ${brief.candidateReview.alertClosure.latestAlertPendingRows}`), "browser QA report must match latest alert closure counts");
expect(browserQaReport.includes(`Recent signal review: ${brief.candidateReview.alertClosure.recentSignalReviewRows} rows, pending ${brief.candidateReview.alertClosure.recentSignalPendingRows}`), "browser QA report must match recent signal closure counts");
expect(browserQaReport.includes(`Latest handled alert: \`${brief.candidateReview.latestAlertReview[0].name}\``), "browser QA report must record latest handled monitor alert");
expect(browserQaReport.includes(`Latest decision: \`${brief.candidateReview.latestAlertReview[0].decision}\``), "browser QA report must record latest monitor alert decision");
expect(latestMonitorRun.includes("Latest Exa Monitor Run Receipt"), "latest monitor run receipt must include title");
expect(latestMonitorRun.includes(`Monitor generated at: ${monitor.generatedAt}`), "latest monitor run receipt must match monitor generatedAt");
expect(latestMonitorRun.includes(`recent signals: ${monitor.summary.recentResults}`), "latest monitor run receipt must record recent signal count");
expect(latestMonitorRun.includes(`new alerts: ${monitor.summary.newAlerts}`), "latest monitor run receipt must record new alert count");
expect(latestMonitorRun.includes(`Latest alert review: ${brief.candidateReview.alertClosure.latestAlertReviewRows} rows, pending ${brief.candidateReview.alertClosure.latestAlertPendingRows}`), "latest monitor run receipt must record latest alert closure");
expect(latestMonitorRun.includes(`Recent signal review: ${brief.candidateReview.alertClosure.recentSignalReviewRows} rows, pending ${brief.candidateReview.alertClosure.recentSignalPendingRows}`), "latest monitor run receipt must record recent signal closure");
const latestHandledAlertName = brief.candidateReview.latestAlertReview[0].name;
const escapedLatestHandledAlertName = latestHandledAlertName.replace(/\|/g, "\\|");
expect(latestMonitorRun.includes(latestHandledAlertName) || latestMonitorRun.includes(escapedLatestHandledAlertName), "latest monitor run receipt must record latest handled alert");
expect(latestMonitorRun.includes(brief.candidateReview.latestAlertReview[0].decision), "latest monitor run receipt must record latest handled decision");
expect(latestMonitorRunJson.monitorGeneratedAt === monitor.generatedAt, "latest monitor JSON receipt must match monitor generatedAt");
expect(latestMonitorRunJson.summary?.recentResults === monitor.summary.recentResults, "latest monitor JSON receipt must match recent signal count");
expect(latestMonitorRunJson.summary?.newAlerts === monitor.summary.newAlerts, "latest monitor JSON receipt must match new alert count");
expect(latestMonitorRunJson.requestIds?.length === monitor.runs.filter((run) => run.requestId).length, "latest monitor JSON receipt must preserve requestIds");
expect(latestMonitorRunJson.alertClosure?.latestAlertPendingRows === brief.candidateReview.alertClosure.latestAlertPendingRows, "latest monitor JSON receipt must match latest alert pending count");
expect(latestMonitorRunJson.alertClosure?.recentSignalPendingRows === brief.candidateReview.alertClosure.recentSignalPendingRows, "latest monitor JSON receipt must match recent signal pending count");
expect(latestMonitorRunJson.persistence?.monitorHistoryRuns === (monitorHistory.runs?.length ?? 0), "latest monitor JSON receipt must match monitor history runs");
expect(latestMonitorRunJson.persistence?.monitorLedgerItems === (monitorLedger.totalItems ?? monitorLedger.items?.length ?? 0), "latest monitor JSON receipt must match monitor ledger item count");
expect(latestMonitorRunJson.persistence?.sqliteCounts?.monitor_signals === monitor.recentItems.length, "latest monitor JSON receipt SQLite monitor_signals count must match monitor recent items");
expect(browserQaReport.includes("Evidence Data Display Check"), "browser QA report must include Evidence data display verification");
expect(browserQaReport.includes("Data persistence cards present: 5"), "browser QA report must record five Evidence data persistence cards");
expect(browserQaReport.includes("Local data layer statement present: `本地 JSON + SQLite 数据层`"), "browser QA report must record local JSON and SQLite statement");
expect(browserQaReport.includes("Frontend display statement present: `网页内可直接查看`"), "browser QA report must record frontend display statement");
expect(browserQaReport.includes("CSV boundary statement present: `CSV 不是唯一数据源`"), "browser QA report must record CSV boundary statement");
expect(browserQaReport.includes("SQLite artifact visible: `exports/exa-social-research.sqlite`"), "browser QA report must record SQLite artifact visibility");
expect(browserQaReport.includes("In-page detail datasets exposed: 16 tabs"), "browser QA report must record in-page detail dataset tabs");
expect(browserQaReport.includes("In-page detail table rendered: yes"), "browser QA report must record in-page detail table rendering");
expect(browserQaReport.includes("Original objective audit card present: yes"), "browser QA report must record original objective audit card");
expect(browserQaReport.includes("Original objective audit summary: `9 行验收索引`"), "browser QA report must record original objective audit summary");
expect(browserQaReport.includes("exports/original-objective-audit.md"), "browser QA report must link original objective audit Markdown");
expect(browserQaReport.includes("exports/original-objective-audit.csv"), "browser QA report must link original objective audit CSV");
expect(browserQaReport.includes("exports/original-objective-audit.json"), "browser QA report must link original objective audit JSON");
expect(browserQaReport.includes("Strict boundary preserved on the page: `not-mathematically-complete`"), "browser QA report must preserve strict completion boundary");
expect(browserQaReport.includes("Presentation readiness visible on the page: `presentationReady = true`"), "browser QA report must record presentation readiness");
expect(browserQaReport.includes("`#evidence` in standalone HTML across desktop `1440`, tablet `820`, and mobile `390`"), "browser QA report must record standalone Evidence multi-viewport check");
expect(await fileExists("../交付说明.md"), "delivery note Markdown must exist");
expect(deliveryNote.includes("presentation-ready / broad monitored coverage"), "delivery note must state the presentation-ready monitored coverage boundary");
expect(deliveryNote.includes("strictCompletionVerdict.status = not-mathematically-complete"), "delivery note must state the strict non-exhaustive completion verdict");
expect(deliveryNote.includes("建议打开顺序"), "delivery note must include a recommended presentation opening sequence");
expect(deliveryNote.includes("exports/exa-social-research.sqlite") || deliveryNote.includes("SQLite"), "delivery note must mention the SQLite database export");
expect(deliveryNote.includes(`IRL / 线下真人社交：${brief.irlOfflineEvidenceMap.totalRows} 行线下真人证据地图。`), "delivery note must match current IRL offline evidence map count");
expect(
  deliveryNote.includes(
    `Monitor：${monitor.summary.monitors} 条 lane，${monitor.summary.recentResults} 条近窗信号，${monitor.summary.newAlerts} 条新增提醒；latest alert 待复核 ${brief.candidateReview.alertClosure.latestAlertPendingRows}，recent signal 待复核 ${brief.candidateReview.alertClosure.recentSignalPendingRows}。`,
  ),
  "delivery note must match current monitor summary and pending counts",
);
expect(
  deliveryNote.includes(
    `monitor 捕捉到 ${brief.paidAcquisitionEvidenceAudit.monitorPaidSignalRows} 条投放/付费获客候选信号，其中本轮新增 ${brief.paidAcquisitionEvidenceAudit.monitorPaidNewRows} 条`,
  ),
  "delivery note must match current paid-acquisition monitor signal counts",
);
expect(
  featureVersionLog.includes(`IRL / 线下真人社交：${brief.irlCoverageAudit.totalUnique} 个唯一 IRL 条目，${brief.irlOfflineEvidenceMap.totalRows} 行线下真人证据地图。`),
  "feature/version log current status must match IRL coverage and offline evidence counts",
);
expect(
  featureVersionLog.includes(
    `最近一次 ${monitor.summary.recentResults} 条近窗高相关信号，${monitor.summary.newAlerts} 条新增提醒；latest alert review ${brief.candidateReview.alertClosure.latestAlertReviewRows} 条全部已有处理结论，待复核为 0。`,
  ),
  "feature/version log current status must match monitor summary and alert review counts",
);
expect(
  featureVersionLog.includes(
    `monitor 捕捉到 ${brief.paidAcquisitionEvidenceAudit.monitorPaidSignalRows} 条投放/付费获客证据候选信号，其中本轮新增 ${brief.paidAcquisitionEvidenceAudit.monitorPaidNewRows} 条。`,
  ),
  "feature/version log current status must match paid-acquisition monitor signal counts",
);
expect(completionAudit.includes("language-growth-channel-deep-dive.csv"), "completion audit must list language growth/channel deep-dive export");
expect(completionAudit.includes("language-official-social-deep-dive.csv"), "completion audit must list language official/social deep-dive export");
expect(completionManifest.artifacts?.languageGrowthChannelDeepDiveCsv === "exports/language-growth-channel-deep-dive.csv", "completion manifest must list language growth/channel deep-dive CSV artifact");
expect(completionManifest.artifacts?.languageOfficialSocialDeepDiveCsv === "exports/language-official-social-deep-dive.csv", "completion manifest must list language official/social deep-dive CSV artifact");
expect(completionManifest.artifacts?.sqliteDatabase === "exports/exa-social-research.sqlite", "completion manifest must list SQLite database artifact");
expect(completionManifest.artifacts?.sqliteDatabaseGuideMarkdown === "exports/sqlite-database-guide.md", "completion manifest must list SQLite database guide artifact");
expect(completionManifest.artifacts?.deliveryNoteMarkdown === "交付说明.md", "completion manifest must list delivery note Markdown artifact");
expect(completionManifest.artifacts?.browserQaReportMarkdown === "exports/browser-qa-report.md", "completion manifest must list browser QA Markdown artifact");
expect(completionManifest.artifacts?.currentStateMarkdown === "exports/current-state.md", "completion manifest must list current-state Markdown artifact");
expect(completionManifest.artifacts?.currentStateJson === "exports/current-state.json", "completion manifest must list current-state JSON artifact");
expect(completionManifest.artifacts?.latestMonitorRunMarkdown === "exports/latest-monitor-run.md", "completion manifest must list latest monitor run Markdown artifact");
expect(completionManifest.artifacts?.latestMonitorRunJson === "exports/latest-monitor-run.json", "completion manifest must list latest monitor run JSON artifact");
expect(completionManifest.artifacts?.exaCategoryCoverageGuideMarkdown === "exports/exa-category-coverage-guide.md", "completion manifest must list Exa category coverage guide artifact");
expect(completionManifest.artifacts?.automationAuditMarkdown === "exports/automation-audit.md", "completion manifest must list automation audit Markdown artifact");
expect(completionManifest.artifacts?.demoChecklistMarkdown === "exports/demo-checklist.md", "completion manifest must list demo checklist Markdown artifact");
expect(completionManifest.artifacts?.originalObjectiveAuditMarkdown === "exports/original-objective-audit.md", "completion manifest must list original objective audit Markdown artifact");
expect(completionManifest.artifacts?.originalObjectiveAuditCsv === "exports/original-objective-audit.csv", "completion manifest must list original objective audit CSV artifact");
expect(completionManifest.artifacts?.originalObjectiveAuditJson === "exports/original-objective-audit.json", "completion manifest must list original objective audit JSON artifact");
expect(originalObjectiveAudit.includes("原始目标逐条审计"), "original objective audit must include the title");
expect(originalObjectiveAudit.includes("all-scope-boundary"), "original objective audit must preserve the all-scope boundary row");
expect(originalObjectiveAudit.includes("not-mathematically-proved"), "original objective audit must state that all-scope coverage is not mathematically proved");
expect(originalObjectiveAuditJson.rows?.length >= 9, "original objective audit JSON must include requirement rows");
expect(brief.originalObjectiveAuditSummary?.rows === originalObjectiveAuditJson.rows.length, "brief original objective audit summary must match audit JSON row count");
expect(brief.originalObjectiveAuditSummary?.status === originalObjectiveAuditJson.verdict.status, "brief original objective audit summary status must match audit JSON verdict");
expect(brief.originalObjectiveAuditSummary?.presentationReady === originalObjectiveAuditJson.verdict.presentationReady, "brief original objective audit summary presentation readiness must match audit JSON verdict");
expect(brief.originalObjectiveAuditSummary?.counts?.products === originalObjectiveAuditJson.counts.products, "brief original objective audit summary product count must match audit JSON");
expect(brief.originalObjectiveAuditSummary?.counts?.monitorNewAlerts === originalObjectiveAuditJson.counts.monitorNewAlerts, "brief original objective audit summary monitor new-alert count must match audit JSON");
expect(brief.originalObjectiveAuditSummary?.files?.markdown === "exports/original-objective-audit.md", "brief original objective audit summary must link Markdown artifact");
expect(brief.originalObjectiveAuditSummary?.files?.csv === "exports/original-objective-audit.csv", "brief original objective audit summary must link CSV artifact");
expect(brief.originalObjectiveAuditSummary?.files?.json === "exports/original-objective-audit.json", "brief original objective audit summary must link JSON artifact");
expect(originalObjectiveAuditJson.counts?.products === brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0), "original objective audit JSON product count must match brief");
expect(originalObjectiveAuditJson.counts?.languageAdjacentUnique === brief.languageCoverageAudit.totalUnique, "original objective audit JSON language count must match brief");
expect(originalObjectiveAuditJson.counts?.fundingTimelineEvents === brief.fundingSummary.totalEvents, "original objective audit JSON funding count must match brief");
expect(originalObjectiveAuditJson.counts?.irlOfflineEvidenceRows === brief.irlOfflineEvidenceMap.totalRows, "original objective audit JSON IRL count must match brief");
expect(originalObjectiveAuditJson.counts?.monitorNewAlerts === monitor.summary.newAlerts, "original objective audit JSON monitor new-alert count must match monitor");
expect(currentState.includes("当前状态锁定"), "current-state Markdown must include the title");
expect(currentState.includes("presentation-ready-with-monitoring-boundary"), "current-state Markdown must state presentation-ready monitored status");
expect(currentState.includes("exports/exa-social-research.sqlite"), "current-state Markdown must list SQLite database entrypoint");
expect(currentState.includes("exports/sqlite-database-guide.md"), "current-state Markdown must list SQLite database guide entrypoint");
expect(currentState.includes("exports/latest-monitor-run.md"), "current-state Markdown must list latest monitor run receipt entrypoint");
expect(currentState.includes("exports/latest-monitor-run.json"), "current-state Markdown must list latest monitor run JSON receipt entrypoint");
expect(currentState.includes("exports/exa-category-coverage-guide.md"), "current-state Markdown must list Exa category coverage guide entrypoint");
expect(currentState.includes("exports/automation-audit.md"), "current-state Markdown must list automation audit entrypoint");
expect(currentState.includes("http://127.0.0.1:8000/#home"), "current-state Markdown must list the current local web entrypoint");
expect(currentStateJson.entrypoints?.sqliteDatabase === "exports/exa-social-research.sqlite", "current-state JSON must list SQLite database entrypoint");
expect(currentStateJson.entrypoints?.sqliteDatabaseGuide === "exports/sqlite-database-guide.md", "current-state JSON must list SQLite database guide entrypoint");
expect(currentStateJson.entrypoints?.latestMonitorRun === "exports/latest-monitor-run.md", "current-state JSON must list latest monitor run Markdown entrypoint");
expect(currentStateJson.entrypoints?.latestMonitorRunJson === "exports/latest-monitor-run.json", "current-state JSON must list latest monitor run JSON entrypoint");
expect(currentStateJson.entrypoints?.exaCategoryCoverageGuide === "exports/exa-category-coverage-guide.md", "current-state JSON must list Exa category coverage guide entrypoint");
expect(currentStateJson.entrypoints?.automationAudit === "exports/automation-audit.md", "current-state JSON must list automation audit entrypoint");
expect(currentStateJson.entrypoints?.localWeb === "http://127.0.0.1:8000/#home", "current-state JSON must list current local web entrypoint");
expect(currentStateJson.counts?.products === brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0), "current-state product count must match brief");
expect(currentStateJson.counts?.languageAdjacentUnique === brief.languageCoverageAudit.totalUnique, "current-state language count must match brief");
expect(currentStateJson.counts?.fundingTimelineEvents === brief.fundingSummary.totalEvents, "current-state funding count must match brief");
expect(currentStateJson.counts?.fundingIntegrityOutOfWindowRows === brief.fundingIntegritySummary.outOfWindowRows, "current-state funding out-of-window count must match brief");
expect(currentStateJson.counts?.fundingIntegrityDuplicateRows === brief.fundingIntegritySummary.duplicateRows, "current-state funding duplicate count must match brief");
expect(currentStateJson.counts?.fundingIntegrityIrlUniqueRows === brief.fundingIntegritySummary.irlUniqueRows, "current-state funding IRL count must match brief");
expect(currentStateJson.counts?.fundingIntegrityProductRollupRows === brief.fundingIntegritySummary.productRollupRows, "current-state funding product rollup count must match brief");
expect(currentStateJson.counts?.irlOfflineEvidenceRows === brief.irlOfflineEvidenceMap.totalRows, "current-state IRL count must match brief");
expect(currentStateJson.counts?.monitorRecentSignals === monitor.summary.recentResults, "current-state monitor recent count must match monitor");
expect(currentStateJson.counts?.monitorNewAlerts === monitor.summary.newAlerts, "current-state monitor new-alert count must match monitor");
expect(currentStateJson.counts?.monitorHistoryRuns === monitorHistory.runs.length, "current-state monitor history count must match history");
expect(currentStateJson.counts?.monitorLedgerItems === monitorLedger.totalItems, "current-state monitor ledger count must match ledger");
expect(currentStateJson.counts?.monitorZeroNewAlertStreak === zeroNewAlertRunCount, "current-state monitor zero-new-alert streak must match history");
expect(currentStateJson.counts?.paidAcquisitionMonitorSignalRows === brief.paidAcquisitionEvidenceAudit.monitorPaidSignalRows, "current-state paid monitor count must match brief");
expect(currentStateJson.counts?.paidAcquisitionClaimablePaidRows === (paidClaimCounts["可声称付费投放"] ?? 0), "current-state paid claimable count must match brief");
expect(currentStateJson.counts?.paidAcquisitionChannelOnlyClaimRows === (paidClaimCounts["只能声称渠道线索"] ?? 0), "current-state channel-only claim count must match brief");
expect(currentStateJson.counts?.paidAcquisitionNoPaidClaimRows === (paidClaimCounts["不能声称投放"] ?? 0), "current-state no-paid claim count must match brief");
expect(currentStateJson.counts?.originalObjectiveAuditRows === originalObjectiveAuditJson.rows.length, "current-state original objective audit count must match JSON");
expect(completionManifest.counts?.languageGrowthChannelDeepDiveSearches === (brief.languageGrowthChannelDeepDive?.searches ?? 0), "completion manifest must count language growth/channel searches");
expect(completionManifest.counts?.languageOfficialSocialDeepDiveSearches === (brief.languageOfficialSocialDeepDive?.searches ?? 0), "completion manifest must count language official/social searches");
expect(completionManifest.counts?.fundingExactWindowStart === "2024-06-02", "completion manifest must retain exact funding window start");
expect(completionManifest.counts?.fundingExactWindowEnd === "2026-06-02", "completion manifest must retain exact funding window end");
expect(await csvRowCount("../exports/competitive-matrix.csv") === brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0), "competitive matrix CSV row count must match product count");
expect(await csvRowCount("../exports/objective-evidence-map.csv") === brief.objectiveEvidenceMap.length, "objective evidence map CSV row count must match brief objective map");
expect(await csvRowCount("../exports/original-objective-audit.csv") === originalObjectiveAuditJson.rows.length, "original objective audit CSV row count must match JSON rows");
expect(await csvRowCount("../exports/goal-readiness.csv") === (brief.goalReadiness?.hardGates?.length ?? 0) + 3, "goal readiness CSV row count must match hard gates plus gap boundary rows");
expect(await csvRowCount("../exports/source-coverage.csv") === brief.exaQueryMatrix.totalSearches, "source coverage CSV row count must match Exa query matrix searches");
expect(await csvRowCount("../exports/exa-category-evidence-audit.csv") === brief.exaCategoryEvidenceAudit.rows.length, "Exa category evidence audit CSV row count must match category rows");
expect(await csvRowCount("../exports/source-linkage-audit.csv") === brief.sourceLinkageAudit.totalResults, "source linkage audit CSV row count must match raw source audit rows");
expect(await csvRowCount("../exports/coverage-gap-register.csv") === brief.coverageGapRegister.groups.length, "coverage gap register CSV row count must match grouped gaps");
expect(await csvRowCount("../exports/candidate-deep-dive.csv") === brief.candidateDeepDive.rows.length, "candidate deep-dive CSV row count must match review rows");
expect(await csvRowCount("../exports/residual-signal-review.csv") === (brief.residualSignalReview?.rows?.length ?? 0), "residual signal review CSV row count must match review rows");
expect(await csvRowCount("../exports/product-capability-score.csv") === (brief.productCapability?.rows?.length ?? 0), "product capability CSV row count must match capability rows");
expect(await csvRowCount("../exports/growth-channel-audit.csv") === (brief.growthChannelAudit?.rows?.length ?? 0), "growth/channel audit CSV row count must match audit rows");
expect(await csvRowCount("../exports/acquisition-channel-map.csv") === (brief.acquisitionChannelMap?.rows?.length ?? 0), "acquisition channel CSV row count must match map rows");
expect(await csvRowCount("../exports/paid-acquisition-evidence-audit.csv") === (brief.paidAcquisitionEvidenceAudit?.rows?.length ?? 0), "paid acquisition evidence CSV row count must match audit rows");
expect(await csvRowCount("../exports/functional-difference-audit.csv") === (brief.functionalDifferenceAudit?.rows?.length ?? 0), "functional difference audit CSV row count must match audit rows");
expect(await csvRowCount("../exports/official-social-coverage-audit.csv") === (brief.officialSocialCoverageAudit?.rows?.length ?? 0), "official/social coverage audit CSV row count must match audit rows");
expect(await csvRowCount("../exports/official-gap-deep-dive.csv") === (brief.officialSocialEvidence?.groups ?? []).flatMap((group) => group.items).filter((item) => (brief.officialGapDeepDive?.products ?? []).includes(item.name)).length, "official/social gap deep-dive CSV row count must match targeted product rows");
expect(await csvRowCount("../exports/language-official-social-deep-dive.csv") === (brief.languageOfficialSocialDeepDive?.searches ?? 0), "language official/social deep-dive CSV row count must match raw targeted Exa searches");
expect(await csvRowCount("../exports/company-background-review.csv") === (brief.companyBackgroundReview?.rows?.length ?? 0), "company background CSV row count must match background rows");
expect(await csvRowCount("../exports/company-background-deep-dive.csv") === (brief.companyBackgroundReview?.rows ?? []).filter((item) => item.sourceCategory === "company").length, "company background deep-dive CSV row count must match targeted background rows");
expect(await csvRowCount("../exports/company-background-coverage-audit.csv") === (brief.companyBackgroundCoverageAudit?.rows?.length ?? 0), "company background coverage CSV row count must match coverage rows");
expect(await csvRowCount("../exports/market-decision-evidence-map.csv") === (brief.marketDecisionEvidenceMap?.rows?.length ?? 0), "market decision evidence CSV row count must match decision map rows");
expect(await csvRowCount("../exports/funding-timeline.csv") === brief.fundingTimeline.length, "funding timeline CSV row count must match timeline count");
expect(await csvRowCount("../exports/funding-news-review.csv") === brief.fundingSummary.combinedEvents, "funding/news review CSV row count must match combined event count");
expect(await csvRowCount("../exports/funding-news-dedup-audit.csv") === brief.fundingSummary.combinedEvents, "funding/news dedupe audit CSV row count must match combined event count");
expect(await csvRowCount("../exports/funding-event-audit.csv") === (brief.fundingEventAudit?.rows?.length ?? 0), "funding event audit CSV row count must match audit rows");
expect(await csvRowCount("../exports/funding-upgrade-map.csv") === (brief.fundingUpgradeMap?.rows?.length ?? 0), "funding upgrade map CSV row count must match upgrade rows");
expect(await csvRowCount("../exports/funding-product-rollup.csv") === (brief.fundingProductRollup?.rows?.length ?? 0), "funding product rollup CSV row count must match rollup rows");
expect(await csvRowCount("../exports/funding-discovery-candidates.csv") === (brief.discoveryScan?.fundingCandidateReview?.length ?? 0), "funding discovery candidates CSV row count must match candidate review rows");
expect(await csvRowCount("../exports/candidate-promotion-queue.csv") === (brief.candidatePromotionQueue?.rows?.length ?? 0), "candidate promotion queue CSV row count must match queue rows");
expect(await csvRowCount("../exports/latest-alert-review.csv") === (brief.candidateReview?.latestAlertReview?.length ?? 0), "latest alert review CSV row count must match review count");
expect(await csvRowCount("../exports/monitor-recent-review.csv") === (brief.candidateReview?.recentSignalReview?.length ?? 0), "monitor recent review CSV row count must match recent review count");
expect(await csvRowCount("../exports/monitor-lane-routing.csv") === (brief.candidateReview?.monitorLaneRouting?.length ?? 0), "monitor lane routing CSV row count must match routing count");
expect(await csvRowCount("../exports/monitor-recent-signals.csv") === monitor.recentItems.length, "monitor recent signals CSV row count must match recent item count");
expect(await csvRowCount("../exports/discovery-candidates.csv") === (brief.discoveryScan?.reviewItems?.length ?? 0), "discovery candidates CSV row count must match review item count");
expect(await csvRowCount("../exports/language-long-tail-review.csv") === (brief.discoveryScan?.languageLongTailReview?.length ?? 0), "language long-tail CSV row count must match language long-tail review count");
expect(await csvRowCount("../exports/language-coverage-audit.csv") === (brief.languageCoverageAudit?.rows?.length ?? 0), "language coverage CSV row count must match language coverage audit rows");
expect(await csvRowCount("../exports/language-similarity-audit.csv") === (brief.languageSimilarityAudit?.rows?.length ?? 0), "language similarity CSV row count must match language similarity audit rows");
expect(await csvRowCount("../exports/language-official-evidence-map.csv") === (brief.languageOfficialEvidenceMap?.rows?.length ?? 0), "language official evidence map CSV row count must match evidence map rows");
expect(await csvRowCount("../exports/language-growth-channel-deep-dive.csv") === (brief.languageGrowthChannelDeepDive?.rows?.length ?? 0), "language growth/channel CSV row count must match deep-dive rows");
expect(await csvRowCount("../exports/irl-coverage-audit.csv") === (brief.irlCoverageAudit?.rows?.length ?? 0), "IRL coverage CSV row count must match IRL coverage audit rows");
expect(await csvRowCount("../exports/irl-offline-evidence-map.csv") === (brief.irlOfflineEvidenceMap?.rows?.length ?? 0), "IRL offline evidence map CSV row count must match evidence map rows");
expect(await csvRowCount("../exports/supplemental-funding-news.csv") === (brief.discoveryScan?.supplementalFundingNews?.length ?? 0), "supplemental funding/news CSV row count must match supplemental event count");
expect(Boolean(brief.synthesis?.requestId), "brief must include Exa synthesis requestId");
expect(brief.synthesis?.requestId === synthesis.response?.requestId, "brief synthesis requestId must match raw Exa synthesis");
expect(Boolean(brief.synthesis?.summary), "brief synthesis must include summary");
expect(brief.synthesis?.coreProducts?.length >= 4, "brief synthesis must include core products");
expect(brief.synthesis?.irlProducts?.length >= 2, "brief synthesis must include IRL products");
expect(brief.synthesis?.watchlist?.length >= 2, "brief synthesis must include watchlist");
expect(brief.synthesis?.risks?.length >= 3, "brief synthesis must include risks");
expect(monitor.summary?.monitors >= 8, "monitor must include at least eight lanes after residual and coverage signal watchlist routing");
expect(Boolean(monitor.automationSchedule), "monitor must include automation schedule");
expect(monitor.nativeMonitor?.checkedAt === websetsMonitor.checkedAt, "monitor must embed latest Exa Websets monitor probe");
expect(["available", "unavailable", "error"].includes(websetsMonitor.status), "Exa Websets monitor probe must have a known status");
expect(websetsMonitor.probes?.some((probe) => probe.path === "/monitors"), "Exa Websets monitor probe must check monitors endpoint");
expect(Boolean(websetsMonitor.docsUrl), "Exa Websets monitor probe must include docs URL");
expect(monitor.summary?.totalResults >= monitor.summary?.monitors, "monitor total results must be plausible");
expect(monitor.runs?.every((run) => run.ok && run.requestId), "every monitor run must have ok status and requestId");
expect(monitor.runs?.some((run) => run.id === "irl"), "monitor must include IRL lane");
expect(monitor.runs?.some((run) => run.id === "china-export"), "monitor must include China export lane");
expect(monitor.runs?.some((run) => run.id === "residual-irl-watchlist" && run.watchlist?.length >= 4), "monitor must include residual IRL watchlist lane");
expect(monitor.runs?.some((run) => run.id === "coverage-signal-watchlist" && run.watchlist?.length >= 3), "monitor must include coverage signal watchlist lane");
expect(Array.isArray(monitor.alertItems), "monitor must include alertItems array");
expect(Array.isArray(monitor.recentItems), "monitor must include recentItems array");
expect(monitor.recentItems.length >= monitor.summary.newAlerts, "recentItems should cover at least all current new alerts");
expect(monitor.recentItems.length <= monitor.summary.recentResults, "recentItems must not exceed recent result count");
expect(monitorHistory.runs?.length >= 1, "monitor history must include at least one run");
expect(monitorHistory.runs?.[0]?.generatedAt === monitor.generatedAt, "latest monitor history run must match current monitor");
expect(monitorHistory.runs?.[0]?.lanes?.length === monitor.runs.length, "latest monitor history run must include all lanes");
expect(Array.isArray(monitorLedger.items), "monitor ledger must include items array");
expect(monitorLedger.totalItems === monitorLedger.items.length, "monitor ledger totalItems must match item count");
expect(monitorDigest.generatedAt === monitor.generatedAt, "monitor digest timestamp must match current monitor");
expect(Boolean(monitorDigest.headline), "monitor digest must include headline");
expect(monitorDigest.bullets?.length >= 3, "monitor digest must include bullets");
expect(monitorDigest.recommendedActions?.length >= 3, "monitor digest must include recommended actions");
expect(monitorDigest.laneSummaries?.length === monitor.runs.length, "monitor digest lane summaries must match monitor lanes");

const reviewedAlertUrls = new Set(
  (brief.candidateReview?.latestAlertReview ?? [])
    .flatMap((item) => item.evidence ?? [])
    .map((item) => item.url)
    .filter(Boolean),
);
for (const item of monitor.alertItems ?? []) {
  expect(reviewedAlertUrls.has(item.url), `latest alert review must include monitor alert URL: ${item.url}`);
}

for (const product of requiredProducts) {
  expect(allProductText.toLowerCase().includes(product.toLowerCase()), `missing product coverage: ${product}`);
}

for (const row of (await readFile(new URL("../exports/competitive-matrix.csv", import.meta.url), "utf8"))
  .trim()
  .split(/\r?\n/)
  .slice(1)) {
  const cells = row.match(/(?:^|,)(?:"((?:[^"]|"")*)"|([^,]*))/g)?.map((cell) =>
    cell.replace(/^,/, "").replace(/^"|"$/g, "").replaceAll('""', '"'),
  ) ?? [];
  expect(Boolean(cells[8]), `competitive matrix official/social evidence must not be empty: ${cells[0]}`);
}

for (const name of requiredTimelineNames) {
  expect(timelineText.toLowerCase().includes(name.toLowerCase()), `missing timeline coverage: ${name}`);
}

for (const cluster of brief.clusters) {
  for (const item of cluster.items) {
    expect(item.evidence?.length > 0, `product must have evidence link: ${item.name}`);
    expect(Boolean(item.signal), `product must have signal: ${item.name}`);
    expect(Boolean(item.channel), `product must have channel: ${item.name}`);
    expect(Boolean(item.differentiator), `product must have differentiator: ${item.name}`);
    expect(["A", "B", "C", "D"].includes(item.evidenceScore?.grade), `product must have evidence score grade: ${item.name}`);
    expect(Boolean(item.evidenceScore?.label), `product must have evidence score label: ${item.name}`);
    expect(item.evidenceScore?.reasons?.length > 0, `product must have evidence score reasons: ${item.name}`);
  }
}

for (const person of brief.peopleSignals ?? []) {
  expect(Boolean(person.name), "people signal must include name");
  expect(Boolean(person.role), `people signal must include role: ${person.name}`);
  expect(Boolean(person.signal), `people signal must include signal: ${person.name}`);
  expect(Boolean(person.whyItMatters), `people signal must include whyItMatters: ${person.name}`);
  expect(person.evidence?.length > 0, `people signal must include evidence: ${person.name}`);
}

for (const item of brief.financialSignals ?? []) {
  expect(Boolean(item.name), "financial signal must include name");
  expect(Boolean(item.metric), `financial signal must include metric: ${item.name}`);
  expect(Boolean(item.signal), `financial signal must include signal: ${item.name}`);
  expect(Boolean(item.interpretation), `financial signal must include interpretation: ${item.name}`);
  expect(item.evidence?.length > 0, `financial signal must include evidence: ${item.name}`);
}

for (const item of brief.candidateReview?.promoted ?? []) {
  expect(Boolean(item.name), "promoted candidate must include name");
  expect(Boolean(item.source), `promoted candidate must include source: ${item.name}`);
  expect(Boolean(item.decision), `promoted candidate must include decision: ${item.name}`);
  expect(Boolean(item.reason), `promoted candidate must include reason: ${item.name}`);
  expect(item.evidence?.length > 0, `promoted candidate must include evidence: ${item.name}`);
}

for (const item of brief.candidateReview?.deferred ?? []) {
  expect(Boolean(item.name), "deferred candidate must include name");
  expect(Boolean(item.source), `deferred candidate must include source: ${item.name}`);
  expect(Boolean(item.decision), `deferred candidate must include decision: ${item.name}`);
  expect(Boolean(item.reason), `deferred candidate must include reason: ${item.name}`);
  expect(item.evidence?.length > 0, `deferred candidate must include evidence: ${item.name}`);
}

for (const item of brief.candidateReview?.latestAlertReview ?? []) {
  expect(Boolean(item.name), "latest alert review item must include name");
  expect(Boolean(item.source), `latest alert review item must include source: ${item.name}`);
  expect(Boolean(item.decision), `latest alert review item must include decision: ${item.name}`);
  expect(Boolean(item.reason), `latest alert review item must include reason: ${item.name}`);
  expect(item.evidence?.length > 0, `latest alert review item must include evidence: ${item.name}`);
}

for (const group of brief.officialSocialEvidence?.groups ?? []) {
  expect(Boolean(group.title), "official/social group must include title");
  expect(group.items?.length > 0, `official/social group must include items: ${group.title}`);
  for (const item of group.items ?? []) {
    expect(Boolean(item.name), `official/social item must include name: ${group.title}`);
    expect(Boolean(item.type), `official/social item must include type: ${item.name}`);
    expect(item.evidence?.length > 0, `official/social item must include evidence: ${item.name}`);
  }
}

for (const row of brief.exaQueryMatrix?.rows ?? []) {
  expect(Boolean(row.id), "Exa query row must include id");
  expect(Boolean(row.source), `Exa query row must include source: ${row.id}`);
  expect(Boolean(row.category), `Exa query row must include category: ${row.id}`);
  expect(Number.isFinite(row.resultCount) && row.resultCount >= 0, `Exa query row must include resultCount: ${row.id}`);
  expect(Boolean(row.requestId), `Exa query row must include requestId: ${row.id}`);
}

for (const group of brief.priorityShortlist ?? []) {
  expect(Boolean(group.lane), "priority shortlist group must include lane");
  expect(Boolean(group.thesis), `priority shortlist group must include thesis: ${group.lane}`);
  for (const pick of group.picks ?? []) {
    expect(Boolean(pick.name), `priority pick must include name: ${group.lane}`);
    expect(Boolean(pick.reason), `priority pick must include reason: ${pick.name}`);
    expect(Boolean(pick.action), `priority pick must include action: ${pick.name}`);
    const firstName = pick.name.split("/")[0].trim().toLowerCase();
    expect(allEvidenceText.toLowerCase().includes(firstName), `priority pick must be grounded in evidence: ${pick.name}`);
  }
}

for (const group of brief.discoveryScan?.groups ?? []) {
  expect(Boolean(group.label), `discovery group must include label: ${group.id}`);
  expect(Boolean(group.category), `discovery group must include category: ${group.id}`);
  expect(Boolean(group.requestId), `discovery group must include requestId: ${group.id}`);
  expect(group.notableResults?.length > 0, `discovery group must include notable results: ${group.id}`);
  for (const item of group.notableResults ?? []) {
    expect(Boolean(item.title), `discovery result must include title: ${group.id}`);
    expect(Boolean(item.url), `discovery result must include URL: ${group.id}`);
  }
}

for (const item of brief.discoveryScan?.reviewItems ?? []) {
  expect(Boolean(item.name), "discovery review item must include name");
  expect(Boolean(item.lane), `discovery review item must include lane: ${item.name}`);
  expect(Boolean(item.decision), `discovery review item must include decision: ${item.name}`);
  expect(Boolean(item.reason), `discovery review item must include reason: ${item.name}`);
  expect(item.evidence?.length > 0, `discovery review item must include evidence: ${item.name}`);
}

for (const item of brief.discoveryScan?.supplementalFundingNews ?? []) {
  expect(Boolean(item.date), `supplemental funding/news item must include date: ${item.name}`);
  expect(Boolean(item.name), "supplemental funding/news item must include name");
  expect(Boolean(item.amount), `supplemental funding/news item must include amount/event: ${item.name}`);
  expect(Boolean(item.lane), `supplemental funding/news item must include lane: ${item.name}`);
  expect(Boolean(item.url), `supplemental funding/news item must include URL: ${item.name}`);
}

for (const item of brief.completionAudit ?? []) {
  expect(Boolean(item.requirement), "completion audit item must include requirement");
  expect(Boolean(item.status), `completion audit item must include status: ${item.requirement}`);
  expect(Boolean(item.evidence), `completion audit item must include evidence: ${item.requirement}`);
  expect(item.proof?.length > 0, `completion audit item must include proof: ${item.requirement}`);
}

expect(completionAudit.includes("## Strict Completion Verdict"), "completion audit must include a strict completion verdict section");
expect(brief.strictCompletionVerdict?.status === "not-mathematically-complete", "brief must expose strict non-exhaustive completion verdict for the frontend");
expect(brief.strictCompletionVerdict?.presentationReady === true, "brief strict verdict must record presentation-ready state");
expect(brief.strictCompletionVerdict?.latestAlertPendingRows === 0, "brief strict verdict must require zero latest-alert pending rows");
expect(brief.strictCompletionVerdict?.recentSignalPendingRows === 0, "brief strict verdict must require zero recent-signal pending rows");
expect(brief.strictCompletionVerdict?.blockingGapRows === 0, "brief strict verdict must require zero blocking product-candidate rows");
expect(completionManifest.strictCompletionVerdict?.status === "not-mathematically-complete", "completion manifest must keep a strict non-exhaustive completion verdict");
expect(completionManifest.strictCompletionVerdict?.presentationReady === true, "completion manifest strict verdict must record presentation-ready state");
expect(completionManifest.strictCompletionVerdict?.latestAlertPendingRows === 0, "strict verdict must require zero latest-alert pending rows");
expect(completionManifest.strictCompletionVerdict?.recentSignalPendingRows === 0, "strict verdict must require zero recent-signal pending rows");
expect(completionManifest.strictCompletionVerdict?.blockingGapRows === 0, "strict verdict must require zero blocking product-candidate rows");

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  coverage: brief.coverage,
  productCards: brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0),
  peopleSignals: brief.peopleSignals.length,
  financialSignals: brief.financialSignals.length,
  timelineEvents: brief.fundingTimeline.length,
  fundingSummary: {
    irlEvents: brief.fundingSummary.irlEvents,
    explicitUsdFundingM: brief.fundingSummary.explicitUsdFundingM,
    supplementalEvents: brief.fundingSummary.supplementalEvents,
  },
  fundingEventAudit: {
    rows: brief.fundingEventAudit.totalRows,
    irlRows: brief.fundingEventAudit.irlRows,
    explicitUsdRows: brief.fundingEventAudit.explicitUsdRows,
  },
  fundingUpgradeMap: {
    rows: brief.fundingUpgradeMap.totalRows,
    retained: brief.fundingUpgradeMap.retainedCandidates,
    duplicateEvidence: brief.fundingUpgradeMap.duplicateEvidenceRows,
  },
  researchSignals: brief.researchSignals.length,
  requestIds: brief.requestIds.length,
  synthesisRequestId: brief.synthesis.requestId,
  monitor: monitor.summary,
  recentItems: monitor.recentItems.length,
  monitorHistoryRuns: monitorHistory.runs.length,
  monitorLedgerItems: monitorLedger.totalItems,
  monitorDigest: monitorDigest.headline,
  nativeMonitor: {
    status: websetsMonitor.status,
    mode: websetsMonitor.mode,
  },
  discoveryScan: {
    scans: brief.discoveryScan.totalScans,
    results: brief.discoveryScan.totalResults,
    reviewItems: brief.discoveryScan.reviewItems.length,
    fundingCandidateRows: brief.discoveryScan.fundingCandidateRows,
    fundingCandidatePendingRows: brief.discoveryScan.fundingCandidatePendingRows,
  },
  candidatePromotionQueue: {
    rows: brief.candidatePromotionQueue.totalRows,
    highPriority: brief.candidatePromotionQueue.highPriorityRows,
    integratedMarketRows: brief.candidatePromotionQueue.integratedMarketRows,
  },
  languageSimilarityAudit: {
    rows: brief.languageSimilarityAudit.totalRows,
    highlySimilar: brief.languageSimilarityAudit.highlySimilar,
    adjacentVariants: brief.languageSimilarityAudit.adjacentVariants,
  },
  languageOfficialEvidenceMap: {
    rows: brief.languageOfficialEvidenceMap.totalRows,
    ready: brief.languageOfficialEvidenceMap.readyRows,
    displayable: brief.languageOfficialEvidenceMap.displayableRows,
    thin: brief.languageOfficialEvidenceMap.thinRows,
  },
  irlOfflineEvidenceMap: {
    rows: brief.irlOfflineEvidenceMap.totalRows,
    fundingLinked: brief.irlOfflineEvidenceMap.fundingLinkedRows,
    monitorLinked: brief.irlOfflineEvidenceMap.monitorLinkedRows,
    strong: brief.irlOfflineEvidenceMap.strongRows,
  },
  candidateReview: {
    promoted: brief.candidateReview.promoted.length,
    deferred: brief.candidateReview.deferred.length,
    latestAlertReview: brief.candidateReview.latestAlertReview.length,
  },
  officialSocialEvidence: {
    requestIds: brief.officialSocialEvidence.requestIds.length,
    groups: brief.officialSocialEvidence.groups.length,
  },
  companyBackgroundCoverageAudit: brief.companyBackgroundCoverageAudit.summary,
  exaQueryMatrix: {
    totalSearches: brief.exaQueryMatrix.totalSearches,
    totalResults: brief.exaQueryMatrix.totalResults,
  },
  exaCategoryEvidenceAudit: brief.exaCategoryEvidenceAudit.rows.length,
  priorityShortlist: brief.priorityShortlist.length,
  channelSummary: brief.channelSummary.groups.map((group) => ({ id: group.id, count: group.count })),
  growthChannelAudit: brief.growthChannelAudit.byGrowthLevel,
  functionalDifferenceAudit: brief.functionalDifferenceAudit.byHumanMode,
  officialSocialCoverageAudit: brief.officialSocialCoverageAudit.summary,
  opportunityRanking: brief.opportunityRanking.groups.map((group) => ({ id: group.id, count: group.items.length })),
  evidenceScoring: brief.evidenceScoring.counts,
  completionAudit: brief.completionAudit.length,
  objectiveEvidenceMap: brief.objectiveEvidenceMap.length,
  coverageGapRegister: brief.coverageGapRegister.groups.length,
  coverageGapsDeepDiveReviewed: brief.coverageGapRegister.deepDiveReviewedGaps,
}, null, 2));
