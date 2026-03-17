import {
  getLatestScoredPeriod,
  getPortfolioBuilderData,
  getMarketAverages,
  getCompanyScoresByCategory,
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
  const companyScoresRaw = getCompanyScoresByCategory(latestPeriod);

  // Transform funds to client-friendly format
  const funds = rawData.map((row) => ({
    fundId: row.fund.id,
    fundName: row.fund.nameHebrew,
    fundType: row.fund.fundType,
    companyId: row.company.id,
    companyName: row.company.nameHebrew,
    scoringCategory: row.score.scoringCategory,
    overallScore: row.score.overallScore,
    returnScore: row.score.returnScore,
    actuarialScore: row.score.actuarialScore,
    sizeScore: row.score.sizeScore,
    serviceScore: row.score.serviceScore,
    claimsScore: row.score.claimsScore,
    avgAnnualYield5Yrs: row.performance.avgAnnualYield5Yrs,
    avgAnnualYield3Yrs: row.performance.avgAnnualYield3Yrs,
    yearToDateYield: row.performance.yearToDateYield,
    totalAssets: row.performance.totalAssets,
    rank: row.score.rank,
  }));

  const companies = MANAGEMENT_COMPANIES
    .filter((c) => funds.some((f) => f.companyId === c.id))
    .map((c) => ({ id: c.id, name: c.nameHebrew }))
    .sort((a, b) => a.name.localeCompare(b.name, "he"));

  const averages = marketAverages.map((m) => ({
    scoringCategory: m.scoringCategory,
    avgScore: m.avgScore,
    avgReturnScore: m.avgReturnScore,
    avgReturn5yr: m.avgReturn5yr,
    avgReturn3yr: m.avgReturn3yr,
    fundCount: m.fundCount,
  }));

  // Transform company scores by category
  const companyScoresByCategory = companyScoresRaw.map((row) => ({
    companyId: row.company.id,
    companyName: row.company.nameHebrew,
    scoringCategory: row.score.scoringCategory,
    overallScore: row.score.overallScore,
    returnScore: row.score.returnScore,
    actuarialScore: row.score.actuarialScore,
    serviceScore: row.score.serviceScore,
    rank: row.score.rank,
    fundCount: row.score.fundCount,
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h2 className="text-3xl font-bold mb-2">מצא את קרן הפנסיה המתאימה לך</h2>
      <p className="text-muted-foreground mb-8">
        ענו על כמה שאלות פשוטות ונמצא עבורכם את מסלול הפנסיה הטוב ביותר
      </p>

      <PortfolioBuilder
        funds={funds}
        marketAverages={averages}
        companies={companies}
        companyScoresByCategory={companyScoresByCategory}
      />
    </div>
  );
}
