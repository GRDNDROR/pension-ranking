import { db } from "@/lib/db";
import {
  pensionFunds,
  managementCompanies,
  monthlyPerformance,
  qualityScores,
  companyScores,
  fundCharacteristics,
  fundLongTermReturns,
  dataRefreshLog,
} from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import type { ScoringCategory } from "@/types/fund";

/**
 * Gets the latest report period that has scores.
 */
export function getLatestScoredPeriod(): number | null {
  const result = db
    .select({ period: qualityScores.reportPeriod })
    .from(qualityScores)
    .orderBy(desc(qualityScores.reportPeriod))
    .limit(1)
    .get();
  return result?.period ?? null;
}

/**
 * Gets all fund rankings for a given period and optional category, ordered by rank.
 */
export function getFundRankings(
  reportPeriod: number,
  category?: ScoringCategory
) {
  const conditions = [eq(qualityScores.reportPeriod, reportPeriod)];
  if (category) {
    conditions.push(eq(qualityScores.scoringCategory, category));
  }

  return db
    .select({
      fund: pensionFunds,
      company: managementCompanies,
      performance: monthlyPerformance,
      score: qualityScores,
    })
    .from(qualityScores)
    .innerJoin(pensionFunds, eq(qualityScores.fundId, pensionFunds.id))
    .innerJoin(
      managementCompanies,
      eq(pensionFunds.companyId, managementCompanies.id)
    )
    .innerJoin(
      monthlyPerformance,
      and(
        eq(monthlyPerformance.fundId, pensionFunds.id),
        eq(monthlyPerformance.reportPeriod, qualityScores.reportPeriod)
      )
    )
    .where(and(...conditions))
    .orderBy(qualityScores.rank)
    .all();
}

/**
 * Gets company rankings for a given period and category.
 */
export function getCompanyRankings(
  reportPeriod: number,
  category: ScoringCategory | "overall" = "overall"
) {
  return db
    .select({
      company: managementCompanies,
      score: companyScores,
    })
    .from(companyScores)
    .innerJoin(
      managementCompanies,
      eq(companyScores.companyId, managementCompanies.id)
    )
    .where(
      and(
        eq(companyScores.reportPeriod, reportPeriod),
        eq(companyScores.scoringCategory, category)
      )
    )
    .orderBy(companyScores.rank)
    .all();
}

/**
 * Gets a company by ID with all its scores for the latest period.
 */
export function getCompanyById(companyId: string) {
  const company = db
    .select()
    .from(managementCompanies)
    .where(eq(managementCompanies.id, companyId))
    .get();

  if (!company) return null;

  const latestPeriod = getLatestScoredPeriod();
  if (!latestPeriod) return null;

  const scores = db
    .select()
    .from(companyScores)
    .where(
      and(
        eq(companyScores.companyId, companyId),
        eq(companyScores.reportPeriod, latestPeriod)
      )
    )
    .all();

  const scoreMap: Record<string, typeof scores[0]> = {};
  for (const s of scores) {
    scoreMap[s.scoringCategory] = s;
  }

  return { company, scores: scoreMap, reportPeriod: latestPeriod };
}

/**
 * Gets all funds for a company in a given period with scores, optionally filtered by category.
 */
export function getCompanyFunds(
  companyId: string,
  reportPeriod: number,
  category?: ScoringCategory
) {
  const conditions = [
    eq(pensionFunds.companyId, companyId),
    eq(qualityScores.reportPeriod, reportPeriod),
  ];
  if (category) {
    conditions.push(eq(qualityScores.scoringCategory, category));
  }

  return db
    .select({
      fund: pensionFunds,
      performance: monthlyPerformance,
      score: qualityScores,
    })
    .from(qualityScores)
    .innerJoin(pensionFunds, eq(qualityScores.fundId, pensionFunds.id))
    .innerJoin(
      monthlyPerformance,
      and(
        eq(monthlyPerformance.fundId, pensionFunds.id),
        eq(monthlyPerformance.reportPeriod, qualityScores.reportPeriod)
      )
    )
    .where(and(...conditions))
    .orderBy(qualityScores.rank)
    .all();
}

/**
 * Gets all fund data needed for the portfolio builder (client-side).
 */
