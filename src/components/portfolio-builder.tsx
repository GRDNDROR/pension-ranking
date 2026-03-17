"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getScoreColor, getScoreBg, getScoreLabel } from "@/lib/score-display";

// Types
interface FundTrack {
  fundId: string;
  fundName: string;
  fundType: string;
  companyId: string;
  companyName: string;
  scoringCategory: string;
  overallScore: number;
  returnScore: number | null;
  actuarialScore: number | null;
  sizeScore: number | null;
  serviceScore: number | null;
  claimsScore: number | null;
  avgAnnualYield5Yrs: number | null;
  avgAnnualYield3Yrs: number | null;
  yearToDateYield: number | null;
  totalAssets: number | null;
  rank: number | null;
}

interface CompanyCategoryScore {
  companyId: string;
  companyName: string;
  scoringCategory: string;
  overallScore: number;
  returnScore: number | null;
  actuarialScore: number | null;
  serviceScore: number | null;
  rank: number | null;
  fundCount: number | null;
}

interface MarketAverage {
  scoringCategory: string;
  avgScore: number;
  avgReturnScore: number;
  avgReturn5yr: number;
  avgReturn3yr: number;
  fundCount: number;
}

interface PortfolioBuilderProps {
  funds: FundTrack[];
  marketAverages: MarketAverage[];
  companies: Array<{ id: string; name: string }>;
  companyScoresByCategory: CompanyCategoryScore[];
}

type Lifecycle = "pre-retirement" | "post-retirement";
type ScoringCategory = "comprehensive" | "non_comprehensive" | "comprehensive_retiree" | "non_comprehensive_retiree";
type Step = "lifecycle" | "fund-type" | "company" | "results";

const LIFECYCLE_TO_CATEGORIES: Record<Lifecycle, ScoringCategory[]> = {
  "pre-retirement": ["comprehensive", "non_comprehensive"],
  "post-retirement": ["comprehensive_retiree", "non_comprehensive_retiree"],
};

const CATEGORY_LABELS: Record<ScoringCategory, { title: string; desc: string }> = {
  comprehensive: {
    title: "מקיפה",
    desc: "קרן הפנסיה העיקרית - כוללת מנגנון תשואה מובטחת, ביטוח נכות ושאירים",
  },
  non_comprehensive: {
    title: "כללית / משלימה",
    desc: "קרן פנסיה משלימה - ללא מנגנון תשואה מובטחת, לצבירה נוספת",
  },
  comprehensive_retiree: {
    title: "מקיפה - מקבלי קצבה",
    desc: "מסלולי השקעה לפנסיונרים בקרן מקיפה",
  },
  non_comprehensive_retiree: {
    title: "כללית / משלימה - מקבלי קצבה",
    desc: "מסלולי השקעה לפנסיונרים בקרן כללית או משלימה",
  },
};

const STEPS: { key: Step; label: string }[] = [
  { key: "lifecycle", label: "שלב חיים" },
  { key: "fund-type", label: "סוג קרן" },
  { key: "company", label: "חברה" },
  { key: "results", label: "תוצאות" },
];

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return "-";
  return `${value.toFixed(2)}%`;
}

