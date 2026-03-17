import type { MonthlyPerformance, FundCharacteristics, ScoringCategory } from "@/types/fund";
import { SCORING_WEIGHTS, PENALTIES, FINAL_SCORE_RANGE } from "./weights";
import {
  normalizePercentile,
  normalizePercentileInverse,
  normalizeLogScale,
  rescaleToRange,
  getRange,
} from "./normalizers";
import { getScoringCategory, isRetireeFund } from "@/lib/data-pipeline/normalizers/fund-mapper";

export interface FundData {
  fundId: string;
  companyId: string;
  fundType: string;
  fundName: string;
  performance: MonthlyPerformance;
  characteristics?: FundCharacteristics;
}

interface CalculatedScore {
  fundId: string;
  overallScore: number;
  returnScore: number;
  feeScore: number;
  sizeScore: number;
  actuarialScore: number;
  serviceScore: number;
  flexibilityScore: number;
  claimsScore: number;
  netFlowScore: number;
  penaltyTotal: number;
}

export interface CategoryScoreResult {
  category: ScoringCategory;
  scores: CalculatedScore[];
}

export interface CompanyScoreResult {
  companyId: string;
  scoringCategory: ScoringCategory | "overall";
  overallScore: number;
  returnScore: number;
  feeScore: number;
  sizeScore: number;
  actuarialScore: number;
  serviceScore: number;
  flexibilityScore: number;
  claimsScore: number;
  netFlowScore: number;
  penaltyTotal: number;
  totalAssets: number;
  fundCount: number;
}

/**
 * Gets the scoring category for a fund based on its type and name.
 * Retiree funds (with "קצבה" in the name) get their own categories.
 */
export function getFundCategory(fundType: string, fundName: string): ScoringCategory {
  return getScoringCategory(fundType, fundName);
}

/**
 * Partitions funds by category and calculates scores independently for each.
 */
export function calculateScoresByCategory(funds: FundData[]): CategoryScoreResult[] {
  const categoryMap = new Map<ScoringCategory, FundData[]>();

  for (const fund of funds) {
    const category = getFundCategory(fund.fundType, fund.fundName);
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(fund);
  }

  const results: CategoryScoreResult[] = [];

  for (const [category, categoryFunds] of categoryMap) {
    const scores = calculateAllScores(categoryFunds);
    results.push({ category, scores });
  }

  return results;
}

/**
 * Calculates company-level scores as asset-weighted averages of fund scores.
 */
export function calculateCompanyScores(
  fundScores: CalculatedScore[],
  fundDataMap: Map<string, FundData>
): CompanyScoreResult[] {
  // Group by companyId
  const companyGroups = new Map<string, Array<{ score: CalculatedScore; assets: number }>>();

  for (const score of fundScores) {
    const fundData = fundDataMap.get(score.fundId);
    if (!fundData) continue;

    const companyId = fundData.companyId;
    const assets = fundData.performance.totalAssets ?? 0;

    if (!companyGroups.has(companyId)) {
      companyGroups.set(companyId, []);
    }
    companyGroups.get(companyId)!.push({ score, assets });
  }

  const results: CompanyScoreResult[] = [];

  for (const [companyId, funds] of companyGroups) {
    const totalAssets = funds.reduce((sum, f) => sum + f.assets, 0);

    if (totalAssets === 0) {
      // Equal weight if no asset data
      const n = funds.length;
      const avg = (getter: (s: CalculatedScore) => number) =>
        Math.round((funds.reduce((s, f) => s + getter(f.score), 0) / n) * 10) / 10;

      results.push({
        companyId,
        scoringCategory: "overall",
        overallScore: avg((s) => s.overallScore),
        returnScore: avg((s) => s.returnScore),
        feeScore: avg((s) => s.feeScore),
        sizeScore: avg((s) => s.sizeScore),
        actuarialScore: avg((s) => s.actuarialScore),
        serviceScore: avg((s) => s.serviceScore),
        flexibilityScore: avg((s) => s.flexibilityScore),
        claimsScore: avg((s) => s.claimsScore),
        netFlowScore: avg((s) => s.netFlowScore),
        penaltyTotal: avg((s) => s.penaltyTotal),
        totalAssets: 0,
        fundCount: n,
      });
      continue;
    }

    // Asset-weighted average for each sub-score
    const weightedAvg = (getter: (s: CalculatedScore) => number) =>
      Math.round((funds.reduce((sum, f) => sum + getter(f.score) * f.assets, 0) / totalAssets) * 10) / 10;

    results.push({
      companyId,
      scoringCategory: "overall",
      overallScore: weightedAvg((s) => s.overallScore),
      returnScore: weightedAvg((s) => s.returnScore),
      feeScore: weightedAvg((s) => s.feeScore),
      sizeScore: weightedAvg((s) => s.sizeScore),
      actuarialScore: weightedAvg((s) => s.actuarialScore),
      serviceScore: weightedAvg((s) => s.serviceScore),
      flexibilityScore: weightedAvg((s) => s.flexibilityScore),
      claimsScore: weightedAvg((s) => s.claimsScore),
      netFlowScore: weightedAvg((s) => s.netFlowScore),
      penaltyTotal: weightedAvg((s) => s.penaltyTotal),
      totalAssets: Math.round(totalAssets * 10) / 10,
      fundCount: funds.length,
    });
  }

  return results;
}

