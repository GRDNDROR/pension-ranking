import { db } from "@/lib/db";
import {
  monthlyPerformance,
  pensionFunds,
  fundLongTermReturns,
} from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { fetchPensionNetData } from "./pension-net";
import { normalizeCKANRecord, resolveCompanyId, createFundSlug, classifyFundType } from "../normalizers/fund-mapper";
import { PENSION_NET_ALL_RESOURCES } from "@/lib/constants/data-sources";

/**
 * Fetches ALL historical data from all CKAN pension-net resources (2011-present).
 * Three resources: 2011-2022 (~19k records), 2023 (~3k records), 2024+ (~7k records).
 * Creates missing funds and stores performance data. Existing records are skipped.
 */
export async function fetchFullHistoricalData() {
  console.log("Fetching full historical data from all CKAN resources...");

  let totalStored = 0;
  let totalFetched = 0;
  const existingFundIds = new Set(
    db.select({ id: pensionFunds.id }).from(pensionFunds).all().map((f) => f.id)
  );

  for (const resource of PENSION_NET_ALL_RESOURCES) {
    console.log(`  Fetching from ${resource.label} (${resource.id})...`);

    const records = await fetchPensionNetData({
      resourceId: resource.id,
      maxRecords: 25000, // enough for any single resource
    });
    console.log(`  Fetched ${records.length} records from ${resource.label}`);
    totalFetched += records.length;

    let stored = 0;
    const now = new Date().toISOString();

    for (const record of records) {
      const normalized = normalizeCKANRecord(record);
      if (!normalized.companyId) continue;

      const fundKey = `${normalized.companyId}-${normalized.externalId}`;

      // Auto-create fund if it doesn't exist yet (historical funds)
      if (!existingFundIds.has(fundKey)) {
        const slug = createFundSlug(
          normalized.companyId,
          normalized.externalId,
          normalized.fundNameHebrew
        );
        db.insert(pensionFunds)
          .values({
            id: fundKey,
            externalId: normalized.externalId,
            companyId: normalized.companyId,
            nameHebrew: normalized.fundNameHebrew,
            fundType: normalized.fundType,
            classification: normalized.classification,
            slug,
            isActive: true,
          })
          .onConflictDoNothing()
          .run();
        existingFundIds.add(fundKey);
      }

      const result = db
        .insert(monthlyPerformance)
        .values({
          fundId: fundKey,
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

      if (result.changes > 0) stored++;
    }

    totalStored += stored;
    console.log(`  Stored ${stored} new records from ${resource.label}`);
  }

  console.log(`Total: fetched ${totalFetched} records, stored ${totalStored} new records`);
  return totalStored;
}

/**
 * Calculates long-term compound annual returns from stored monthly data.
 * For each fund, compounds all available monthly yields to get annualized returns.
 */
export function calculateLongTermReturns() {
  console.log("Calculating long-term returns...");

  const allFunds = db.select().from(pensionFunds).all();
  const now = new Date().toISOString();
  let calculated = 0;

  for (const fund of allFunds) {
    // Get all monthly performance data for this fund, ordered chronologically
    const history = db
      .select({
        reportPeriod: monthlyPerformance.reportPeriod,
        monthlyYield: monthlyPerformance.monthlyYield,
      })
      .from(monthlyPerformance)
      .where(eq(monthlyPerformance.fundId, fund.id))
      .orderBy(asc(monthlyPerformance.reportPeriod))
      .all();

    if (history.length < 12) continue; // Need at least 1 year of data

    // Filter only records with valid monthly yields
    const validHistory = history.filter(
      (h) => h.monthlyYield !== null && h.monthlyYield !== undefined
    );

    if (validHistory.length < 12) continue;

    const monthsAvailable = validHistory.length;

    // Calculate compound return from monthly yields
    // monthly yield is in percent (e.g., 1.5 means 1.5%)
    let compoundReturn = 1;
    for (const h of validHistory) {
      compoundReturn *= 1 + h.monthlyYield! / 100;
    }
    const totalReturn = (compoundReturn - 1) * 100; // back to percent

    // Annualize
    const years = monthsAvailable / 12;
    const annualizedReturn =
      (Math.pow(compoundReturn, 1 / years) - 1) * 100;

    // Calculate 10yr and 20yr returns if enough data
    let annualized10Yr: number | null = null;
    let total10Yr: number | null = null;
    let annualized20Yr: number | null = null;
    let total20Yr: number | null = null;

    if (monthsAvailable >= 120) {
      // 10 years
      const last120 = validHistory.slice(-120);
      let compound10 = 1;
      for (const h of last120) {
        compound10 *= 1 + h.monthlyYield! / 100;
      }
      total10Yr = (compound10 - 1) * 100;
      annualized10Yr = (Math.pow(compound10, 1 / 10) - 1) * 100;
    }

    if (monthsAvailable >= 240) {
      // 20 years
      const last240 = validHistory.slice(-240);
      let compound20 = 1;
      for (const h of last240) {
        compound20 *= 1 + h.monthlyYield! / 100;
      }
      total20Yr = (compound20 - 1) * 100;
      annualized20Yr = (Math.pow(compound20, 1 / 20) - 1) * 100;
    }

    db.insert(fundLongTermReturns)
      .values({
        fundId: fund.id,
        annualizedReturn10Yr: annualized10Yr,
        annualizedReturn20Yr: annualized20Yr,
        totalReturn10Yr: total10Yr,
        totalReturn20Yr: total20Yr,
        monthsAvailable,
        calculatedAt: now,
      })
      .onConflictDoUpdate({
        target: fundLongTermReturns.fundId,
        set: {
          annualizedReturn10Yr: annualized10Yr,
          annualizedReturn20Yr: annualized20Yr,
          totalReturn10Yr: total10Yr,
          totalReturn20Yr: total20Yr,
          monthsAvailable,
          calculatedAt: now,
        },
      })
      .run();

    calculated++;
  }

  console.log(
    `Calculated long-term returns for ${calculated} funds`
  );
  return calculated;
}
