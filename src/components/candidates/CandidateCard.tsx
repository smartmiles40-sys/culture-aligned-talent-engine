import { Candidate } from "@/data/types";
import { STAGES } from "@/data/mockData";
import ScoreBadge from "@/components/shared/ScoreBadge";
import StageIndicator from "@/components/shared/StageIndicator";
import { AlertTriangle, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface CandidateCardProps {
  candidate: Candidate;
}

export default function CandidateCard({ candidate }: CandidateCardProps) {
  const currentStageName = STAGES.find((s) => s.id === candidate.currentStage)?.label;

  return (
    <Link to={`/candidatos/${candidate.id}`} className="group block rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
              {candidate.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-foreground">{candidate.name}</h3>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                {candidate.email}
              </p>
            </div>
          </div>
        </div>
        <ScoreBadge score={candidate.finalScore} showLabel />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Etapa atual: <span className="font-semibold text-foreground">{currentStageName}</span></span>
          <span>{candidate.area}</span>
        </div>
        <div className="mt-2">
          <StageIndicator currentStage={candidate.currentStage} compact />
        </div>
      </div>

      {candidate.alerts.length > 0 && (
        <div className="mt-3 space-y-1">
          {candidate.alerts.map((alert, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-md bg-destructive/5 px-2 py-1 text-[11px] text-destructive"
            >
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              {alert}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1">
        {Object.entries(candidate.scores).map(([stageId, stageScore]) => {
          const stage = STAGES.find((s) => s.id === stageId);
          if (!stage || !stageScore) return null;
          return (
            <div
              key={stageId}
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-medium",
                stageScore.score >= 80
                  ? "bg-success/10 text-foreground"
                  : stageScore.score >= 60
                  ? "bg-warning/10 text-foreground"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {stage.label}: {stageScore.score}
            </div>
          );
        })}
      </div>
    </Link>
  );
}