const NEUTRAL_SCORE = 50;

/**
 * Pre-computes value arrays and ranges for percentile normalization.
 */
function computeRanges(funds: FundData[]) {
  const perfs = funds.map((f) => f.performance);
  const chars = funds.map((f) => f.characteristics).filter(Boolean) as FundCharacteristics[];

  const yield5YrValues = perfs.map((p) => p.avgAnnualYield5Yrs);
  const yield3YrValues = perfs.map((p) => p.avgAnnualYield3Yrs);
  const yieldYTDValues = perfs.map((p) => p.yearToDateYield);
  const sharpeValues = perfs.map((p) => p.sharpeRatio);
  const stdDevValues = perfs.map((p) => p.standardDeviation);
  const alphaValues = perfs.map((p) => p.alpha);
  const mgmtFeeValues = perfs.map((p) => p.avgAnnualManagementFee);
  const depositFeeValues = perfs.map((p) => p.avgDepositFee);
  const totalAssetsValues = perfs.map((p) => p.totalAssets);
  const actuarialValues = perfs.map((p) => p.actuarialAdjustment);
  const netFlowRatioValues = perfs.map((p) =>
    p.netMonthlyDeposits != null && p.totalAssets != null && p.totalAssets > 0
      ? p.netMonthlyDeposits / p.totalAssets
      : null
  );
  const claimsValues = chars.map((c) => c.claimsApprovalRate);

  return {
    yield5Yr: yield5YrValues,
    yield3Yr: yield3YrValues,
    yieldYTD: yieldYTDValues,
    sharpe: sharpeValues,
    stdDev: stdDevValues,
    alpha: alphaValues,
    mgmtFee: mgmtFeeValues,
    depositFee: depositFeeValues,
    totalAssets: { range: getRange(totalAssetsValues), values: totalAssetsValues },
    actuarial: actuarialValues,
    netFlowRatio: netFlowRatioValues,
    claimsApproval: claimsValues,
  };
}

/**
 * Calculates quality scores for all funds in a category.
 * Uses percentile-based normalization for better score distribution.
 * Applies final rescaling to spread scores across a user-friendly range.
 */
