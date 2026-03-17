import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

function getScoreColor(score: number) {
  if (score >= 80) return { ring: "stroke-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" };
  if (score >= 65) return { ring: "stroke-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
  if (score >= 50) return { ring: "stroke-orange-500", text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" };
  return { ring: "stroke-red-500", text: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "מצוין";
  if (score >= 65) return "טוב";
  if (score >= 50) return "בינוני";
  return "חלש";
}

const sizeConfig = {
  sm: { outer: 44, stroke: 3, fontSize: "text-sm", labelSize: "text-[8px]" },
  md: { outer: 60, stroke: 4, fontSize: "text-lg", labelSize: "text-[9px]" },
  lg: { outer: 88, stroke: 5, fontSize: "text-2xl", labelSize: "text-xs" },
};

export function ScoreGauge({ score, size = "md" }: ScoreGaugeProps) {
  const config = sizeConfig[size];
  const colors = getScoreColor(score);
  const radius = (config.outer - config.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      title={`ציון: ${score.toFixed(1)} - ${getScoreLabel(score)}`}
    >
      <svg width={config.outer} height={config.outer} className="-rotate-90">
        <circle
          cx={config.outer / 2}
          cy={config.outer / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          className="text-muted/50"
        />
        <circle
          cx={config.outer / 2}
          cy={config.outer / 2}
          r={radius}
          fill="none"
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          className={cn(colors.ring, "transition-all duration-700")}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold leading-none", config.fontSize, colors.text)}>
          {Math.round(score)}
        </span>
        {size !== "sm" && (
          <span className={cn("mt-0.5 text-muted-foreground", config.labelSize)}>
            {getScoreLabel(score)}
          </span>
        )}
      </div>
    </div>
  );
}

export function ScoreBar({ score, label }: { score: number; label: string }) {
  const colors = getScoreColor(score);
  const barColor =
    score >= 80
      ? "bg-emerald-500"
      : score >= 65
        ? "bg-amber-500"
        : score >= 50
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <span className="text-[11px] text-muted-foreground w-12 text-start font-medium">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${Math.max(score, 2)}%` }}
        />
      </div>
      <span className={cn("text-[10px] font-semibold w-5 text-end", colors.text)}>
        {Math.round(score)}
      </span>
    </div>
  );
}