export function PortfolioBuilder({
  funds,
  marketAverages,
  companies,
  companyScoresByCategory,
}: PortfolioBuilderProps) {
  const [lifecycle, setLifecycle] = useState<Lifecycle | null>(null);
  const [fundType, setFundType] = useState<ScoringCategory | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [selectedFundId, setSelectedFundId] = useState<string | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showCrossCompany, setShowCrossCompany] = useState(false);

  const currentStep: Step = !lifecycle
    ? "lifecycle"
    : !fundType
    ? "fund-type"
    : !companyId
    ? "company"
    : "results";

  // Companies available for the selected category
  const availableCompanies = useMemo(() => {
    if (!fundType) return [];
    const companyIds = new Set(
      funds.filter((f) => f.scoringCategory === fundType).map((f) => f.companyId)
    );
    // Get company scores for this category
    const scoreMap = new Map<string, CompanyCategoryScore>();
    for (const cs of companyScoresByCategory) {
      if (cs.scoringCategory === fundType) {
        scoreMap.set(cs.companyId, cs);
      }
    }
    return companies
      .filter((c) => companyIds.has(c.id))
      .map((c) => ({
        ...c,
        categoryScore: scoreMap.get(c.id) ?? null,
      }))
      .sort((a, b) => {
        const aScore = a.categoryScore?.overallScore ?? 0;
        const bScore = b.categoryScore?.overallScore ?? 0;
        return bScore - aScore;
      });
  }, [funds, fundType, companies, companyScoresByCategory]);

  // Funds for selected company + category
  const companyFunds = useMemo(() => {
    if (!companyId || !fundType) return [];
    return funds
      .filter((f) => f.companyId === companyId && f.scoringCategory === fundType)
      .sort((a, b) => b.overallScore - a.overallScore);
  }, [funds, companyId, fundType]);

  // The recommended (best) fund
  const recommendedFund = useMemo(() => {
    if (selectedFundId) {
      return companyFunds.find((f) => f.fundId === selectedFundId) ?? companyFunds[0] ?? null;
    }
    return companyFunds[0] ?? null;
  }, [companyFunds, selectedFundId]);

  // Alternative funds from same company
  const alternativeFunds = useMemo(() => {
    if (!recommendedFund) return [];
    return companyFunds.filter((f) => f.fundId !== recommendedFund.fundId);
  }, [companyFunds, recommendedFund]);

  // Top fund per other company (cross-company comparison)
  const topFundPerCompany = useMemo(() => {
    if (!fundType || !companyId) return [];
    const otherFunds = funds.filter(
      (f) => f.scoringCategory === fundType && f.companyId !== companyId
    );
    const best = new Map<string, FundTrack>();
    for (const f of otherFunds) {
      const existing = best.get(f.companyId);
      if (!existing || f.overallScore > existing.overallScore) {
        best.set(f.companyId, f);
      }
    }
    return Array.from(best.values()).sort((a, b) => b.overallScore - a.overallScore);
  }, [funds, fundType, companyId]);

  // Market average for this category
  const categoryAverage = useMemo(() => {
    if (!fundType) return null;
    return marketAverages.find((m) => m.scoringCategory === fundType) ?? null;
  }, [marketAverages, fundType]);

  function handleStepClick(step: Step) {
    switch (step) {
      case "lifecycle":
        setLifecycle(null);
        setFundType(null);
        setCompanyId(null);
        setSelectedFundId(null);
        break;
      case "fund-type":
        if (lifecycle) {
          setFundType(null);
          setCompanyId(null);
          setSelectedFundId(null);
        }
        break;
      case "company":
        if (fundType) {
          setCompanyId(null);
          setSelectedFundId(null);
        }
        break;
    }
  }

  function handleLifecycleSelect(lc: Lifecycle) {
    setLifecycle(lc);
    setFundType(null);
    setCompanyId(null);
    setSelectedFundId(null);
  }

  function handleFundTypeSelect(cat: ScoringCategory) {
    setFundType(cat);
    setCompanyId(null);
    setSelectedFundId(null);
  }

  function handleCompanySelect(id: string) {
    setCompanyId(id);
    setSelectedFundId(null);
    setShowAlternatives(false);
    setShowCrossCompany(false);
  }

  function handleShowBest() {
    // Find the best fund across all companies for this category
    if (!fundType) return;
    const allCatFunds = funds
      .filter((f) => f.scoringCategory === fundType)
      .sort((a, b) => b.overallScore - a.overallScore);
    if (allCatFunds.length > 0) {
      setCompanyId(allCatFunds[0].companyId);
      setSelectedFundId(allCatFunds[0].fundId);
    }
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <WizardStepper
        currentStep={currentStep}
        lifecycle={lifecycle}
        fundType={fundType}
        companyId={companyId}
        companies={companies}
        onStepClick={handleStepClick}
      />

      {/* Step 1: Lifecycle */}
      {currentStep === "lifecycle" && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">באיזה שלב אתם?</h3>
          <p className="text-muted-foreground text-sm">בחרו את השלב שמתאים לכם כדי שנציג את המסלולים הרלוונטיים</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LifecycleCard
              title="לפני פרישה"
              description="חוסכים שצוברים כספים בקרן הפנסיה"
              icon="💼"
              onClick={() => handleLifecycleSelect("pre-retirement")}
            />
            <LifecycleCard
              title="אחרי פרישה"
              description="מקבלי קצבה חודשית מקרן הפנסיה"
              icon="🏖️"
              onClick={() => handleLifecycleSelect("post-retirement")}
            />
          </div>
        </div>
      )}

      {/* Step 2: Fund Type */}
      {currentStep === "fund-type" && lifecycle && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">איזה סוג קרן?</h3>
          <p className="text-muted-foreground text-sm">בחרו את סוג הקרן שמתאים לכם</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LIFECYCLE_TO_CATEGORIES[lifecycle].map((cat) => {
              const info = CATEGORY_LABELS[cat];
              const catFundCount = funds.filter((f) => f.scoringCategory === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => handleFundTypeSelect(cat)}
                  className="text-start rounded-xl border-2 border-border/60 bg-card hover:border-primary/50 hover:shadow-lg transition-all p-6 group"
                >
                  <h4 className="text-lg font-bold group-hover:text-primary transition-colors">
                    {info.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {info.desc}
                  </p>
                  <span className="inline-block mt-3 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {catFundCount} מסלולים
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Company */}
      {currentStep === "company" && fundType && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-xl font-bold">בחרו חברת פנסיה</h3>
              <p className="text-muted-foreground text-sm">
                החברות ממוינות לפי הציון שלהן ב{CATEGORY_LABELS[fundType].title}
              </p>
            </div>
            <button
              onClick={handleShowBest}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              הראו לי את הכי טוב ←
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableCompanies.map((company, idx) => {
              const cs = company.categoryScore;
              const score = cs?.overallScore ?? 0;
              return (
                <button
                  key={company.id}
                  onClick={() => handleCompanySelect(company.id)}
                  className="text-start rounded-xl border-2 border-border/60 bg-card hover:border-primary/50 hover:shadow-lg transition-all p-4 group relative overflow-hidden"
                >
                  {idx < 3 && (
                    <span className="absolute top-2 left-2 text-lg">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold group-hover:text-primary transition-colors">
                        {company.name}
                      </h4>
                      {cs && (
                        <span className="text-xs text-muted-foreground">
                          {cs.fundCount ?? 0} מסלולים
                        </span>
                      )}
                    </div>
                    {cs && (
                      <div className="flex flex-col items-center shrink-0">
                        <span className={cn("text-2xl font-black tabular-nums", getScoreColor(score))}>
                          {Math.round(score)}
                        </span>
                        <span className={cn("text-[10px]", getScoreColor(score))}>
                          {getScoreLabel(score)}
                        </span>
                      </div>
                    )}
                  </div>
                  {cs && (
                    <div className="mt-3 space-y-1">
                      <MiniScoreBar label="תשואות" score={cs.returnScore ?? 50} />
                      <MiniScoreBar label="אקטוארי" score={cs.actuarialScore ?? 50} />
                      <MiniScoreBar label="שירות" score={cs.serviceScore ?? 50} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {currentStep === "results" && recommendedFund && (
        <div className="space-y-6">
          {/* Hero: Recommended Fund */}
          <div className="rounded-xl border-2 border-primary/20 bg-card p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                המסלול המומלץ
              </span>
              {recommendedFund.rank && (
                <span className="text-xs text-muted-foreground">
                  מדורג #{recommendedFund.rank} ב{CATEGORY_LABELS[fundType!].title}
                </span>
              )}
            </div>

            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-bold">{recommendedFund.fundName}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {companies.find((c) => c.id === companyId)?.name}
                </p>
              </div>
              <div className="flex flex-col items-center shrink-0">
                <div className={cn("text-4xl font-black tabular-nums", getScoreColor(recommendedFund.overallScore))}>
                  {Math.round(recommendedFund.overallScore)}
                </div>
                <span className={cn("text-sm font-medium", getScoreColor(recommendedFund.overallScore))}>
                  {getScoreLabel(recommendedFund.overallScore)}
                </span>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
              <ScoreBar score={recommendedFund.returnScore ?? 50} label="תשואות" weight="35%" />
              <ScoreBar score={recommendedFund.actuarialScore ?? 50} label="אקטוארי" weight="25%" />
              <ScoreBar score={recommendedFund.serviceScore ?? 50} label="שירות" weight="15%" />
              <ScoreBar score={recommendedFund.claimsScore ?? 50} label="תביעות" weight="10%" />
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-border/50">
              <MetricCard label="תשואה 5 שנים" value={formatPercent(recommendedFund.avgAnnualYield5Yrs)} />
              <MetricCard label="תשואה 3 שנים" value={formatPercent(recommendedFund.avgAnnualYield3Yrs)} />
              <MetricCard
                label="נכסים"
                value={
                  recommendedFund.totalAssets
                    ? `${(recommendedFund.totalAssets / 1_000).toFixed(1)} מיליארד`
                    : "-"
                }
              />
            </div>
          </div>

          {/* Market Comparison */}
          {categoryAverage && (
            <div className="rounded-xl border border-border/60 bg-card p-5">
              <h4 className="font-bold mb-4">השוואה לממוצע השוק ({CATEGORY_LABELS[fundType!].title})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ComparisonMetric
                  label="ציון כולל"
                  value={recommendedFund.overallScore}
                  baseline={categoryAverage.avgScore}
                />
                <ComparisonMetric
                  label="ציון תשואות"
                  value={recommendedFund.returnScore ?? 50}
                  baseline={categoryAverage.avgReturnScore}
                />
                <ComparisonMetric
                  label="תשואה 5 שנים"
                  value={recommendedFund.avgAnnualYield5Yrs}
                  baseline={categoryAverage.avgReturn5yr}
                  suffix="%"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                בהשוואה ל-{categoryAverage.fundCount} מסלולים בקטגוריה
              </p>
            </div>
          )}

          {/* Alternative tracks from same company */}
          {alternativeFunds.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
              <button
                onClick={() => setShowAlternatives(!showAlternatives)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <span className="font-bold">
                  מסלולים נוספים של {companies.find((c) => c.id === companyId)?.name} ({alternativeFunds.length})
                </span>
                <span className="text-muted-foreground text-lg">
                  {showAlternatives ? "−" : "+"}
                </span>
              </button>
              {showAlternatives && (
                <div className="border-t border-border/50 divide-y divide-border/30">
                  {alternativeFunds.map((fund) => (
                    <button
                      key={fund.fundId}
                      onClick={() => setSelectedFundId(fund.fundId)}
                      className="w-full text-start p-4 hover:bg-muted/20 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{fund.fundName}</div>
                        <div className="text-xs text-muted-foreground">
                          תשואה 5 שנים: {formatPercent(fund.avgAnnualYield5Yrs)}
                        </div>
                      </div>
                      <div className={cn("text-lg font-bold tabular-nums shrink-0", getScoreColor(fund.overallScore))}>
                        {Math.round(fund.overallScore)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cross-company comparison */}
          {topFundPerCompany.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
              <button
                onClick={() => setShowCrossCompany(!showCrossCompany)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <span className="font-bold">
                  השוואה לחברות אחרות ({topFundPerCompany.length})
                </span>
                <span className="text-muted-foreground text-lg">
                  {showCrossCompany ? "−" : "+"}
                </span>
              </button>
              {showCrossCompany && (
                <div className="border-t border-border/50 divide-y divide-border/30">
                  {topFundPerCompany.map((fund) => (
                    <div
                      key={fund.fundId}
                      className="p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{fund.companyName}</div>
                        <div className="text-xs text-muted-foreground truncate">{fund.fundName}</div>
                        <div className="text-xs text-muted-foreground">
                          תשואה 5 שנים: {formatPercent(fund.avgAnnualYield5Yrs)}
                        </div>
                      </div>
                      <div className="flex flex-col items-center shrink-0">
                        <span className={cn("text-lg font-bold tabular-nums", getScoreColor(fund.overallScore))}>
                          {Math.round(fund.overallScore)}
                        </span>
                        <span className={cn("text-[10px]", getScoreColor(fund.overallScore))}>
                          {getScoreLabel(fund.overallScore)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CTA to company page */}
          <div className="text-center">
            <a
              href={`/company/${companyId}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              צפו בפרופיל המלא של {companies.find((c) => c.id === companyId)?.name}
              <span className="text-lg">←</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components

function WizardStepper({
  currentStep,
  lifecycle,
  fundType,
  companyId,
  companies,
  onStepClick,
}: {
  currentStep: Step;
  lifecycle: Lifecycle | null;
  fundType: ScoringCategory | null;
  companyId: string | null;
  companies: Array<{ id: string; name: string }>;
  onStepClick: (step: Step) => void;
}) {
  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center gap-1 text-sm overflow-x-auto pb-2">
      {STEPS.map((step, idx) => {
        const isCompleted = idx < stepIndex;
        const isCurrent = step.key === currentStep;
        const isClickable = isCompleted;

        let sublabel = "";
        if (step.key === "lifecycle" && lifecycle) {
          sublabel = lifecycle === "pre-retirement" ? "לפני פרישה" : "אחרי פרישה";
        } else if (step.key === "fund-type" && fundType) {
          sublabel = CATEGORY_LABELS[fundType].title;
        } else if (step.key === "company" && companyId) {
          sublabel = companies.find((c) => c.id === companyId)?.name ?? "";
        }

        return (
          <div key={step.key} className="flex items-center gap-1 shrink-0">
            {idx > 0 && (
              <span className="text-muted-foreground/40 mx-1">‹</span>
            )}
            <button
              onClick={() => isClickable && onStepClick(step.key)}
              disabled={!isClickable}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all text-xs font-medium",
                isCurrent && "bg-primary text-primary-foreground",
                isCompleted && "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer",
                !isCurrent && !isCompleted && "bg-muted/50 text-muted-foreground/50"
              )}
            >
              <span>{step.label}</span>
              {sublabel && (
                <span className="block text-[10px] font-normal opacity-80 mt-0.5">{sublabel}</span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function LifecycleCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-start rounded-xl border-2 border-border/60 bg-card hover:border-primary/50 hover:shadow-lg transition-all p-6 sm:p-8 group"
    >
      <span className="text-4xl block mb-3">{icon}</span>
      <h4 className="text-xl font-bold group-hover:text-primary transition-colors">
        {title}
      </h4>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
        {description}
      </p>
    </button>
  );
}

function ScoreBar({ score, label, weight }: { score: number; label: string; weight: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground w-14 text-start shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted/80 rounded-full overflow-hidden min-w-[60px]">
        <div
          className={cn("h-full rounded-full transition-all", getScoreBg(score))}
          style={{ width: `${Math.max(score, 3)}%` }}
        />
      </div>
      <span className={cn("text-[11px] font-semibold w-8 text-start tabular-nums", getScoreColor(score))}>
        {Math.round(score)}
      </span>
      <span className="text-[9px] text-muted-foreground/60 w-8">{weight}</span>
    </div>
  );
}

function MiniScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground w-12 text-start shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-muted/60 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", getScoreBg(score))}
          style={{ width: `${Math.max(score, 3)}%` }}
        />
      </div>
      <span className={cn("text-[10px] font-semibold w-6 text-start tabular-nums", getScoreColor(score))}>
        {Math.round(score)}
      </span>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-bold mt-0.5">{value}</div>
    </div>
  );
}

function ComparisonMetric({
  label,
  value,
  baseline,
  suffix = "",
}: {
  label: string;
  value: number | null;
  baseline: number;
  suffix?: string;
}) {
  if (value === null) return null;

  const diff = value - baseline;
  const isPositive = diff > 0;

  return (
    <div className="text-center">
      <div className="text-[11px] text-muted-foreground mb-1">{label}</div>
      <div className="text-lg font-bold tabular-nums">
        {suffix ? value.toFixed(2) : Math.round(value)}
        {suffix}
      </div>
      <div
        className={cn(
          "text-xs font-medium",
          isPositive ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-muted-foreground"
        )}
      >
        {isPositive ? "+" : ""}
        {suffix ? diff.toFixed(2) : Math.round(diff)}
        {suffix} מהממוצע
      </div>
    </div>
  );
}