export function calculateAllScores(funds: FundData[]): CalculatedScore[] {
  if (funds.length === 0) return [];

  // Pre-compute value arrays for percentile normalization
  const ranges = computeRanges(funds);

  // Check if this is a retiree category (net flow gets neutral score)
  const isRetireeCategory = funds.length > 0 && isRetireeFund(funds[0].fundName);

  // Calculate raw scores for each fund
  const scores = funds.map((fund) => {
    const returnScore = calculateReturnScore(fund.performance, ranges);
    const feeScore = calculateFeeScore(fund.performance, ranges);
    const sizeScore = calculateSizeScore(fund.performance, ranges);
    const actuarialScore = calculateActuarialScore(fund.performance, ranges);
    const serviceScore = fund.characteristics?.serviceQualityScore ?? NEUTRAL_SCORE;
    const claimsScore =
      fund.characteristics?.claimsApprovalRate != null
        ? normalizePercentile(fund.characteristics.claimsApprovalRate, ranges.claimsApproval) ?? NEUTRAL_SCORE
        : NEUTRAL_SCORE;
    const flexibilityScore = calculateFlexibilityScore(fund.characteristics);
    const netFlowScore = isRetireeCategory
      ? NEUTRAL_SCORE
      : calculateNetFlowScore(fund.performance, ranges);

    // Weighted base score
    const baseScore =
      returnScore * SCORING_WEIGHTS.returns.weight +
      feeScore * SCORING_WEIGHTS.fees.weight +
      actuarialScore * SCORING_WEIGHTS.actuarialBalance.weight +
      sizeScore * SCORING_WEIGHTS.fundSize.weight +
      serviceScore * SCORING_WEIGHTS.serviceQuality.weight +
      netFlowScore * SCORING_WEIGHTS.netFlow.weight +
      claimsScore * SCORING_WEIGHTS.claimsApproval.weight +
      flexibilityScore * SCORING_WEIGHTS.trackFlexibility.weight;

    // Apply penalties
    const penaltyTotal = calculatePenalties(fund, ranges);

    const overallScore = Math.max(0, Math.min(100, baseScore - penaltyTotal));

    return {
      fundId: fund.fundId,
      overallScore: Math.round(overallScore * 10) / 10,
      returnScore: Math.round(returnScore * 10) / 10,
      feeScore: Math.round(feeScore * 10) / 10,
      sizeScore: Math.round(sizeScore * 10) / 10,
      actuarialScore: Math.round(actuarialScore * 10) / 10,
      serviceScore: Math.round(serviceScore * 10) / 10,
      flexibilityScore: Math.round(flexibilityScore * 10) / 10,
      claimsScore: Math.round(claimsScore * 10) / 10,
      netFlowScore: Math.round(netFlowScore * 10) / 10,
      penaltyTotal: Math.round(penaltyTotal * 10) / 10,
    };
  });

  // Rescale overall scores to a user-friendly range (e.g., 35-95)
  if (scores.length > 1) {
    const rescaled = rescaleToRange(
      scores.map((s) => ({ id: s.fundId, score: s.overallScore })),
      FINAL_SCORE_RANGE.min,
      FINAL_SCORE_RANGE.max
    );
    for (const s of scores) {
      s.overallScore = rescaled.get(s.fundId) ?? s.overallScore;
    }
  }

  // Sort by overall score and assign ranks
  scores.sort((a, b) => b.overallScore - a.overallScore);
  return scores;
}

function calculateReturnScore(
  perf: MonthlyPerformance,
  ranges: ReturnType<typeof computeRanges>
): number {
  const sw = SCORING_WEIGHTS.returns.subWeights;
  const s5 = normalizePercentile(perf.avgAnnualYield5Yrs, ranges.yield5Yr) ?? NEUTRAL_SCORE;
  const s3 = normalizePercentile(perf.avgAnnualYield3Yrs, ranges.yield3Yr) ?? NEUTRAL_SCORE;
  const sYTD = normalizePercentile(perf.yearToDateYield, ranges.yieldYTD) ?? NEUTRAL_SCORE;
  const sSharpe = normalizePercentile(perf.sharpeRatio, ranges.sharpe) ?? NEUTRAL_SCORE;
  // Consistency: lower standard deviation = better (more consistent returns)
  const sConsistency = normalizePercentileInverse(perf.standardDeviation, ranges.stdDev) ?? NEUTRAL_SCORE;
  // Alpha: excess return above benchmark
  const sAlpha = normalizePercentile(perf.alpha, ranges.alpha) ?? NEUTRAL_SCORE;

  return (
    s5 * sw.trailing5Yr +
    s3 * sw.trailing3Yr +
    sYTD * sw.yearToDate +
    sSharpe * sw.sharpeRatio +
    sConsistency * sw.consistency +
    sAlpha * sw.alpha
  );
}

