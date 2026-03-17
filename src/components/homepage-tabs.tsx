"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyRankingTable } from "@/components/company-ranking-table";
import { RankingTable } from "@/components/ranking-table";

interface CompanyRow {
  company: {
    id: string;
    nameHebrew: string;
    nameEnglish: string | null;
  };
  score: {
    overallScore: number;
    returnScore: number | null;
    feeScore: number | null;
    sizeScore: number | null;
    actuarialScore: number | null;
    serviceScore: number | null;
    flexibilityScore: number | null;
    claimsScore: number | null;
    penaltyTotal: number | null;
    totalAssets: number | null;
    fundCount: number | null;
    rank: number | null;
  };
}

interface FundRow {
  fund: {
    id: string;
    slug: string;
    nameHebrew: string;
    companyId: string | null;
    fundType: string;
    classification: string | null;
  };
  company: {
    id: string;
    nameHebrew: string;
  };
  performance: {
    totalAssets: number | null;
    avgAnnualYield5Yrs: number | null;
    avgAnnualYield3Yrs: number | null;
    avgAnnualManagementFee: number | null;
    actuarialAdjustment: number | null;
  };
  score: {
    overallScore: number;
    returnScore: number | null;
    feeScore: number | null;
    sizeScore: number | null;
    actuarialScore: number | null;
    penaltyTotal: number | null;
    rank: number | null;
  };
}

interface HomepageTabsProps {
  overallCompanies: CompanyRow[];
  comprehensiveCompanies: CompanyRow[];
  nonComprehensiveCompanies: CompanyRow[];
  comprehensiveRetireeCompanies: CompanyRow[];
  nonComprehensiveRetireeCompanies: CompanyRow[];
  comprehensiveFunds: FundRow[];
  nonComprehensiveFunds: FundRow[];
  comprehensiveRetireeFunds: FundRow[];
  nonComprehensiveRetireeFunds: FundRow[];
}

export function HomepageTabs({
  overallCompanies,
  comprehensiveCompanies,
  nonComprehensiveCompanies,
  comprehensiveRetireeCompanies,
  nonComprehensiveRetireeCompanies,
  comprehensiveFunds,
  nonComprehensiveFunds,
  comprehensiveRetireeFunds,
  nonComprehensiveRetireeFunds,
}: HomepageTabsProps) {
  return (
    <Tabs defaultValue="overall" className="w-full">
      <TabsList className="mb-6 bg-muted/50 p-1">
        <TabsTrigger value="overall">סקירה כללית</TabsTrigger>
        <TabsTrigger value="comprehensive">מקיפה</TabsTrigger>
        <TabsTrigger value="non_comprehensive">כללית/משלימה</TabsTrigger>
      </TabsList>

      <TabsContent value="overall">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            דירוג חברות הפנסיה לפי ציון כולל משוקלל - ממוצע נכסים של כל המסלולים
            (לא כולל מסלולי מקבלי קצבה)
          </p>
          <CompanyRankingTable rankings={overallCompanies} />
        </div>
      </TabsContent>

      <TabsContent value="comprehensive">
        <div className="space-y-8">
          {/* Regular comprehensive */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              דירוג חברות פנסיה - מסלולי פנסיה מקיפה לכלל האוכלוסיה. מסלולים אלו כוללים
              מנגנון תשואה מובטחת ומקדם המרה נמוך יותר.
            </p>
            <CompanyRankingTable rankings={comprehensiveCompanies} />
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold">כל מסלולי המקיפה</h3>
            <RankingTable rankings={comprehensiveFunds} />
          </div>

          {/* Retiree comprehensive */}
          {(comprehensiveRetireeCompanies.length > 0 || comprehensiveRetireeFunds.length > 0) && (
            <>
              <div className="border-t pt-8">
                <h3 className="text-xl font-bold mb-2">מקיפה - מקבלי קצבה</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  מסלולי פנסיה מקיפה המיועדים למקבלי קצבה. מסלולים אלו מדורגים
                  בנפרד כיוון שמאפייני ההשקעה שלהם שונים.
                </p>
              </div>
              {comprehensiveRetireeCompanies.length > 0 && (
                <div className="space-y-4">
                  <CompanyRankingTable rankings={comprehensiveRetireeCompanies} />
                </div>
              )}
              {comprehensiveRetireeFunds.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">כל מסלולי מקבלי קצבה (מקיפה)</h3>
                  <RankingTable rankings={comprehensiveRetireeFunds} />
                </div>
              )}
            </>
          )}
        </div>
      </TabsContent>

      <TabsContent value="non_comprehensive">
        <div className="space-y-8">
          {/* Regular non-comprehensive */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              דירוג חברות פנסיה - מסלולי כללית ומשלימה לכלל האוכלוסיה. מסלולים אלו אינם כוללים
              מנגנון תשואה מובטחת.
            </p>
            <CompanyRankingTable rankings={nonComprehensiveCompanies} />
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold">כל מסלולי כללית ומשלימה</h3>
            <RankingTable rankings={nonComprehensiveFunds} />
          </div>

          {/* Retiree non-comprehensive */}
          {(nonComprehensiveRetireeCompanies.length > 0 || nonComprehensiveRetireeFunds.length > 0) && (
            <>
              <div className="border-t pt-8">
                <h3 className="text-xl font-bold mb-2">כללית/משלימה - מקבלי קצבה</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  מסלולי כללית ומשלימה המיועדים למקבלי קצבה. מסלולים אלו מדורגים
                  בנפרד כיוון שמאפייני ההשקעה שלהם שונים.
                </p>
              </div>
              {nonComprehensiveRetireeCompanies.length > 0 && (
                <div className="space-y-4">
                  <CompanyRankingTable rankings={nonComprehensiveRetireeCompanies} />
                </div>
              )}
              {nonComprehensiveRetireeFunds.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">כל מסלולי מקבלי קצבה (כללית/משלימה)</h3>
                  <RankingTable rankings={nonComprehensiveRetireeFunds} />
                </div>
              )}
            </>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
