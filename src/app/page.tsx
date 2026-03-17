import {
  getLatestScoredPeriod,
  getCompanyRankings,
  getFundRankings,
  getLastRefreshInfo,
} from "@/lib/queries";
import { HomepageTabs } from "@/components/homepage-tabs";
import { Badge } from "@/components/ui/badge";

export default function Home() {
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

  const overallCompanies = getCompanyRankings(latestPeriod, "overall");
  const comprehensiveCompanies = getCompanyRankings(latestPeriod, "comprehensive");
  const nonComprehensiveCompanies = getCompanyRankings(latestPeriod, "non_comprehensive");
  const comprehensiveRetireeCompanies = getCompanyRankings(latestPeriod, "comprehensive_retiree");
  const nonComprehensiveRetireeCompanies = getCompanyRankings(latestPeriod, "non_comprehensive_retiree");
  const comprehensiveFunds = getFundRankings(latestPeriod, "comprehensive");
  const nonComprehensiveFunds = getFundRankings(latestPeriod, "non_comprehensive");
  const comprehensiveRetireeFunds = getFundRankings(latestPeriod, "comprehensive_retiree");
  const nonComprehensiveRetireeFunds = getFundRankings(latestPeriod, "non_comprehensive_retiree");
  const refreshInfo = getLastRefreshInfo();

  const periodStr = String(latestPeriod);
  const year = periodStr.slice(0, 4);
  const month = periodStr.slice(4, 6);
  const monthNames = [
    "", "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
  ];
  const periodLabel = `${monthNames[parseInt(month)]} ${year}`;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">מדד איכות קרנות פנסיה</h2>
        <p className="text-muted-foreground max-w-2xl">
          דירוג איכותי של חברות הפנסיה בישראל המבוסס על מגוון פרמטרים: תשואות
          ארוכות טווח, דמי ניהול, גודל קרן, איזון אקטוארי, גמישות מסלולי
          השקעה ועוד. לחצו על חברה לפירוט מלא של כל המסלולים.
        </p>
        <div className="flex gap-3 mt-4">
          <Badge variant="outline">נתונים: {periodLabel}</Badge>
          {refreshInfo?.completedAt && (
            <Badge variant="secondary">
              עדכון אחרון:{" "}
              {new Date(refreshInfo.completedAt).toLocaleDateString("he-IL")}
            </Badge>
          )}
          <Badge variant="secondary">
            {overallCompanies.length} חברות
          </Badge>
        </div>
      </div>

      {/* Tabs with company rankings */}
      <HomepageTabs
        overallCompanies={overallCompanies}
        comprehensiveCompanies={comprehensiveCompanies}
        nonComprehensiveCompanies={nonComprehensiveCompanies}
        comprehensiveRetireeCompanies={comprehensiveRetireeCompanies}
        nonComprehensiveRetireeCompanies={nonComprehensiveRetireeCompanies}
        comprehensiveFunds={comprehensiveFunds}
        nonComprehensiveFunds={nonComprehensiveFunds}
        comprehensiveRetireeFunds={comprehensiveRetireeFunds}
        nonComprehensiveRetireeFunds={nonComprehensiveRetireeFunds}
      />
    </div>
  );
}