function calculateFeeScore(
  perf: MonthlyPerformance,
  ranges: ReturnType<typeof computeRanges>
): number {
  const sw = SCORING_WEIGHTS.fees.subWeights;
  const sMgmt = normalizePercentileInverse(perf.avgAnnualManagementFee, ranges.mgmtFee) ?? NEUTRAL_SCORE;
  const sDeposit = normalizePercentileInverse(perf.avgDepositFee, ranges.depositFee) ?? NEUTRAL_SCORE;

  return sMgmt * sw.managementFee + sDeposit * sw.depositFee;
}

function calculateSizeScore(
  perf: MonthlyPerformance,
  ranges: ReturnType<typeof computeRanges>
): number {
  // Keep logarithmic scale for fund size - log is more appropriate than percentile
  return normalizeLogScale(perf.totalAssets, ranges.totalAssets.range.min, ranges.totalAssets.range.max) ?? NEUTRAL_SCORE;
}

function calculateActuarialScore(
  perf: MonthlyPerformance,
  ranges: ReturnType<typeof computeRanges>
): number {
  return normalizePercentile(perf.actuarialAdjustment, ranges.actuarial) ?? NEUTRAL_SCORE;
}

function calculateNetFlowScore(
  perf: MonthlyPerformance,
  ranges: ReturnType<typeof computeRanges>
): number {
  if (perf.netMonthlyDeposits == null || perf.totalAssets == null || perf.totalAssets <= 0) {
    return NEUTRAL_SCORE;
  }
  const ratio = perf.netMonthlyDeposits / perf.totalAssets;
  return normalizePercentile(ratio, ranges.netFlowRatio) ?? NEUTRAL_SCORE;
}

function calculateFlexibilityScore(
  chars?: FundCharacteristics
): number {
  if (!chars) return NEUTRAL_SCORE;

  switch (chars.trackFlexibility) {
    case "full":
      return 100;
    case "limited":
      return 50;
    case "none":
      return 0;
    default:
      return NEUTRAL_SCORE;
  }
}

function calculatePenalties(
  fund: FundData,
  ranges: ReturnType<typeof computeRanges>
): number {
  let total = 0;

  // Penalty: accepts members without health declaration
  if (fund.characteristics?.acceptsWithoutHealthDeclaration) {
    total += PENALTIES.noHealthDeclaration.maxDeduction;
  }

  // Penalty: limited investment tracks
  if (fund.characteristics?.trackFlexibility === "none") {
    total += PENALTIES.limitedTrackOptions.maxDeduction;
  }

  // Penalty: very small fund
  const assets = fund.performance.totalAssets;
  if (assets !== null && assets < PENALTIES.verySmallFund.assetThresholdMillions) {
    const ratio = assets / PENALTIES.verySmallFund.assetThresholdMillions;
    total += PENALTIES.verySmallFund.maxDeduction * (1 - ratio);
  }

  // Penalty: actuarial deficit
  const actuarial = fund.performance.actuarialAdjustment;
  if (actuarial !== null && actuarial < 0) {
    const actuarialRange = getRange(ranges.actuarial);
    const maxDeficit = Math.abs(actuarialRange.min) || 1;
    const severity = Math.min(Math.abs(actuarial) / maxDeficit, 1.0);
    total += PENALTIES.actuarialDeficit.maxDeduction * severity;
  }

  return total;
}
