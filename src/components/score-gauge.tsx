import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
  if (score >= 65) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  if (score >= 50) return "text-orange-600 bg-orange-50 border-orange-200";
  return "text-red-600 bg-red-50 border-red-200";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "מצוין";
  if (score >= 65) return "טוב";
  if (score >= 50) return "בינוני";
  return "חלש";
}

const sizeClasses = {
  sm: "w-10 h-10 text-xs",
  md: "w-14 h-14 text-sm",
  lg: "w-20 h-20 text-lg",
};

export function ScoreGauge({ score, size = "md" }: ScoreGaugeProps) {
  return (
    <div
      className={cn(
        "rounded-full border-2 flex items-center justify-center font-bold",
        getScoreColor(score),
        sizeClasses[size]
      )}
      title={`ציון: ${score.toFixed(1)} - ${getScoreLabel(score)}`}
    >
      {Math.round(score)}
    </div>
  );
}

export function ScoreBar({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80
      ? "bg-green-500"
      : score >= 65
        ? "bg-yellow-500"
        : score >= 50
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <span className="text-xs text-muted-foreground w-12 text-start">
        {label}
      </span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${Math.max(score, 2)}%` }}
        />
      </div>
    </div>
  );
}
