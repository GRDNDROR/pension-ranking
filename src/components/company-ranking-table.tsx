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
import { FUND_LIMITATIONS } from "@/lib/constants/funds";
import { cn } from "@/lib/utils";

interface CompanyRankingRow {
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

type SortField = "rank" | "score" | "returns" | "fees" | "size" | "funds";

interface CompanyRankingTableProps {
  rankings: CompanyRankingRow[];
}

function formatAssets(millions: number | null): string {
  if (millions === null || millions === undefined) return "-";
  if (millions >= 1000) return `${(millions / 1000).toFixed(1)} מיליארד ₪`;
  return `${Math.round(millions)} מיליון ₪`;
}

export function CompanyRankingTable({ rankings }: CompanyRankingTableProps) {
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedRankings = useMemo(() => {
    return [...rankings].sort((a, b) => {
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
        case "returns":
          aVal = a.score.returnScore ?? -999;
          bVal = b.score.returnScore ?? -999;
          break;
        case "fees":
          aVal = a.score.feeScore ?? -999;
          bVal = b.score.feeScore ?? -999;
          break;
        case "size":
          aVal = a.score.totalAssets ?? 0;
          bVal = b.score.totalAssets ?? 0;
          break;
        case "funds":
          aVal = a.score.fundCount ?? 0;
          bVal = b.score.fundCount ?? 0;
          break;
        default:
          return 0;
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [rankings, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === "rank" ? "asc" : "desc");
    }
  }

  function getSortIcon(field: SortField) {
    if (sortField !== field) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  function getCompanyPenalties(companyId: string) {
    const limits = FUND_LIMITATIONS[companyId];
    const penalties: string[] = [];
    if (limits?.acceptsWithoutHealthDeclaration) {
      penalties.push("ללא הצ״ב");
    }
    if (limits?.trackFlexibility === "none") {
      penalties.push("מסלול מוגבל");
    }
    return penalties;
  }

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden shadow-sm bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 border-b border-border/50">
            <TableHead className="w-12 text-center">
              <button onClick={() => handleSort("rank")} className="font-medium">
                #{getSortIcon("rank")}
              </button>
            </TableHead>
            <TableHead>חברה</TableHead>
            <TableHead className="text-center">
              <button onClick={() => handleSort("score")} className="font-medium">
                ציון{getSortIcon("score")}
              </button>
            </TableHead>
            <TableHead className="hidden md:table-cell">פירוט ציון</TableHead>
            <TableHead className="text-center hidden sm:table-cell">
              <button onClick={() => handleSort("returns")} className="font-medium">
                תשואות{getSortIcon("returns")}
              </button>
            </TableHead>
            <TableHead className="text-center hidden sm:table-cell">
              <button onClick={() => handleSort("fees")} className="font-medium">
                דמי ניהול{getSortIcon("fees")}
              </button>
            </TableHead>
            <TableHead className="text-center hidden lg:table-cell">
              <button onClick={() => handleSort("size")} className="font-medium">
                נכסים{getSortIcon("size")}
              </button>
            </TableHead>
            <TableHead className="text-center hidden lg:table-cell">
              <button onClick={() => handleSort("funds")} className="font-medium">
                מסלולים{getSortIcon("funds")}
              </button>
            </TableHead>
            <TableHead className="hidden md:table-cell">הערות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRankings.map((row) => {
            const penalties = getCompanyPenalties(row.company.id);
            return (
              <TableRow key={row.company.id} className="hover:bg-primary/[0.02] transition-colors border-b border-border/30 last:border-b-0">
                <TableCell className="text-center">
                  <span className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
                    row.score.rank === 1 ? "bg-amber-100 text-amber-700" :
                    row.score.rank === 2 ? "bg-slate-100 text-slate-600" :
                    row.score.rank === 3 ? "bg-orange-100 text-orange-700" :
                    "text-muted-foreground"
                  )}>
                    {row.score.rank}
                  </span>
                </TableCell>
                <TableCell>
                  <a
                    href={`/company/${row.company.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    <div className="font-medium text-base">
                      {row.company.nameHebrew}
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
                      score={row.score.actuarialScore ?? 50}
                      label="אקטוארי"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-center hidden sm:table-cell">
                  <span className="text-sm font-medium">
                    {row.score.returnScore?.toFixed(0) ?? "-"}
                  </span>
                </TableCell>
                <TableCell className="text-center hidden sm:table-cell">
                  <span className="text-sm font-medium">
                    {row.score.feeScore?.toFixed(0) ?? "-"}
                  </span>
                </TableCell>
                <TableCell className="text-center hidden lg:table-cell text-xs">
                  {formatAssets(row.score.totalAssets)}
                </TableCell>
                <TableCell className="text-center hidden lg:table-cell text-sm">
                  {row.score.fundCount ?? "-"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {penalties.map((p, i) => (
                      <span
                        key={i}
                        className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
