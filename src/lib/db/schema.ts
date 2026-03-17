import { sqliteTable, text, integer, real, unique } from "drizzle-orm/sqlite-core";

export const managementCompanies = sqliteTable("management_companies", {
  id: text("id").primaryKey(),
  nameHebrew: text("name_hebrew").notNull(),
  nameEnglish: text("name_english"),
  websiteUrl: text("website_url"),
});

export const pensionFunds = sqliteTable("pension_funds", {
  id: text("id").primaryKey(),
  externalId: text("external_id"),
  companyId: text("company_id").references(() => managementCompanies.id),
  nameHebrew: text("name_hebrew").notNull(),
  fundType: text("fund_type").notNull(),
  classification: text("classification"),
  slug: text("slug").unique().notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
});

export const monthlyPerformance = sqliteTable(
  "monthly_performance",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fundId: text("fund_id")
      .references(() => pensionFunds.id)
      .notNull(),
    reportPeriod: integer("report_period").notNull(),
    totalAssets: real("total_assets"),
    deposits: real("deposits"),
    withdrawals: real("withdrawals"),
    netMonthlyDeposits: real("net_monthly_deposits"),
    monthlyYield: real("monthly_yield"),
    yearToDateYield: real("year_to_date_yield"),
    yieldTrailing3Yrs: real("yield_trailing_3_yrs"),
    yieldTrailing5Yrs: real("yield_trailing_5_yrs"),
    avgAnnualYield3Yrs: real("avg_annual_yield_3_yrs"),
    avgAnnualYield5Yrs: real("avg_annual_yield_5_yrs"),
    avgAnnualManagementFee: real("avg_annual_management_fee"),
    avgDepositFee: real("avg_deposit_fee"),
    sharpeRatio: real("sharpe_ratio"),
    alpha: real("alpha"),
    standardDeviation: real("standard_deviation"),
    liquidAssetsPercent: real("liquid_assets_percent"),
    stockMarketExposure: real("stock_market_exposure"),
    foreignExposure: real("foreign_exposure"),
    foreignCurrencyExposure: real("foreign_currency_exposure"),
    actuarialAdjustment: real("actuarial_adjustment"),
    fetchedAt: text("fetched_at").notNull(),
  },
  (table) => [unique().on(table.fundId, table.reportPeriod)]
);

export const fundCharacteristics = sqliteTable("fund_characteristics", {
  fundId: text("fund_id")
    .references(() => pensionFunds.id)
    .primaryKey(),
  acceptsWithoutHealthDeclaration: integer(
    "accepts_without_health_declaration",
    { mode: "boolean" }
  ),
  trackFlexibility: text("track_flexibility"),
  numberOfTagmulimTracks: integer("num_tagmulim_tracks"),
  numberOfPitzuyimTracks: integer("num_pitzuyim_tracks"),
  serviceQualityScore: real("service_quality_score"),
  claimsApprovalRate: real("claims_approval_rate"),
  publicComplaintsRate: real("public_complaints_rate"),
  updatedAt: text("updated_at").notNull(),
});

export const qualityScores = sqliteTable(
  "quality_scores",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fundId: text("fund_id")
      .references(() => pensionFunds.id)
      .notNull(),
    reportPeriod: integer("report_period").notNull(),
    scoringCategory: text("scoring_category").notNull(), // "comprehensive" | "non_comprehensive"
    overallScore: real("overall_score").notNull(),
    returnScore: real("return_score"),
    feeScore: real("fee_score"),
    sizeScore: real("size_score"),
    actuarialScore: real("actuarial_score"),
    serviceScore: real("service_score"),
    flexibilityScore: real("flexibility_score"),
    claimsScore: real("claims_score"),
    netFlowScore: real("net_flow_score"),
    penaltyTotal: real("penalty_total"),
    rank: integer("rank"),
    calculatedAt: text("calculated_at").notNull(),
  },
  (table) => [unique().on(table.fundId, table.reportPeriod, table.scoringCategory)]
);

export const companyScores = sqliteTable(
  "company_scores",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id")
      .references(() => managementCompanies.id)
      .notNull(),
    reportPeriod: integer("report_period").notNull(),
    scoringCategory: text("scoring_category").notNull(), // "comprehensive" | "non_comprehensive" | "overall"
    overallScore: real("overall_score").notNull(),
    returnScore: real("return_score"),
    feeScore: real("fee_score"),
    sizeScore: real("size_score"),
    actuarialScore: real("actuarial_score"),
    serviceScore: real("service_score"),
    flexibilityScore: real("flexibility_score"),
    claimsScore: real("claims_score"),
    netFlowScore: real("net_flow_score"),
    penaltyTotal: real("penalty_total"),
    totalAssets: real("total_assets"),
    fundCount: integer("fund_count"),
    rank: integer("rank"),
    calculatedAt: text("calculated_at").notNull(),
  },
  (table) => [unique().on(table.companyId, table.reportPeriod, table.scoringCategory)]
);

export const fundLongTermReturns = sqliteTable(
  "fund_long_term_returns",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fundId: text("fund_id")
      .references(() => pensionFunds.id)
      .notNull(),
    annualizedReturn10Yr: real("annualized_return_10yr"),
    annualizedReturn20Yr: real("annualized_return_20yr"),
    totalReturn10Yr: real("total_return_10yr"),
    totalReturn20Yr: real("total_return_20yr"),
    monthsAvailable: integer("months_available").notNull(),
    calculatedAt: text("calculated_at").notNull(),
  },
  (table) => [unique().on(table.fundId)]
);

export const dataRefreshLog = sqliteTable("data_refresh_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull(),
  status: text("status").notNull(),
  recordsProcessed: integer("records_processed"),
  latestPeriod: integer("latest_period"),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  errorMessage: text("error_message"),
});
