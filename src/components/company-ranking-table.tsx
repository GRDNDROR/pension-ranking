"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { FUND_LIMITATIONS } from "@/lib/constants/funds";

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

type SortField = "rank" | "score" | "returns" | "actuarial" | "service" | "claims";

interface CompanyRankingTableProps {
  rankings: CompanyRankingRow[];
}

// Score range is 35-95 (rescaled). Thresholds calibrated accordingly.
function getScoreColor(score: number) {
  if (score >= 85) return "text-emerald-700";
  if (score >= 75) return "text-emerald-600";
  if (score >= 65) return "text-amber-700";
  if (score >= 55) return "text-orange-600";
  return "text-red-600";
}

function getScoreBg(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 75) return "bg-emerald-400";
  if (score >= 65) return "bg-amber-500";
  if (score >= 55) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "מצוין";
  if (score >= 80) return "טוב מאוד";
  if (score >= 70) return "טוב";
  if (score >= 60) return "סביר";
  if (score >= 50) return "בינוני";
  return "חלש";
}

function getRankBadge(rank: number | null) {
  if (rank === 1) return "bg-amber-100 text-amber-800 border-amber-300";
  if (rank === 2) return "bg-slate-100 text-slate-700 border-slate-300";
  if (rank === 3) return "bg-orange-100 text-orange-800 border-orange-300";
  return "bg-muted text-muted-foreground border-border";
}

function ScoreBar({ score, label, weight }: { score: number; label: string; weight: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground w-14 text-start shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted/80 rounded-full overflow-hidden min-w-[60px]">
        <div
          className={cn("h-full rounded-full transition-all", getScoreBg(score))}
          style={{ width: `${Math.max(score, 3)}%` }}
        />
      </div>
      <span className={cn("text-[11px] font-semibold w-8 text-start tabular-nums", getScoreColor(score))}>
        {Math.round(score)}
      </span>
      <span className="text-[9px] text-muted-foreground/60 w-8">{weight}</span>
    </div>
  );
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
        case "actuarial":
          aVal = a.score.actuarialScore ?? -999;
          bVal = b.score.actuarialScore ?? -999;
          break;
        case "service":
          aVal = a.score.serviceScore ?? -999;
          bVal = b.score.serviceScore ?? -999;
          break;
        case "claims":
          aVal = a.score.claimsScore ?? -999;
          bVal = b.score.claimsScore ?? -999;
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
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground px-1 flex-wrap">
        <span>ציונים מ-0 עד 100. ככל שהציון גבוה יותר, כך איכות הקרן טובה יותר.</span>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {sortedRankings.map((row) => {
          const penalties = getCompanyPenalties(row.company.id);
          const score = row.score.overallScore;

          return (
            <a
              key={row.company.id}
              href={`/company/${row.company.id}`}
              className="block rounded-xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-md transition-all p-4 sm:p-5"
            >
              <div className="flex items-start gap-4">
                {/* Rank */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className={cn(
                    "inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold border",
                    getRankBadge(row.score.rank)
                  )}>
                    {row.score.rank}
                  </span>
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{row.company.nameHebrew}</h3>
                      {penalties.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {penalties.map((p, i) => (
                            <span key={i} className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Overall score */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={cn(
                        "text-3xl font-black tabular-nums",
                        getScoreColor(score)
                      )}>
                        {Math.round(score)}
                      </div>
                      <span className={cn("text-xs font-medium", getScoreColor(score))}>
                        {getScoreLabel(score)}
                      </span>
                    </div>
                  </div>

                  {/* Score breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <ScoreBar
                      score={row.score.returnScore ?? 50}
                      label="תשואות"
                      weight="35%"
                    />
                    <ScoreBar
                      score={row.score.actuarialScore ?? 50}
                      label="אקטוארי"
                      weight="25%"
                    />
                    <ScoreBar
                      score={row.score.serviceScore ?? 50}
                      label="שירות"
                      weight="15%"
                    />
                    <ScoreBar
                      score={row.score.claimsScore ?? 50}
                      label="תביעות"
                      weight="10%"
                    />
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <span>מיין לפי:</span>
        {[
          { field: "rank" as SortField, label: "דירוג" },
          { field: "score" as SortField, label: "ציון כולל" },
          { field: "returns" as SortField, label: "תשואות" },
          { field: "actuarial" as SortField, label: "אקטוארי" },
          { field: "service" as SortField, label: "שירות" },
        ].map(({ field, label }) => (
          <button
            key={field}
            onClick={() => handleSort(field)}
            className={cn(
              "px-3 py-1.5 rounded-full border transition-colors",
              sortField === field
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:border-primary/50"
            )}
          >
            {label}{sortField === field ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
