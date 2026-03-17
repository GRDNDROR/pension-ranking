import { db } from "@/lib/db";
import {
  managementCompanies,
  pensionFunds,
  monthlyPerformance,
  fundCharacteristics,
  qualityScores,
  companyScores,
  dataRefreshLog,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { fetchPensionNetData, fetchLatestPeriod } from "./fetchers/pension-net";
import { fetchFullHistoricalData, calculateLongTermReturns } from "./fetchers/historical-returns";
import { normalizeCKANRecord, createFundSlug } from "./normalizers/fund-mapper";
import { MANAGEMENT_COMPANIES, FUND_LIMITATIONS, ALL_SCORING_CATEGORIES, REGULAR_CATEGORIES, SERVICE_QUALITY_SCORES, CLAIMS_APPROVAL_SCORES } from "@/lib/constants/funds";
import {
  calculateScoresByCategory,
  calculateCompanyScores,
  getFundCategory,
} from "@/lib/scoring/calculator";
import type { FundData } from "@/lib/scoring/calculator";
import type { FundCharacteristics as FundCharsType, MonthlyPerformance, ScoringCategory } from "@/types/fund";

/**
 * Seeds management companies from our known constants.
 */
export function seedManagementCompanies() {
  for (const company of MANAGEMENT_COMPANIES) {
    db.insert(managementCompanies)
      .values({
        id: company.id,
        nameHebrew: company.nameHebrew,
        nameEnglish: company.nameEnglish ?? null,
        websiteUrl: company.websiteUrl ?? null,
      })
      .onConflictDoUpdate({
        target: managementCompanies.id,
        set: {
          nameHebrew: company.nameHebrew,
          nameEnglish: company.nameEnglish ?? null,
          websiteUrl: company.websiteUrl ?? null,
        },
      })
      .run();
  }
}

/**
 * Seeds fund characteristics from known limitations.
 */
export function seedFundCharacteristics() {
  const now = new Date().toISOString();

  // First, find all funds and match them to company limitations
  const allFunds = db.select().from(pensionFunds).all();

  for (const fund of allFunds) {
    if (!fund.companyId) continue;
    const limits = FUND_LIMITATIONS[fund.companyId];
    if (!limits) continue;

    // Use real CMA service quality scores and claims data when available
    const serviceScore = SERVICE_QUALITY_SCORES[fund.companyId] ?? null;
    const claimsScore = CLAIMS_APPROVAL_SCORES[fund.companyId] ?? null;

    db.insert(fundCharacteristics)
      .values({
        fundId: fund.id,
        acceptsWithoutHealthDeclaration: limits.acceptsWithoutHealthDeclaration,
        trackFlexibility: limits.trackFlexibility,
        numberOfTagmulimTracks: limits.numberOfTagmulimTracks,
        numberOfPitzuyimTracks: limits.numberOfPitzuyimTracks,
        serviceQualityScore: serviceScore,
        claimsApprovalRate: claimsScore,
        publicComplaintsRate: null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: fundCharacteristics.fundId,
        set: {
          acceptsWithoutHealthDeclaration: limits.acceptsWithoutHealthDeclaration,
          trackFlexibility: limits.trackFlexibility,
          numberOfTagmulimTracks: limits.numberOfTagmulimTracks,
          numberOfPitzuyimTracks: limits.numberOfPitzuyimTracks,
          serviceQualityScore: serviceScore,
          claimsApprovalRate: claimsScore,
          updatedAt: now,
        },
      })
      .run();
  }
}

/**
 * Full pipeline: fetch data, normalize, store, calculate scores.
 */
export async function runPipeline(options?: { reportPeriod?: number }) {
  const startedAt = new Date().toISOString();
  let recordsProcessed = 0;
  let latestPeriod = 0;

  try {
    console.log("Starting pipeline...");

    // Step 1: Seed management companies
    console.log("Seeding management companies...");
    seedManagementCompanies();

    // Step 2: Fetch data from CKAN
    const period = options?.reportPeriod;
    console.log(
      period
        ? `Fetching data for period ${period}...`
        : "Fetching latest data..."
    );
    const records = await fetchPensionNetData(
      period ? { reportPeriod: period } : undefined
    );
    console.log(`Fetched ${records.length} records`);

    // Step 3: Normalize and store
    const fundIdMap = new Map<string, string>(); // externalId -> our fundId
    const seenFunds = new Set<string>();

    for (const record of records) {
      const normalized = normalizeCKANRecord(record);
      if (!normalized.companyId) {
        // Unknown company, skip
        continue;
      }

      // Create or get fund ID
      const fundKey = `${normalized.companyId}-${normalized.externalId}`;
      let fundId = fundIdMap.get(fundKey);

      if (!fundId) {
        fundId = fundKey;
        const slug = createFundSlug(
          normalized.companyId,
          normalized.externalId,
          normalized.fundNameHebrew
        );

        db.insert(pensionFunds)
          .values({
            id: fundId,
            externalId: normalized.externalId,
            companyId: normalized.companyId,
            nameHebrew: normalized.fundNameHebrew,
            fundType: normalized.fundType,
            classification: normalized.classification,
            slug,
            isActive: true,
          })
          .onConflictDoUpdate({
            target: pensionFunds.id,
            set: {
              nameHebrew: normalized.fundNameHebrew,
              fundType: normalized.fundType,
              classification: normalized.classification,
              isActive: true,
            },
          })
          .run();

        fundIdMap.set(fundKey, fundId);
      }

      // Store performance data
      const now = new Date().toISOString();
      db.insert(monthlyPerformance)
        .values({
          fundId,
          reportPeriod: normalized.reportPeriod,
          totalAssets: normalized.totalAssets,
          deposits: normalized.deposits,
          withdrawals: normalized.withdrawals,
          netMonthlyDeposits: normalized.netMonthlyDeposits,
          monthlyYield: normalized.monthlyYield,
          yearToDateYield: normalized.yearToDateYield,
          yieldTrailing3Yrs: normalized.yieldTrailing3Yrs,
          yieldTrailing5Yrs: normalized.yieldTrailing5Yrs,
          avgAnnualYield3Yrs: normalized.avgAnnualYield3Yrs,
          avgAnnualYield5Yrs: normalized.avgAnnualYield5Yrs,
          avgAnnualManagementFee: normalized.avgAnnualManagementFee,
          avgDepositFee: normalized.avgDepositFee,
          sharpeRatio: normalized.sharpeRatio,
          alpha: normalized.alpha,
          standardDeviation: normalized.standardDeviation,
          actuarialAdjustment: normalized.actuarialAdjustment,
          liquidAssetsPercent: normalized.liquidAssetsPercent,
          stockMarketExposure: normalized.stockMarketExposure,
          foreignExposure: normalized.foreignExposure,
          foreignCurrencyExposure: normalized.foreignCurrencyExposure,
          fetchedAt: now,
        })
        .onConflictDoNothing()
        .run();

      recordsProcessed++;
      if (normalized.reportPeriod > latestPeriod) {
        latestPeriod = normalized.reportPeriod;
      }
    }

    console.log(`Processed ${recordsProcessed} records`);

    // Step 4: Seed fund characteristics
    console.log("Seeding fund characteristics...");
    seedFundCharacteristics();

    // Step 5: Calculate scores for the latest period
    if (latestPeriod > 0) {
      console.log(`Calculating scores for period ${latestPeriod}...`);
      await calculateAndStoreScores(latestPeriod);
    }

    // Step 6: Fetch historical data and calculate long-term returns
    console.log("Fetching historical data for long-term returns...");
    await fetchFullHistoricalData();
    calculateLongTermReturns();

    // Step 7: Log success
    db.insert(dataRefreshLog)
      .values({
        source: "pension-net",
        status: "success",
        recordsProcessed,
        latestPeriod,
        startedAt,
        completedAt: new Date().toISOString(),
      })
      .run();

    console.log("Pipeline completed successfully!");
    return { success: true, recordsProcessed, latestPeriod };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Pipeline failed:", errorMessage);

    db.insert(dataRefreshLog)
      .values({
        source: "pension-net",
        status: "failure",
        recordsProcessed,
        latestPeriod: latestPeriod || null,
        startedAt,
        completedAt: new Date().toISOString(),
        errorMessage,
      })
      .run();

    throw error;
  }
}

/**
 * Calculate and store quality scores for a specific period.
 * Scores are calculated separately per category (comprehensive vs non-comprehensive).
 * Company-level scores are also calculated as asset-weighted averages.
 */
async function calculateAndStoreScores(reportPeriod: number) {
  // Get all performance data for this period
  const perfData = db
    .select()
    .from(monthlyPerformance)
    .where(eq(monthlyPerformance.reportPeriod, reportPeriod))
    .all();

  // Get fund info and characteristics
  const allFunds = db.select().from(pensionFunds).all();
  const allChars = db.select().from(fundCharacteristics).all();
  const charsMap = new Map(allChars.map((c) => [c.fundId, c]));

  // Calculate composite actuarial score per fund across all available history
  // Combines: weighted average across time periods + penalty for frequency of negative periods
  // Recent years = 35%, 3-5yr = 25%, 5-10yr = 20%, 10yr+ = 20%
  const actuarialFallback = new Map<string, number>();
  const actuarialRows = db.all(sql`
    SELECT fund_id,
      AVG(CASE WHEN report_period >= ${reportPeriod - 300} THEN actuarial_adjustment END) as avg_3yr,
      AVG(CASE WHEN report_period >= ${reportPeriod - 500} AND report_period < ${reportPeriod - 300} THEN actuarial_adjustment END) as avg_3to5yr,
      AVG(CASE WHEN report_period >= ${reportPeriod - 1000} AND report_period < ${reportPeriod - 500} THEN actuarial_adjustment END) as avg_5to10yr,
      AVG(CASE WHEN report_period < ${reportPeriod - 1000} THEN actuarial_adjustment END) as avg_10yr_plus,
      AVG(actuarial_adjustment) as avg_all,
      CAST(SUM(CASE WHEN actuarial_adjustment < 0 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) as pct_negative,
      MIN(actuarial_adjustment) as worst_ever
    FROM monthly_performance
    WHERE actuarial_adjustment IS NOT NULL
    GROUP BY fund_id
  `) as Array<{
    fund_id: string;
    avg_3yr: number | null;
    avg_3to5yr: number | null;
    avg_5to10yr: number | null;
    avg_10yr_plus: number | null;
    avg_all: number;
    pct_negative: number;
    worst_ever: number;
  }>;
  for (const row of actuarialRows) {
    // Weighted average across time periods (long-term track record is crucial)
    let totalWeight = 0;
    let weightedSum = 0;
    if (row.avg_3yr != null) { weightedSum += row.avg_3yr * 0.35; totalWeight += 0.35; }
    if (row.avg_3to5yr != null) { weightedSum += row.avg_3to5yr * 0.25; totalWeight += 0.25; }
    if (row.avg_5to10yr != null) { weightedSum += row.avg_5to10yr * 0.20; totalWeight += 0.20; }
    if (row.avg_10yr_plus != null) { weightedSum += row.avg_10yr_plus * 0.20; totalWeight += 0.20; }

    let avgScore = totalWeight > 0 ? weightedSum / totalWeight : row.avg_all;

    // Penalize funds with high frequency of negative actuarial adjustments
    // pct_negative of 0.5+ is very concerning (deficit more than half the time)
    const negativePenalty = row.pct_negative * 0.3; // up to -0.3 penalty
    avgScore = avgScore - negativePenalty;

    actuarialFallback.set(row.fund_id, avgScore);
  }

  // Build fund data array for scoring
  const fundDataArray: FundData[] = perfData
    .map((perf) => {
      const fund = allFunds.find((f) => f.id === perf.fundId);
      if (!fund) return null;

      const chars = charsMap.get(fund.id);
      const mappedChars: FundCharsType | undefined = chars
        ? {
            fundId: chars.fundId,
            acceptsWithoutHealthDeclaration:
              !!chars.acceptsWithoutHealthDeclaration,
            trackFlexibility:
              (chars.trackFlexibility as "full" | "limited" | "none") || "full",
            numberOfTagmulimTracks: chars.numberOfTagmulimTracks ?? 0,
            numberOfPitzuyimTracks: chars.numberOfPitzuyimTracks ?? 0,
            serviceQualityScore: chars.serviceQualityScore,
            claimsApprovalRate: chars.claimsApprovalRate,
            publicComplaintsRate: chars.publicComplaintsRate,
          }
        : undefined;

      // Use current period actuarial data, or fall back to latest available
      const actuarialAdj = perf.actuarialAdjustment ?? actuarialFallback.get(perf.fundId) ?? null;

      return {
        fundId: fund.id,
        companyId: fund.companyId || "",
        fundType: fund.fundType,
        fundName: fund.nameHebrew || "",
        performance: {
          fundId: perf.fundId,
          reportPeriod: perf.reportPeriod,
          totalAssets: perf.totalAssets,
          deposits: perf.deposits,
          withdrawals: perf.withdrawals,
          netMonthlyDeposits: perf.netMonthlyDeposits,
          monthlyYield: perf.monthlyYield,
          yearToDateYield: perf.yearToDateYield,
          yieldTrailing3Yrs: perf.yieldTrailing3Yrs,
          yieldTrailing5Yrs: perf.yieldTrailing5Yrs,
          avgAnnualYield3Yrs: perf.avgAnnualYield3Yrs,
          avgAnnualYield5Yrs: perf.avgAnnualYield5Yrs,
          avgAnnualManagementFee: perf.avgAnnualManagementFee,
          avgDepositFee: perf.avgDepositFee,
          sharpeRatio: perf.sharpeRatio,
          alpha: perf.alpha,
          standardDeviation: perf.standardDeviation,
          actuarialAdjustment: actuarialAdj,
        } as MonthlyPerformance,
        characteristics: mappedChars,
      };
    })
    .filter(Boolean) as FundData[];

  // Build fundDataMap for company score calculation
  const fundDataMap = new Map<string, FundData>();
  for (const fd of fundDataArray) {
    fundDataMap.set(fd.fundId, fd);
  }

  // Calculate scores per category
  const categoryResults = calculateScoresByCategory(fundDataArray);
  const now = new Date().toISOString();
  let totalStored = 0;

  // Store fund scores per category and collect for company scoring
  const scoreByCategoryMap = new Map<ScoringCategory, typeof categoryResults[0]["scores"]>();

  for (const { category, scores } of categoryResults) {
    scoreByCategoryMap.set(category, scores);

    for (let i = 0; i < scores.length; i++) {
      const score = scores[i];
      db.insert(qualityScores)
        .values({
          fundId: score.fundId,
          reportPeriod: reportPeriod,
          scoringCategory: category,
          overallScore: score.overallScore,
          returnScore: score.returnScore,
          feeScore: score.feeScore,
          sizeScore: score.sizeScore,
          actuarialScore: score.actuarialScore,
          serviceScore: score.serviceScore,
          flexibilityScore: score.flexibilityScore,
          claimsScore: score.claimsScore,
          netFlowScore: score.netFlowScore,
          penaltyTotal: score.penaltyTotal,
          rank: i + 1,
          calculatedAt: now,
        })
        .onConflictDoUpdate({
          target: [qualityScores.fundId, qualityScores.reportPeriod, qualityScores.scoringCategory],
          set: {
            overallScore: score.overallScore,
            returnScore: score.returnScore,
            feeScore: score.feeScore,
            sizeScore: score.sizeScore,
            actuarialScore: score.actuarialScore,
            serviceScore: score.serviceScore,
            flexibilityScore: score.flexibilityScore,
            claimsScore: score.claimsScore,
            netFlowScore: score.netFlowScore,
            penaltyTotal: score.penaltyTotal,
            rank: i + 1,
            calculatedAt: now,
          },
        })
        .run();

      totalStored++;
    }

    console.log(`  ${category}: ${scores.length} funds scored`);
  }

  // Calculate and store company scores
  // Per category (all 4 categories)
  function storeCompanyScores(category: string, companyResults: ReturnType<typeof calculateCompanyScores>) {
    companyResults.sort((a, b) => b.overallScore - a.overallScore);
    for (let i = 0; i < companyResults.length; i++) {
      const cs = companyResults[i];
      db.insert(companyScores)
        .values({
          companyId: cs.companyId,
          reportPeriod: reportPeriod,
          scoringCategory: category,
          overallScore: cs.overallScore,
          returnScore: cs.returnScore,
          feeScore: cs.feeScore,
          sizeScore: cs.sizeScore,
          actuarialScore: cs.actuarialScore,
          serviceScore: cs.serviceScore,
          flexibilityScore: cs.flexibilityScore,
          claimsScore: cs.claimsScore,
          netFlowScore: cs.netFlowScore,
          penaltyTotal: cs.penaltyTotal,
          totalAssets: cs.totalAssets,
          fundCount: cs.fundCount,
          rank: i + 1,
          calculatedAt: now,
        })
        .onConflictDoUpdate({
          target: [companyScores.companyId, companyScores.reportPeriod, companyScores.scoringCategory],
          set: {
            overallScore: cs.overallScore,
            returnScore: cs.returnScore,
            feeScore: cs.feeScore,
            sizeScore: cs.sizeScore,
            actuarialScore: cs.actuarialScore,
            serviceScore: cs.serviceScore,
            flexibilityScore: cs.flexibilityScore,
            claimsScore: cs.claimsScore,
            netFlowScore: cs.netFlowScore,
            penaltyTotal: cs.penaltyTotal,
            totalAssets: cs.totalAssets,
            fundCount: cs.fundCount,
            rank: i + 1,
            calculatedAt: now,
          },
        })
        .run();
    }
    console.log(`  Company scores (${category}): ${companyResults.length} companies`);
  }

  // Per-category company scores (all 4 categories)
  for (const category of ALL_SCORING_CATEGORIES) {
    const categoryFundScores = scoreByCategoryMap.get(category);
    if (!categoryFundScores || categoryFundScores.length === 0) continue;
    const companyResults = calculateCompanyScores(categoryFundScores, fundDataMap);
    storeCompanyScores(category, companyResults);
  }

  // Overall company scores (based on regular/non-retiree funds only)
  const regularFundScores = REGULAR_CATEGORIES
    .flatMap((cat) => scoreByCategoryMap.get(cat) ?? []);
  if (regularFundScores.length > 0) {
    const overallCompanyResults = calculateCompanyScores(regularFundScores, fundDataMap);
    storeCompanyScores("overall", overallCompanyResults);
  }

  console.log(`Calculated and stored ${totalStored} fund scores + company scores`);
}
