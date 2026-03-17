/**
 * Unified score display utilities.
 * Single source of truth for score colors, labels, and backgrounds.
 * Score range is 35-95 (rescaled from raw scores).
 */

export function getScoreColor(score: number) {
  if (score >= 85) return "text-emerald-700";
  if (score >= 75) return "text-emerald-600";
  if (score >= 65) return "text-amber-700";
  if (score >= 55) return "text-orange-600";
  return "text-red-600";
}

export function getScoreBg(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 75) return "bg-emerald-400";
  if (score >= 65) return "bg-amber-500";
  if (score >= 55) return "bg-orange-500";
  return "bg-red-500";
}

export function getScoreRing(score: number) {
  if (score >= 85) return "stroke-emerald-500";
  if (score >= 75) return "stroke-emerald-400";
  if (score >= 65) return "stroke-amber-500";
  if (score >= 55) return "stroke-orange-500";
  return "stroke-red-500";
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return "מצוין";
  if (score >= 80) return "טוב מאוד";
  if (score >= 70) return "טוב";
  if (score >= 60) return "סביר";
  if (score >= 50) return "בינוני";
  return "חלש";
}

export function getScoreBadgeClasses(score: number) {
  if (score >= 85) return { ring: "stroke-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" };
  if (score >= 75) return { ring: "stroke-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
  if (score >= 65) return { ring: "stroke-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
  if (score >= 55) return { ring: "stroke-orange-500", text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" };
  return { ring: "stroke-red-500", text: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
}
