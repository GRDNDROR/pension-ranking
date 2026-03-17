import { COMPANY_NAME_MAP, FUND_BASE_CATEGORIES } from "@/lib/constants/funds";
import type { CKANRecord } from "@/lib/data-pipeline/fetchers/pension-net";
import type { ScoringCategory } from "@/types/fund";

/**
 * Resolves a Hebrew company name from the CKAN data to a canonical company ID.
 */
export function resolveCompanyId(managingCorporation: string): string | null {
  // Try exact match first
  if (COMPANY_NAME_MAP[managingCorporation]) {
    return COMPANY_NAME_MAP[managingCorporation];
  }

  // Try partial match - check if any known name is contained in the input
  const normalizedInput = managingCorporation.trim();
  for (const [knownName, companyId] of Object.entries(COMPANY_NAME_MAP)) {
    if (normalizedInput.includes(knownName) || knownName.includes(normalizedInput)) {
      return companyId;
    }
  }

  return null;
}

/**
 * Creates a URL-friendly slug from a Hebrew fund name and company.
 */
export function createFundSlug(
  companyId: string,
  externalId: string,
  fundName: string
): string {
  // Use companyId + externalId for guaranteed uniqueness, no Hebrew in URLs
  return `${companyId}-${externalId}`;
}

/**
 * Determines the fund type from the CKAN classification field.
 */
export function classifyFundType(
  classification: string,
  targetPopulation: string,
  fundName?: string
): string {
  const combined =
    `${classification} ${targetPopulation} ${fundName || ""}`;

  // Check fund name for specific keywords first (more reliable)
  if (combined.includes("משלימה")) {
    return "supplementary";
  }
  if (combined.includes("מקיפה")) {
    return "comprehensive_new";
  }
  if (combined.includes("כללית") || combined.includes("קרנות כלליות")) {
    return "general";
  }
  if (combined.includes("קרנות חדשות")) {
    return "comprehensive_new";
  }
  return "other";
}

/**
 * Detects if a fund is targeted at pension recipients (מקבלי קצבה)
 * based on keywords in the fund name.
 */
export function isRetireeFund(fundName: string): boolean {
  return fundName.includes("קצבה");
}

/**
 * Gets the scoring category for a fund based on its type and name.
 * Retiree funds are separated into their own categories.
 */
export function getScoringCategory(fundType: string, fundName: string): ScoringCategory {
  const baseCategory = FUND_BASE_CATEGORIES[fundType] ?? "non_comprehensive";
  const retiree = isRetireeFund(fundName);

  if (baseCategory === "comprehensive") {
    return retiree ? "comprehensive_retiree" : "comprehensive";
  }
  return retiree ? "non_comprehensive_retiree" : "non_comprehensive";
}

/**
 * Normalizes a CKAN record into our internal format.
 */
export function normalizeCKANRecord(record: CKANRecord) {
  const companyId = resolveCompanyId(record.MANAGING_CORPORATION);

  // Handle schema differences between historical (2011-2023) and current (2024+) resources
  const withdrawals = record.WITHDRAWALS ?? record.WITHDRAWLS ?? null;
  const yearToDateYield = record.YEAR_BEGINNING_YIELD ?? record.YEAR_TO_DATE_YIELD ?? null;
  const actuarialAdjustment = record.ACTUARIAL_ADJUSTMENT ?? null;

  return {
    externalId: String(record.FUND_ID),
    companyId,
    fundNameHebrew: record.FUND_NAME?.trim() || "",
    managingCorporation: record.MANAGING_CORPORATION?.trim() || "",
    fundType: classifyFundType(
      record.FUND_CLASSIFICATION || "",
      record.TARGET_POPULATION || "",
      record.FUND_NAME || ""
    ),
    classification: record.FUND_CLASSIFICATION?.trim() || "",
    reportPeriod: record.REPORT_PERIOD,
    totalAssets: record.TOTAL_ASSETS,
    deposits: record.DEPOSITS,
    withdrawals,
    netMonthlyDeposits: record.NET_MONTHLY_DEPOSITS,
    monthlyYield: record.MONTHLY_YIELD,
    yearToDateYield,
    yieldTrailing3Yrs: record.YIELD_TRAILING_3_YRS,
    yieldTrailing5Yrs: record.YIELD_TRAILING_5_YRS,
    avgAnnualYield3Yrs: record.AVG_ANNUAL_YIELD_TRAILING_3YRS,
    avgAnnualYield5Yrs: record.AVG_ANNUAL_YIELD_TRAILING_5YRS,
    avgAnnualManagementFee: record.AVG_ANNUAL_MANAGEMENT_FEE,
    avgDepositFee: record.AVG_DEPOSIT_FEE,
    sharpeRatio: record.SHARPE_RATIO,
    alpha: record.ALPHA,
    standardDeviation: record.STANDARD_DEVIATION,
    actuarialAdjustment,
    liquidAssetsPercent: record.LIQUID_ASSETS_PERCENT,
    // CKAN returns exposure values in basis points (0-10000), convert to percent (0-100)
    stockMarketExposure: record.STOCK_MARKET_EXPOSURE != null ? record.STOCK_MARKET_EXPOSURE / 100 : null,
    foreignExposure: record.FOREIGN_EXPOSURE != null ? record.FOREIGN_EXPOSURE / 100 : null,
    foreignCurrencyExposure: record.FOREIGN_CURRENCY_EXPOSURE != null ? record.FOREIGN_CURRENCY_EXPOSURE / 100 : null,
  };
}
