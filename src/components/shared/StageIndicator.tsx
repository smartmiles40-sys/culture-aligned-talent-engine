import { cn } from "@/lib/utils";
import { STAGES } from "@/data/mockData";
import { StageId } from "@/data/types";

interface StageIndicatorProps {
  currentStage: StageId;
  compact?: boolean;
}

export default function StageIndicator({ currentStage, compact = false }: StageIndicatorProps) {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {STAGES.map((stage, i) => (
          <div
            key={stage.id}
            className={cn(
              "h-1.5 w-4 rounded-full transition-colors",
              i <= currentIndex ? "bg-accent" : "bg-muted"
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {STAGES.map((stage, i) => (
        <div key={stage.id} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
              i < currentIndex
                ? "bg-accent text-accent-foreground"
                : i === currentIndex
                ? "bg-accent text-accent-foreground animate-pulse-glow"
                : "bg-muted text-muted-foreground"
            )}
          >
            {stage.number}
          </div>
          {!compact && i < STAGES.length - 1 && (
            <div className={cn("h-0.5 w-6", i < currentIndex ? "bg-accent" : "bg-muted")} />
          )}
        </div>
      ))}
    </div>
  );
}
