import { cn } from "@/lib/utils";
import { Classification } from "@/data/types";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

function getClassification(score: number): Classification {
  if (score >= 80) return "Forte";
  if (score >= 70) return "Desenvolvível";
  return "Risco";
}

const classColors: Record<Classification, string> = {
  Forte: "bg-success/10 text-success border-success/20",
  Desenvolvível: "bg-warning/10 text-warning border-warning/20",
  Risco: "bg-destructive/10 text-destructive border-destructive/20",
};

const sizeStyles = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
};

export default function ScoreBadge({ score, size = "md", showLabel = false }: ScoreBadgeProps) {
  const classification = getClassification(score);

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex items-center justify-center rounded-full border font-display font-bold",
          classColors[classification],
          sizeStyles[size]
        )}
      >
        {score}
      </div>
      {showLabel && (
        <span className={cn("rounded-md border px-2 py-0.5 text-xs font-semibold", classColors[classification])}>
          {classification}
        </span>
      )}
    </div>
  );
}

export { getClassification };
