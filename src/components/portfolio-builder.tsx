"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ScoreGauge } from "@/components/score-gauge";

interface FundTrack {
  fundId: string;
  fundName: string;
  fundType: string;
  companyId: string;
  companyName: string;
  scoringCategory: string;
  overallScore: number;
  returnScore: number | null;
  feeScore: number | null;
  sizeScore: number | null;
  actuarialScore: number | null;
  avgAnnualYield5Yrs: number | null;
  avgAnnualYield3Yrs: number | null;
  yearToDateYield: number | null;
  avgAnnualManagementFee: number | null;
  avgDepositFee: number | null;
  totalAssets: number | null;
}

interface MarketAverage {
  scoringCategory: string;
  avgScore: number;
  avgReturnScore: number;
  avgFeeScore: number;
  avgReturn5yr: number;
  avgReturn3yr: number;
  avgFee: number;
  fundCount: number;
}

interface PortfolioBuilderProps {
  funds: FundTrack[];
  marketAverages: MarketAverage[];
  companies: Array<{ id: string; name: string }>;
}

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return "-";
  return `${value.toFixed(2)}%`;
}

const fundTypeLabels: Record<string, string> = {
  comprehensive_new: "מקיפה חדשה",
  general: "כללית",
  supplementary: "משלימה",
  other: "אחר",
};

const CATEGORY_SECTIONS = [
  { key: "comprehensive", title: "מסלולי מקיפה", desc: "מסלולי פנסיה מקיפה - כוללים מנגנון תשואה מובטחת" },
  { key: "non_comprehensive", title: "מסלולי כללית ומשלימה", desc: "מסלולי פנסיה כללית ומשלימה - ללא מנגנון תשואה מובטחת" },
  { key: "comprehensive_retiree", title: "מסלולי מקיפה - מקבלי קצבה", desc: "מסלולי מקיפה המיועדים למקבלי קצבה" },
  { key: "non_comprehensive_retiree", title: "מסלולי כללית/משלימה - מקבלי קצבה", desc: "מסלולי כללית ומשלימה המיועדים למקבלי קצבה" },
] as const;

