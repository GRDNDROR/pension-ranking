import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PenaltyBadgeProps {
  label: string;
  description: string;
}

export function PenaltyBadge({ label, description }: PenaltyBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="destructive"
          className="text-[10px] cursor-help whitespace-nowrap"
        >
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[250px]">
        <p className="text-xs">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
