import { notFound } from "next/navigation";
import { getFundBySlug, getFundPerformanceHistory } from "@/lib/queries";
import { FUND_LIMITATIONS, CATEGORY_LABELS } from "@/lib/constants/funds";
import { ScoreGauge } from "@/components/score-gauge";
import { ScoreRadar } from "@/components/score-radar";
import { ReturnsChart } from "@/components/returns-chart";
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

function formatPeriod(period: number): string {
  const str = String(period);
  const year = str.slice(0, 4);
  const month = str.slice(4, 6);
  const monthNames = [
    "",
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
  ];
  return `${monthNames[parseInt(month)]} ${year}`;
}

export default async function FundDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getFundBySlug(slug);

  if (!data || !data.fund) {
    notFound();
  }

  const { fund, company, performance, score, characteristics, longTermReturns } = data;
  const history = getFundPerformanceHistory(fund.id);
  const limits = fund.companyId ? FUND_LIMITATIONS[fund.companyId] : null;

  const deductions: Array<{ label: string; reason: string; points: number }> = [];
  if (limits?.acceptsWithoutHealthDeclaration) {
    deductions.push({
      label: "קבלה ללא הצהרת בריאות",
      reason:
        "הקרן מקבלת מבוטחים ללא הצהרת בריאות, מה שעלול להגדיל את הסיכון האקטוארי ולהשפיע לרעה על המבוטחים הקיימים.",
      points: 8,
    });
  }
  if (limits?.trackFlexibility === "none") {
    deductions.push({
      label: "מסלול השקעה מוגבל",
      reason:
        "הקרן מוגבלת למסלול השקעה אחד לתגמולים ואחד לפיצויים, ללא אפשרות לפיזור.",
      points: 5,
    });
  }
  if (performance?.totalAssets != null && performance.totalAssets < 500) {
    deductions.push({
      label: "קרן קטנה",
      reason:
        "קרן עם נכסים מתחת ל-500 מיליון ₪ - חוסר יציבות פוטנציאלי.",
      points: 6,
    });
  }
  if (
    performance?.actuarialAdjustment != null &&
    performance.actuarialAdjustment < 0
  ) {
    deductions.push({
      label: "גירעון אקטוארי",
      reason:
        "הקרן נמצאת בגירעון אקטוארי, מה שעלול להוביל להפחתת תשואות וזכויות לחוסכים.",
      points: 10,
    });
  }

  const chartData = history.map((h) => ({
    period: formatPeriod(h.reportPeriod),
    monthlyYield: h.monthlyYield,
    yearToDateYield: h.yearToDateYield,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back links */}
      <div className="flex gap-4 mb-4">
        <a
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &rarr; חזרה לדירוג
        </a>
        {company && (
          <a
            href={`/company/${company.id}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &rarr; {company.nameHebrew}
          </a>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold">{fund.nameHebrew}</h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {company && (
              <a href={`/company/${company.id}`}>
                <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                  {company.nameHebrew}
                </Badge>
              </a>
            )}
            <Badge variant="secondary">
              {fundTypeLabels[fund.fundType] || fund.fundType}
            </Badge>
            {score?.scoringCategory && (
              <Badge variant="secondary">
                {CATEGORY_LABELS[score.scoringCategory as ScoringCategory] ?? score.scoringCategory}
              </Badge>
            )}
            {score && (
              <Badge variant="secondary">
                דירוג #{score.rank} ({CATEGORY_LABELS[score.scoringCategory as ScoringCategory] ?? ""})
              </Badge>
            )}
          </div>
        </div>
        {score && (
          <ScoreGauge score={score.overallScore} size="lg" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Breakdown Radar */}
        {score && (
          <Card>
            <CardHeader>
              <CardTitle>פירוט ציון</CardTitle>
            </CardHeader>
            <CardContent>
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
              <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">תשואות</span>
                  <span className="font-medium">
                    {score.returnScore?.toFixed(1) ?? "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ד״נ חיצוניים</span>
                  <span className="font-medium">
                    {score.feeScore?.toFixed(1) ?? "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">גודל קרן</span>
                  <span className="font-medium">
                    {score.sizeScore?.toFixed(1) ?? "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">איזון אקטוארי</span>
                  <span className="font-medium">
                    {score.actuarialScore?.toFixed(1) ?? "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">שירות</span>
                  <span className="font-medium">
                    {score.serviceScore?.toFixed(1) ?? "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">זרימת כספים</span>
                  <span className="font-medium">
                    {score.netFlowScore?.toFixed(1) ?? "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">גמישות מסלולים</span>
                  <span className="font-medium">
                    {score.flexibilityScore?.toFixed(1) ?? "-"}
                  </span>
                </div>
              </div>
              {score.penaltyTotal != null && score.penaltyTotal > 0 && (
                <div className="mt-3 pt-3 border-t flex justify-between text-sm">
                  <span className="text-destructive font-medium">
                    הורדה בדירוג
                  </span>
                  <span className="text-destructive font-bold">
                    -{score.penaltyTotal.toFixed(1)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fund Facts */}
        <Card>
          <CardHeader>
            <CardTitle>נתוני קרן</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">סה״כ נכסים</span>
                <span className="font-medium">
                  {formatAssets(performance?.totalAssets ?? null)}
                </span>
              </div>
              {longTermReturns?.annualizedReturn20Yr != null && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">
                    תשואה ממוצעת 20 שנים
                  </span>
                  <span className="font-medium">
                    {formatPercent(longTermReturns.annualizedReturn20Yr)}
                  </span>
                </div>
              )}
              {longTermReturns?.annualizedReturn10Yr != null && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">
                    תשואה ממוצעת 10 שנים
                  </span>
                  <span className="font-medium">
                    {formatPercent(longTermReturns.annualizedReturn10Yr)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">
                  תשואה ממוצעת 5 שנים
                </span>
                <span className="font-medium">
                  {formatPercent(performance?.avgAnnualYield5Yrs ?? null)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">
                  תשואה ממוצעת 3 שנים
                </span>
                <span className="font-medium">
                  {formatPercent(performance?.avgAnnualYield3Yrs ?? null)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">תשואה מתחילת השנה</span>
                <span className="font-medium">
                  {formatPercent(performance?.yearToDateYield ?? null)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">
                  מגבלת דמי ניהול חיצוניים (שנתי)
                </span>
                <span className="font-medium">
                  {formatPercent(performance?.avgAnnualManagementFee ?? null)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">מגבלת דמי ניהול מהפקדה</span>
                <span className="font-medium">
                  {formatPercent(performance?.avgDepositFee ?? null)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">יחס שארפ</span>
                <span className="font-medium">
                  {performance?.sharpeRatio?.toFixed(3) ?? "-"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">
                  חשיפה למניות
                </span>
                <span className="font-medium">
                  {formatPercent(performance?.stockMarketExposure ?? null)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">חשיפה לחו״ל</span>
                <span className="font-medium">
                  {formatPercent(performance?.foreignExposure ?? null)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rating Deductions */}
        {deductions.length > 0 && (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">
                הורדה בדירוג - למה ירד הציון?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deductions.map((deduction, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xs font-bold shrink-0">
                      -{deduction.points}
                    </div>
                    <div>
                      <div className="font-medium">{deduction.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {deduction.reason}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Returns Chart */}
        <Card className={deductions.length === 0 ? "lg:col-span-2" : ""}>
          <CardHeader>
            <CardTitle>תשואות לאורך זמן</CardTitle>
          </CardHeader>
          <CardContent>
            <ReturnsChart data={chartData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