export function PortfolioBuilder({
  funds,
  marketAverages,
  companies,
}: PortfolioBuilderProps) {
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  // Split company funds by category
  const fundsByCategory = useMemo(() => {
    if (!selectedCompany) return {};
    const compFunds = funds.filter((f) => f.companyId === selectedCompany);
    const result: Record<string, FundTrack[]> = {};
    for (const section of CATEGORY_SECTIONS) {
      const catFunds = compFunds.filter((f) => f.scoringCategory === section.key);
      if (catFunds.length > 0) {
        result[section.key] = catFunds;
      }
    }
    return result;
  }, [funds, selectedCompany]);

  const allCompanyFunds = useMemo(
    () => Object.values(fundsByCategory).flat(),
    [fundsByCategory]
  );

  const totalAllocation = useMemo(() => {
    return Object.values(allocations).reduce((sum, v) => sum + v, 0);
  }, [allocations]);

  const remaining = 100 - totalAllocation;

  const portfolioResult = useMemo(() => {
    if (totalAllocation === 0) return null;

    let weightedScore = 0;
    let weightedReturnScore = 0;
    let weightedFeeScore = 0;
    let weightedReturn5yr = 0;
    let weightedReturn3yr = 0;
    let weightedFee = 0;
    let count5yr = 0;
    let count3yr = 0;
    let countFee = 0;

    for (const [fundId, pct] of Object.entries(allocations)) {
      if (pct === 0) continue;
      const fund = allCompanyFunds.find((f) => f.fundId === fundId);
      if (!fund) continue;

      const weight = pct / totalAllocation;

      weightedScore += fund.overallScore * weight;
      weightedReturnScore += (fund.returnScore ?? 50) * weight;
      weightedFeeScore += (fund.feeScore ?? 50) * weight;

      if (fund.avgAnnualYield5Yrs !== null) {
        weightedReturn5yr += fund.avgAnnualYield5Yrs * weight;
        count5yr++;
      }
      if (fund.avgAnnualYield3Yrs !== null) {
        weightedReturn3yr += fund.avgAnnualYield3Yrs * weight;
        count3yr++;
      }
      if (fund.avgAnnualManagementFee !== null) {
        weightedFee += fund.avgAnnualManagementFee * weight;
        countFee++;
      }
    }

    return {
      score: Math.round(weightedScore * 10) / 10,
      returnScore: Math.round(weightedReturnScore * 10) / 10,
      feeScore: Math.round(weightedFeeScore * 10) / 10,
      return5yr: count5yr > 0 ? Math.round(weightedReturn5yr * 100) / 100 : null,
      return3yr: count3yr > 0 ? Math.round(weightedReturn3yr * 100) / 100 : null,
      fee: countFee > 0 ? Math.round(weightedFee * 100) / 100 : null,
    };
  }, [allocations, allCompanyFunds, totalAllocation]);

  function handleCompanyChange(companyId: string) {
    setSelectedCompany(companyId);
    setAllocations({});
  }

  function handleAllocationChange(fundId: string, value: number) {
    setAllocations((prev) => {
      const currentValue = prev[fundId] ?? 0;
      const currentTotal = Object.values(prev).reduce((sum, v) => sum + v, 0);
      const otherTotal = currentTotal - currentValue;

      // Cap value so total never exceeds 100%
      const maxAllowed = 100 - otherTotal;
      const capped = Math.max(0, Math.min(value, maxAllowed));

      const next = { ...prev };
      if (capped === 0) {
        delete next[fundId];
      } else {
        next[fundId] = capped;
      }
      return next;
    });
  }

  // Market averages for comparison
  const comprehensiveAvg = marketAverages.find(
    (m) => m.scoringCategory === "comprehensive"
  );
  const nonComprehensiveAvg = marketAverages.find(
    (m) => m.scoringCategory === "non_comprehensive"
  );

  let stepNum = 1;

  return (
    <div className="space-y-8">
      {/* Step 1: Select company */}
      <Card>
        <CardHeader>
          <CardTitle>{stepNum++}. בחרו חברת פנסיה</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="border border-border rounded-md px-4 py-2 text-base bg-background w-full max-w-sm"
            value={selectedCompany}
            onChange={(e) => handleCompanyChange(e.target.value)}
          >
            <option value="">-- בחרו חברה --</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Category sections */}
      {selectedCompany && CATEGORY_SECTIONS.map((section) => {
        const catFunds = fundsByCategory[section.key];
        if (!catFunds || catFunds.length === 0) return null;

        return (
          <Card key={section.key}>
            <CardHeader>
              <CardTitle>{stepNum++}. {section.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {section.desc}
              </p>
            </CardHeader>
            <CardContent>
              <TrackAllocationList
                funds={catFunds}
                allocations={allocations}
                remaining={remaining}
                onAllocationChange={handleAllocationChange}
              />
            </CardContent>
          </Card>
        );
      })}

      {/* Total allocation bar */}
      {selectedCompany && allCompanyFunds.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-lg">סה״כ הקצאה</span>
              <span
                className={`text-2xl font-bold ${
                  totalAllocation === 100
                    ? "text-green-600"
                    : totalAllocation > 0
                    ? "text-yellow-600"
                    : "text-muted-foreground"
                }`}
              >
                {totalAllocation}%
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  totalAllocation === 100 ? "bg-green-500" : "bg-yellow-500"
                }`}
                style={{ width: `${Math.min(totalAllocation, 100)}%` }}
              />
            </div>
            {totalAllocation > 0 && totalAllocation < 100 && (
              <p className="text-sm text-muted-foreground mt-2">
                נותרו {remaining}% להקצאה
              </p>
            )}
            {totalAllocation === 100 && (
              <p className="text-sm text-green-600 mt-2">
                &#10003; ההקצאה מלאה - 100%
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {portfolioResult && (
        <Card>
          <CardHeader>
            <CardTitle>תוצאות התיק שלכם</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Score */}
              <div className="flex items-center gap-6">
                <ScoreGauge score={portfolioResult.score} size="lg" />
                <div>
                  <div className="text-lg font-bold">ציון התיק</div>
                  <div className="text-sm text-muted-foreground">
                    ממוצע משוקלל של מסלולי ההשקעה שבחרתם
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">תשואה 5 שנים</span>
                  <span className="font-medium">
                    {formatPercent(portfolioResult.return5yr)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">תשואה 3 שנים</span>
                  <span className="font-medium">
                    {formatPercent(portfolioResult.return3yr)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">דמי ניהול</span>
                  <span className="font-medium">
                    {formatPercent(portfolioResult.fee)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">ציון תשואות</span>
                  <span className="font-medium">
                    {portfolioResult.returnScore}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">ציון דמי ניהול</span>
                  <span className="font-medium">
                    {portfolioResult.feeScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Market comparison */}
            <div className="mt-8 pt-6 border-t">
              <h4 className="font-bold mb-4">השוואה לשוק</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {comprehensiveAvg && (
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium mb-2">
                      ממוצע שוק - מקיפה
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ציון</span>
                        <ComparisonValue
                          value={portfolioResult.score}
                          baseline={comprehensiveAvg.avgScore}
                          suffix=""
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          תשואה 5 שנים
                        </span>
                        <ComparisonValue
                          value={portfolioResult.return5yr}
                          baseline={comprehensiveAvg.avgReturn5yr}
                          suffix="%"
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          דמי ניהול
                        </span>
                        <ComparisonValue
                          value={portfolioResult.fee}
                          baseline={comprehensiveAvg.avgFee}
                          suffix="%"
                          inverse
                        />
                      </div>
                    </div>
                  </div>
                )}

                {nonComprehensiveAvg && (
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium mb-2">
                      ממוצע שוק - כללית/משלימה
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ציון</span>
                        <ComparisonValue
                          value={portfolioResult.score}
                          baseline={nonComprehensiveAvg.avgScore}
                          suffix=""
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          תשואה 5 שנים
                        </span>
                        <ComparisonValue
                          value={portfolioResult.return5yr}
                          baseline={nonComprehensiveAvg.avgReturn5yr}
                          suffix="%"
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          דמי ניהול
                        </span>
                        <ComparisonValue
                          value={portfolioResult.fee}
                          baseline={nonComprehensiveAvg.avgFee}
                          suffix="%"
                          inverse
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!selectedCompany && (
        <div className="text-center text-muted-foreground py-12">
          <p className="text-lg">בחרו חברת פנסיה כדי להתחיל לבנות את התיק</p>
          <p className="text-sm mt-2">
            הכלי מאפשר לכם לבחור מסלולי השקעה ולראות ציון משוקלל בהשוואה לשוק
          </p>
        </div>
      )}
    </div>
  );
}

function TrackAllocationList({
  funds,
  allocations,
  remaining,
  onAllocationChange,
}: {
  funds: FundTrack[];
  allocations: Record<string, number>;
  remaining: number;
  onAllocationChange: (fundId: string, value: number) => void;
}) {
  return (
    <div className="space-y-6">
      {funds.map((fund) => {
        const currentPct = allocations[fund.fundId] ?? 0;
        const maxForThis = currentPct + remaining;

        return (
          <div key={fund.fundId} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{fund.fundName}</div>
                <div className="text-xs text-muted-foreground">
                  {fundTypeLabels[fund.fundType] ?? fund.fundType} · ציון{" "}
                  {fund.overallScore.toFixed(1)} · תשואה 5 שנים{" "}
                  {formatPercent(fund.avgAnnualYield5Yrs)} · דמי ניהול{" "}
                  {formatPercent(fund.avgAnnualManagementFee)}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min="0"
                  max={maxForThis}
                  value={currentPct}
                  onChange={(e) =>
                    onAllocationChange(
                      fund.fundId,
                      Math.max(0, parseInt(e.target.value) || 0)
                    )
                  }
                  className="w-16 border border-border rounded-md px-2 py-1 text-sm text-center bg-background"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <Slider
              value={[currentPct]}
              max={maxForThis}
              step={5}
              onValueChange={([v]) => onAllocationChange(fund.fundId, v)}
              className="w-full"
            />
          </div>
        );
      })}
    </div>
  );
}

function ComparisonValue({
  value,
  baseline,
  suffix,
  inverse = false,
}: {
  value: number | null;
  baseline: number;
  suffix: string;
  inverse?: boolean;
}) {
  if (value === null) return <span>-</span>;

  const diff = value - baseline;
  const isGood = inverse ? diff < 0 : diff > 0;
  const isBad = inverse ? diff > 0 : diff < 0;

  return (
    <span className="font-medium">
      {value.toFixed(2)}
      {suffix}{" "}
      <span
        className={
          isGood
            ? "text-green-600"
            : isBad
            ? "text-red-600"
            : "text-muted-foreground"
        }
      >
        ({diff > 0 ? "+" : ""}
        {diff.toFixed(2)}
        {suffix})
      </span>
    </span>
  );
}
