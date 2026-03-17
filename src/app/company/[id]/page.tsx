import { notFound } from "next/navigation";
import { getCompanyById, getCompanyFunds } from "@/lib/queries";
import { FUND_LIMITATIONS, CATEGORY_LABELS } from "@/lib/constants/funds";
import { ScoreGauge } from "@/components/score-gauge";
import { ScoreRadar } from "@/components/score-radar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScoringCategory } from "@/types/fund";

const fundTypeLabels: Record<string, string> = {
  comprehensive_new: "מקיפה חדשה",
  general: "כללית",
  supplementary: "משלימה",
  other: "אחר",
};

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return "-";
  return `${value.toFixed(2)}%`;
}

function formatAssets(millions: number | null): string {
  if (millions === null) return "-";
  if (millions >= 1000) return `${(millions / 1000).toFixed(1)} מיליארד ₪`;
  return `${Math.round(millions)} מיליון ₪`;
}

interface ScoreCardData {
  overallScore: number;
  returnScore: number | null;
  feeScore: number | null;
  sizeScore: number | null;
  actuarialScore: number | null;
  serviceScore: number | null;
  flexibilityScore: number | null;
  claimsScore: number | null;
  netFlowScore: number | null;
  totalAssets: number | null;
  fundCount: number | null;
  rank: number | null;
}

function CategoryScoreCard({ title, score }: { title: string; score: ScoreCardData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="outline">#{score.rank}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <ScoreGauge score={score.overallScore} size="md" />
          <div className="text-sm text-muted-foreground">
            <div>{score.fundCount} מסלולים</div>
            <div>{formatAssets(score.totalAssets)}</div>
          </div>
        </div>
        <ScoreRadar
          returnScore={score.returnScore ?? 50}
          feeScore={score.feeScore ?? 50}
          sizeScore={score.sizeScore ?? 50}
          actuarialScore={score.actuarialScore ?? 50}
          serviceScore={score.serviceScore ?? 50}
          flexibilityScore={score.flexibilityScore ?? 50}
          claimsScore={score.claimsScore ?? 50}
          netFlowScore={score.netFlowScore ?? 50}
        />
      </CardContent>
    </Card>
  );
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getCompanyById(id);

  if (!data) {
    notFound();
  }

  const { company, scores: scoreMap, reportPeriod } = data;
  const overallScore = scoreMap["overall"];
  const comprehensiveScore = scoreMap["comprehensive"];
  const nonComprehensiveScore = scoreMap["non_comprehensive"];
  const comprehensiveRetireeScore = scoreMap["comprehensive_retiree"];
  const nonComprehensiveRetireeScore = scoreMap["non_comprehensive_retiree"];

  const limits = FUND_LIMITATIONS[id];

  // Get fund tracks per category
  const comprehensiveFunds = getCompanyFunds(id, reportPeriod, "comprehensive");
  const nonComprehensiveFunds = getCompanyFunds(id, reportPeriod, "non_comprehensive");
  const comprehensiveRetireeFunds = getCompanyFunds(id, reportPeriod, "comprehensive_retiree");
  const nonComprehensiveRetireeFunds = getCompanyFunds(id, reportPeriod, "non_comprehensive_retiree");

  const hasRetireeData = comprehensiveRetireeScore || nonComprehensiveRetireeScore ||
    comprehensiveRetireeFunds.length > 0 || nonComprehensiveRetireeFunds.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <a
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
      >
        &larr; חזרה לדירוג
      </a>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold">{company.nameHebrew}</h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {overallScore && (
              <Badge variant="secondary">דירוג כולל #{overallScore.rank}</Badge>
            )}
            {limits?.acceptsWithoutHealthDeclaration && (
              <Badge variant="destructive">ללא הצהרת בריאות</Badge>
            )}
            {limits?.trackFlexibility === "none" && (
              <Badge variant="destructive">מסלול מוגבל</Badge>
            )}
          </div>
        </div>
        {overallScore && (
          <ScoreGauge score={overallScore.overallScore} size="lg" />
        )}
      </div>

      {/* Regular Category Scores */}
      <h3 className="text-xl font-bold mb-4">כלל האוכלוסיה</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {comprehensiveScore && (
          <CategoryScoreCard title="מקיפה" score={comprehensiveScore} />
        )}
        {nonComprehensiveScore && (
          <CategoryScoreCard title="כללית/משלימה" score={nonComprehensiveScore} />
        )}
      </div>

      {/* Retiree Category Scores */}
      {hasRetireeData && (
        <>
          <h3 className="text-xl font-bold mb-4">מקבלי קצבה</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {comprehensiveRetireeScore && (
              <CategoryScoreCard title="מקיפה - מקבלי קצבה" score={comprehensiveRetireeScore} />
            )}
            {nonComprehensiveRetireeScore && (
              <CategoryScoreCard title="כללית/משלימה - מקבלי קצבה" score={nonComprehensiveRetireeScore} />
            )}
          </div>
        </>
      )}

      {/* Company Info */}
      {limits && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>מאפייני חברה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">הצהרת בריאות</span>
                <span className="font-medium">
                  {limits.acceptsWithoutHealthDeclaration
                    ? "מקבלים ללא הצהרה"
                    : "נדרשת הצהרת בריאות"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">גמישות מסלולים</span>
                <span className="font-medium">
                  {limits.trackFlexibility === "full"
                    ? "מלאה"
                    : limits.trackFlexibility === "limited"
                    ? "מוגבלת"
                    : "מסלול אחד"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">מסלולי תגמולים</span>
                <span className="font-medium">{limits.numberOfTagmulimTracks}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">מסלולי פיצויים</span>
                <span className="font-medium">{limits.numberOfPitzuyimTracks}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fund Tracks - Regular Comprehensive */}
      {comprehensiveFunds.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">
            מסלולי מקיפה ({comprehensiveFunds.length})
          </h3>
          <FundTrackTable funds={comprehensiveFunds} />
        </div>
      )}

      {/* Fund Tracks - Regular Non-Comprehensive */}
      {nonComprehensiveFunds.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">
            מסלולי כללית ומשלימה ({nonComprehensiveFunds.length})
          </h3>
          <FundTrackTable funds={nonComprehensiveFunds} />
        </div>
      )}

      {/* Fund Tracks - Retiree Comprehensive */}
      {comprehensiveRetireeFunds.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">
            מסלולי מקיפה - מקבלי קצבה ({comprehensiveRetireeFunds.length})
          </h3>
          <FundTrackTable funds={comprehensiveRetireeFunds} />
        </div>
      )}

      {/* Fund Tracks - Retiree Non-Comprehensive */}
      {nonComprehensiveRetireeFunds.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">
            מסלולי כללית/משלימה - מקבלי קצבה ({nonComprehensiveRetireeFunds.length})
          </h3>
          <FundTrackTable funds={nonComprehensiveRetireeFunds} />
        </div>
      )}
    </div>
  );
}