export function getPortfolioBuilderData(reportPeriod: number) {
  return db
    .select({
      fund: pensionFunds,
      company: managementCompanies,
      performance: monthlyPerformance,
      score: qualityScores,
    })
    .from(qualityScores)
    .innerJoin(pensionFunds, eq(qualityScores.fundId, pensionFunds.id))
    .innerJoin(
      managementCompanies,
      eq(pensionFunds.companyId, managementCompanies.id)
    )
    .innerJoin(
      monthlyPerformance,
      and(
        eq(monthlyPerformance.fundId, pensionFunds.id),
        eq(monthlyPerformance.reportPeriod, qualityScores.reportPeriod)
      )
    )
    .where(eq(qualityScores.reportPeriod, reportPeriod))
    .orderBy(qualityScores.rank)
    .all();
}

/**
 * Gets market averages per category for comparison in portfolio builder.
 */
export function getMarketAverages(reportPeriod: number) {
  const results = db
    .select({
      scoringCategory: qualityScores.scoringCategory,
      avgScore: sql<number>`avg(${qualityScores.overallScore})`,
      avgReturnScore: sql<number>`avg(${qualityScores.returnScore})`,
      avgFeeScore: sql<number>`avg(${qualityScores.feeScore})`,
      avgReturn5yr: sql<number>`avg(${monthlyPerformance.avgAnnualYield5Yrs})`,
      avgReturn3yr: sql<number>`avg(${monthlyPerformance.avgAnnualYield3Yrs})`,
      avgFee: sql<number>`avg(${monthlyPerformance.avgAnnualManagementFee})`,
      fundCount: sql<number>`count(*)`,
    })
    .from(qualityScores)
    .innerJoin(
      monthlyPerformance,
      and(
        eq(monthlyPerformance.fundId, qualityScores.fundId),
        eq(monthlyPerformance.reportPeriod, qualityScores.reportPeriod)
      )
    )
    .where(eq(qualityScores.reportPeriod, reportPeriod))
    .groupBy(qualityScores.scoringCategory)
    .all();

  return results;
}

/**
 * Gets the last successful data refresh info.
 */
export function getLastRefreshInfo() {
  return db
    .select()
    .from(dataRefreshLog)
    .where(eq(dataRefreshLog.status, "success"))
    .orderBy(desc(dataRefreshLog.completedAt))
    .limit(1)
    .get();
}

/**
 * Gets fund characteristics for a specific fund.
 */
export function getFundCharacteristics(fundId: string) {
  return db
    .select()
    .from(fundCharacteristics)
    .where(eq(fundCharacteristics.fundId, fundId))
    .get();
}

/**
 * Gets a single fund by slug with all data.
 */
export function getFundBySlug(slug: string) {
  const fund = db
    .select()
    .from(pensionFunds)
    .where(eq(pensionFunds.slug, slug))
    .get();

  if (!fund) return null;

  const company = fund.companyId
    ? db
        .select()
        .from(managementCompanies)
        .where(eq(managementCompanies.id, fund.companyId))
        .get()
    : null;

  const latestPeriod = getLatestScoredPeriod();
  if (!latestPeriod) return null;

  const performance = db
    .select()
    .from(monthlyPerformance)
    .where(
      and(
        eq(monthlyPerformance.fundId, fund.id),
        eq(monthlyPerformance.reportPeriod, latestPeriod)
      )
    )
    .get();

  const score = db
    .select()
    .from(qualityScores)
    .where(
      and(
        eq(qualityScores.fundId, fund.id),
        eq(qualityScores.reportPeriod, latestPeriod)
      )
    )
    .get();

  const chars = getFundCharacteristics(fund.id);
  const longTermReturns = db
    .select()
    .from(fundLongTermReturns)
    .where(eq(fundLongTermReturns.fundId, fund.id))
    .get();

  return { fund, company, performance, score, characteristics: chars, longTermReturns };
}

/**
 * Gets performance history for a fund.
 */
export function getFundPerformanceHistory(fundId: string) {
  return db
    .select()
    .from(monthlyPerformance)
    .where(eq(monthlyPerformance.fundId, fundId))
    .orderBy(monthlyPerformance.reportPeriod)
    .all();
}
