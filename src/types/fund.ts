export type ScoringCategory =
  | "comprehensive"
  | "non_comprehensive"
  | "comprehensive_retiree"
  | "non_comprehensive_retiree";

export interface ManagementCompany {
  id: string;
  nameHebrew: string;
  nameEnglish?: string;
  websiteUrl?: string;
}

export interface PensionFund {
  id: string;
  externalId?: string;
  companyId: string;
  nameHebrew: string;
  fundType: string;
  classification?: string;
  slug: string;
  isActive: boolean;
}

export interface MonthlyPerformance {
  fundId: string;
  reportPeriod: number;
  totalAssets: number | null;
  deposits: number | null;
  withdrawals: number | null;
  netMonthlyDeposits: number | null;
  monthlyYield: number | null;
  yearToDateYield: number | null;
  yieldTrailing3Yrs: number | null;
  yieldTrailing5Yrs: number | null;
  avgAnnualYield3Yrs: number | null;
  avgAnnualYield5Yrs: number | null;
  avgAnnualManagementFee: number | null;
  avgDepositFee: number | null;
  sharpeRatio: number | null;
  alpha: number | null;
  standardDeviation: number | null;
  actuarialAdjustment: number | null;
}

export interface FundCharacteristics {
  fundId: string;
  acceptsWithoutHealthDeclaration: boolean;
  trackFlexibility: "full" | "limited" | "none";
  numberOfTagmulimTracks: number;
  numberOfPitzuyimTracks: number;
  serviceQualityScore: number | null;
  claimsApprovalRate: number | null;
  publicComplaintsRate: number | null;
}

export interface QualityScore {
  fundId: string;
  reportPeriod: number;
  scoringCategory: ScoringCategory;
  overallScore: number;
  returnScore: number | null;
  feeScore: number | null;
  sizeScore: number | null;
  actuarialScore: number | null;
  serviceScore: number | null;
  flexibilityScore: number | null;
  claimsScore: number | null;
  netFlowScore: number | null;
  penaltyTotal: number | null;
  rank: number | null;
}

export interface CompanyScore {
  companyId: string;
  reportPeriod: number;
  scoringCategory: ScoringCategory | "overall";
  overallScore: number;
  returnScore: number | null;
  feeScore: number | null;
  sizeScore: number | null;
  actuarialScore: number | null;
  serviceScore: number | null;
  flexibilityScore: number | null;
  claimsScore: number | null;
  netFlowScore: number | null;
  penaltyTotal: number | null;
  totalAssets: number | null;
  fundCount: number;
  rank: number | null;
}

export interface FundRankingRow {
  fund: PensionFund;
  company: ManagementCompany;
  performance: MonthlyPerformance;
  score: QualityScore;
  characteristics?: FundCharacteristics;
}

export interface CompanyRankingRow {
  company: ManagementCompany;
  score: CompanyScore;
}
