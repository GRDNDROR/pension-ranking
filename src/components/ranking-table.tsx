"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScoreGauge, ScoreBar } from "@/components/score-gauge";
import { PenaltyBadge } from "@/components/penalty-badge";
import { FUND_LIMITATIONS } from "@/lib/constants/funds";

interface RankingRow {
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

type SortField =
  | "rank"
  | "score"
  | "returns5yr"
  | "returns3yr"
  | "fees"
  | "size";

interface RankingTableProps {
  rankings: RankingRow[];
}

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return "-";
  return `${value.toFixed(2)}%`;
}

function formatAssets(millions: number | null): string {
  if (millions === null || millions === undefined) return "-";
  if (millions >= 1000) return `${(millions / 1000).toFixed(1)} מיליארד`;
  return `${Math.round(millions)} מיליון`;
}

export function RankingTable({ rankings }: RankingTableProps) {
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterCompany, setFilterCompany] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");

  const companies = useMemo(() => {
    const unique = new Map<string, string>();
    for (const r of rankings) {
      unique.set(r.company.id, r.company.nameHebrew);
    }
    return Array.from(unique.entries()).sort((a, b) =>
      a[1].localeCompare(b[1], "he")
    );
  }, [rankings]);

  const fundTypes = useMemo(() => {
    const unique = new Set<string>();
    for (const r of rankings) {
      if (r.fund.fundType) unique.add(r.fund.fundType);
    }
    return Array.from(unique);
  }, [rankings]);

  const sortedRankings = useMemo(() => {
    let filtered = rankings;

    if (filterCompany) {
      filtered = filtered.filter((r) => r.company.id === filterCompany);
    }
    if (filterType) {
      filtered = filtered.filter((r) => r.fund.fundType === filterType);
    }

    return [...filtered].sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortField) {
        case "rank":
          aVal = a.score.rank ?? 999;
          bVal = b.score.rank ?? 999;
          break;
        case "score":
          aVal = a.score.overallScore;
          bVal = b.score.overallScore;
          break;
        case "returns5yr":
          aVal = a.performance.avgAnnualYield5Yrs ?? -999;
          bVal = b.performance.avgAnnualYield5Yrs ?? -999;
          break;
        case "returns3yr":
          aVal = a.performance.avgAnnualYield3Yrs ?? -999;
          bVal = b.performance.avgAnnualYield3Yrs ?? -999;
          break;
        case "fees":
          aVal = a.performance.avgAnnualManagementFee ?? 999;
          bVal = b.performance.avgAnnualManagementFee ?? 999;
          // For fees, lower is better so reverse default
          return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        case "size":
          aVal = a.performance.totalAssets ?? 0;
          bVal = b.performance.totalAssets ?? 0;
          break;
        default:
          return 0;
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [rankings, sortField, sortDir, filterCompany, filterType]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === "rank" || field === "fees" ? "asc" : "desc");
    }
  }

  function getSortIcon(field: SortField) {
    if (sortField !== field) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  const fundTypeLabels: Record<string, string> = {
    comprehensive_new: "מקיפה חדשה",
    general: "כללית",
    supplementary: "משלימה",
    other: "אחר",
  };

  function getPenalties(row: RankingRow) {
    const penalties: Array<{ label: string; description: string }> = [];
    const companyId = row.company.id;
    const limits = FUND_LIMITATIONS[companyId];

    if (limits?.acceptsWithoutHealthDeclaration) {
      penalties.push({
        label: "ללא הצ״ב",
        description: "קבלת מבוטחים ללא הצהרת בריאות - סיכון אקטוארי למבוטחים קיימים",
      });
    }
    if (limits?.trackFlexibility === "none") {
      penalties.push({
        label: "מסלול מוגבל",
        description: "מוגבל למסלול השקעה אחד לתגמולים ואחד לפיצויים",
      });
    }
    if (
      row.performance.totalAssets !== null &&
      row.performance.totalAssets < 500
    ) {
      penalties.push({
        label: "קרן קטנה",
        description: "קרן קטנה מאוד (מתחת ל-500 מיליון ₪) - חוסר יציבות פוטנציאלי",
      });
    }
    if (
      row.performance.actuarialAdjustment !== null &&
      row.performance.actuarialAdjustment < 0
    ) {
      penalties.push({
        label: "גירעון אקטוארי",
        description: "גירעון אקטוארי - עלול להוביל להפחתת תשואות לחוסכים",
      });
    }

    return penalties;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <select
          className="border border-border rounded-md px-3 py-1.5 text-sm bg-background"
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
        >
          <option value="">כל החברות</option>
          {companies.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <select
          className="border border-border rounded-md px-3 py-1.5 text-sm bg-background"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">כל סוגי הקרנות</option>
          {fundTypes.map((type) => (
            <option key={type} value={type}>
              {fundTypeLabels[type] || type}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground self-center">
          {sortedRankings.length} קרנות
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 text-center">
                <button onClick={() => handleSort("rank")} className="font-medium">
                  #{getSortIcon("rank")}
                </button>
              </TableHead>
              <TableHead>קרן פנסיה</TableHead>
              <TableHead className="text-center">
                <button onClick={() => handleSort("score")} className="font-medium">
                  ציון{getSortIcon("score")}
                </button>
              </TableHead>
              <TableHead className="hidden md:table-cell">פירוט ציון</TableHead>
              <TableHead className="text-center">
                <button onClick={() => handleSort("returns5yr")} className="font-medium">
                  תשואה 5 שנים{getSortIcon("returns5yr")}
                </button>
              </TableHead>
              <TableHead className="text-center hidden sm:table-cell">
                <button onClick={() => handleSort("returns3yr")} className="font-medium">
                  תשואה 3 שנים{getSortIcon("returns3yr")}
                </button>
              </TableHead>
              <TableHead className="text-center">
                <button onClick={() => handleSort("fees")} className="font-medium">
                  דמי ניהול{getSortIcon("fees")}
                </button>
              </TableHead>
              <TableHead className="text-center hidden lg:table-cell">
                <button onClick={() => handleSort("size")} className="font-medium">
                  נכסים{getSortIcon("size")}
                </button>
              </TableHead>
              <TableHead className="hidden md:table-cell">הערות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRankings.map((row) => {
              const penalties = getPenalties(row);
              return (
                <TableRow key={row.fund.id} className="hover:bg-muted/30">
                  <TableCell className="text-center font-medium text-muted-foreground">
                    {row.score.rank}
                  </TableCell>
                  <TableCell>
                    <a
                      href={`/fund/${row.fund.slug}`}
                      className="hover:underline"
                    >
                      <div className="font-medium">{row.fund.nameHebrew}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.company.nameHebrew} ·{" "}
                        {fundTypeLabels[row.fund.fundType] || row.fund.fundType}
                      </div>
                    </a>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <ScoreGauge score={row.score.overallScore} size="sm" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-1">
                      <ScoreBar
                        score={row.score.returnScore ?? 50}
                        label="תשואה"
                      />
                      <ScoreBar
                        score={row.score.feeScore ?? 50}
                        label="ד״נ"
                      />
                      <ScoreBar
                        score={row.score.sizeScore ?? 50}
                        label="גודל"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {formatPercent(row.performance.avgAnnualYield5Yrs)}
                  </TableCell>
                  <TableCell className="text-center tabular-nums hidden sm:table-cell">
                    {formatPercent(row.performance.avgAnnualYield3Yrs)}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {formatPercent(row.performance.avgAnnualManagementFee)}
                  </TableCell>
                  <TableCell className="text-center hidden lg:table-cell text-xs">
                    {formatAssets(row.performance.totalAssets)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {penalties.map((p, i) => (
                        <PenaltyBadge
                          key={i}
                          label={p.label}
                          description={p.description}
                        />
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
