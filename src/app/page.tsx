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
      <div className="relative -mx-4 px-4 py-12 mb-8 bg-gradient-to-br from-primary/5 via-background to-accent/30 rounded-b-3xl">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            מדד איכות קרנות פנסיה
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            דירוג איכותי של חברות הפנסיה בישראל המבוסס על מגוון פרמטרים: תשואות
            ארוכות טווח, איזון אקטוארי, איכות שירות וזמינות, אישור תביעות ועוד.
            לחצו על חברה לפירוט מלא של כל המסלולים.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            <Badge variant="outline" className="bg-background/70 backdrop-blur-sm border-primary/20 text-primary font-medium">
              נתונים: {periodLabel}
            </Badge>
            {refreshInfo?.completedAt && (
              <Badge variant="secondary" className="bg-background/70 backdrop-blur-sm">
                עדכון: {new Date(refreshInfo.completedAt).toLocaleDateString("he-IL")}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-background/70 backdrop-blur-sm">
              {overallCompanies.length} חברות
            </Badge>
          </div>

          {/* Winner spotlight + CTA */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            {overallCompanies[0] && (
              <a
                href={`/company/${overallCompanies[0].company.id}`}
                className="inline-flex items-center gap-2 bg-background/80 backdrop-blur-sm border border-primary/20 rounded-lg px-4 py-2 hover:border-primary/40 transition-colors"
              >
                <span className="text-lg">🏆</span>
                <span className="text-sm">
                  <span className="text-muted-foreground">מובילה: </span>
                  <span className="font-bold">{overallCompanies[0].company.nameHebrew}</span>
                  <span className="text-primary font-bold mr-2">
                    {Math.round(overallCompanies[0].score.overallScore)}
                  </span>
                </span>
              </a>
            )}
            <a
              href="/portfolio"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              מצא את הקרן המתאימה לך
              <span>←</span>
            </a>
          </div>
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