function FundTrackTable({
  funds,
}: {
  funds: Array<{
    fund: { id: string; slug: string; nameHebrew: string; fundType: string };
    performance: {
      totalAssets: number | null;
      avgAnnualYield5Yrs: number | null;
      avgAnnualYield3Yrs: number | null;
      avgAnnualManagementFee: number | null;
      avgDepositFee: number | null;
    };
    score: {
      overallScore: number;
      rank: number | null;
    };
  }>;
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 text-right">
            <th className="px-4 py-3 font-medium w-12 text-center">#</th>
            <th className="px-4 py-3 font-medium">מסלול</th>
            <th className="px-4 py-3 font-medium text-center">ציון</th>
            <th className="px-4 py-3 font-medium text-center hidden sm:table-cell">
              תשואה 5 שנים
            </th>
            <th className="px-4 py-3 font-medium text-center hidden sm:table-cell">
              תשואה 3 שנים
            </th>
            <th className="px-4 py-3 font-medium text-center">דמי ניהול</th>
            <th className="px-4 py-3 font-medium text-center hidden md:table-cell">
              נכסים
            </th>
          </tr>
        </thead>
        <tbody>
          {funds.map((row) => (
            <tr
              key={row.fund.id}
              className="border-t border-border hover:bg-muted/30"
            >
              <td className="px-4 py-3 text-center text-muted-foreground">
                {row.score.rank}
              </td>
              <td className="px-4 py-3">
                <a
                  href={`/fund/${row.fund.slug}`}
                  className="hover:underline"
                >
                  <div className="font-medium">{row.fund.nameHebrew}</div>
                  <div className="text-xs text-muted-foreground">
                    {fundTypeLabels[row.fund.fundType] || row.fund.fundType}
                  </div>
                </a>
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`font-bold ${
                    row.score.overallScore >= 80
                      ? "text-green-600"
                      : row.score.overallScore >= 65
                      ? "text-yellow-600"
                      : row.score.overallScore >= 50
                      ? "text-orange-600"
                      : "text-red-600"
                  }`}
                >
                  {row.score.overallScore.toFixed(1)}
                </span>
              </td>
              <td className="px-4 py-3 text-center tabular-nums hidden sm:table-cell">
                {formatPercent(row.performance.avgAnnualYield5Yrs)}
              </td>
              <td className="px-4 py-3 text-center tabular-nums hidden sm:table-cell">
                {formatPercent(row.performance.avgAnnualYield3Yrs)}
              </td>
              <td className="px-4 py-3 text-center tabular-nums">
                {formatPercent(row.performance.avgAnnualManagementFee)}
              </td>
              <td className="px-4 py-3 text-center text-xs hidden md:table-cell">
                {formatAssets(row.performance.totalAssets)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
