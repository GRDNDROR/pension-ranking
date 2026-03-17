import {
  getLatestScoredPeriod,
  getPortfolioBuilderData,
  getMarketAverages,
} from "@/lib/queries";
import { PortfolioBuilder } from "@/components/portfolio-builder";
import { MANAGEMENT_COMPANIES } from "@/lib/constants/funds";

export default function PortfolioPage() {
  const latestPeriod = getLatestScoredPeriod();

  if (!latestPeriod) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">אין נתונים זמינים</h2>
        <p className="text-muted-foreground">
          יש להריץ את סקריפט הטעינה כדי לאכלס את מסד הנתונים.
        </p>
      </div>
    );
  }

  const rawData = getPortfolioBuilderData(latestPeriod);
  const marketAverages = getMarketAverages(latestPeriod);

  // Transform to client-friendly format
  const funds = rawData.map((row) => ({
    fundId: row.fund.id,
    fundName: row.fund.nameHebrew,
    fundType: row.fund.fundType,
    companyId: row.company.id,
    companyName: row.company.nameHebrew,
    scoringCategory: row.score.scoringCategory,
    overallScore: row.score.overallScore,
    returnScore: row.score.returnScore,
    feeScore: row.score.feeScore,
    sizeScore: row.score.sizeScore,
    actuarialScore: row.score.actuarialScore,
    avgAnnualYield5Yrs: row.performance.avgAnnualYield5Yrs,
    avgAnnualYield3Yrs: row.performance.avgAnnualYield3Yrs,
    yearToDateYield: row.performance.yearToDateYield,
    avgAnnualManagementFee: row.performance.avgAnnualManagementFee,
    avgDepositFee: row.performance.avgDepositFee,
    totalAssets: row.performance.totalAssets,
  }));

  const companies = MANAGEMENT_COMPANIES
    .filter((c) => funds.some((f) => f.companyId === c.id))
    .map((c) => ({ id: c.id, name: c.nameHebrew }))
    .sort((a, b) => a.name.localeCompare(b.name, "he"));

  const averages = marketAverages.map((m) => ({
    scoringCategory: m.scoringCategory,
    avgScore: m.avgScore,
    avgReturnScore: m.avgReturnScore,
    avgFeeScore: m.avgFeeScore,
    avgReturn5yr: m.avgReturn5yr,
    avgReturn3yr: m.avgReturn3yr,
    avgFee: m.avgFee,
    fundCount: m.fundCount,
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h2 className="text-3xl font-bold mb-2">בונה תיק פנסיה</h2>
      <p className="text-muted-foreground mb-8">
        בחרו חברת פנסיה, הקצו אחוזים למסלולי ההשקעה השונים וקבלו ציון משוקלל
        בהשוואה לממוצע השוק.
      </p>

      <PortfolioBuilder
        funds={funds}
        marketAverages={averages}
        companies={companies}
      />
    </div>
  );
}
