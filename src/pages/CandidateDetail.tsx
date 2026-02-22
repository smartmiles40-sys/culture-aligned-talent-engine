import AppLayout from "@/components/layout/AppLayout";
import { MOCK_CANDIDATES, MOCK_JOBS, STAGES } from "@/data/mockData";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { StageId } from "@/data/types";

function getClassification(score: number, cultureScore?: number, technicalScore?: number, minCulture = 60, minTechnical = 60) {
  if (cultureScore !== undefined && cultureScore < minCulture) return { label: "Risco", reason: `Cultura abaixo do mínimo (${cultureScore} < ${minCulture})`, color: "bg-destructive/10 text-destructive" };
  if (technicalScore !== undefined && technicalScore < minTechnical) return { label: "Risco", reason: `Score técnico abaixo do mínimo (${technicalScore} < ${minTechnical})`, color: "bg-destructive/10 text-destructive" };
  if (score >= 80) return { label: "Forte", reason: "Score final ≥ 80 — Aprovado", color: "bg-accent/20 text-foreground" };
  if (score >= 70) return { label: "Desenvolvível", reason: "Score final 70–79 — Reserva", color: "bg-warning/10 text-foreground" };
  return { label: "Risco", reason: "Score final < 70 — Reprovado", color: "bg-destructive/10 text-destructive" };
}

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const candidate = MOCK_CANDIDATES.find((c) => c.id === id);
  const job = candidate ? MOCK_JOBS.find((j) => j.id === candidate.jobId) : null;

  const [scores, setScores] = useState<Record<string, number>>(() => {
    if (!candidate) return {};
    const initial: Record<string, number> = {};
    Object.entries(candidate.scores).forEach(([key, val]) => {
      if (val) initial[key] = val.score;
    });
    return initial;
  });

  if (!candidate || !job) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Candidato não encontrado.</p>
        </div>
      </AppLayout>
    );
  }

  const weights = job.weights;
  const weightedScore = Object.entries(scores).reduce((acc, [stageId, score]) => {
    const weight = weights[stageId as StageId] || 0;
    return acc + (score * weight) / 100;
  }, 0);
  const finalScore = Math.round(weightedScore);

  const classification = getClassification(
    finalScore,
    scores.culture,
    scores.application,
    job.minCultureScore,
    job.minTechnicalScore
  );

  const updateScore = (stageId: string, value: number) => {
    setScores((prev) => ({ ...prev, [stageId]: Math.min(100, Math.max(0, value)) }));
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/candidatos" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">{candidate.name}</h1>
            <p className="text-sm text-muted-foreground">{candidate.email} • {job.title}</p>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-bold text-foreground">{finalScore}</div>
            <span className={cn("inline-block rounded-md px-2 py-0.5 text-xs font-semibold", classification.color)}>
              {classification.label}
            </span>
          </div>
        </div>

        {/* Classification criteria */}
        <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">Critério de Classificação</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{classification.reason}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
            <div className="rounded-md bg-muted p-2 text-center">
              <div className="font-semibold text-foreground">≥ 80</div>
              <div>Forte (Aprovado)</div>
            </div>
            <div className="rounded-md bg-muted p-2 text-center">
              <div className="font-semibold text-foreground">70–79</div>
              <div>Desenvolvível</div>
            </div>
            <div className="rounded-md bg-muted p-2 text-center">
              <div className="font-semibold text-foreground">&lt; 70</div>
              <div>Risco (Reprovado)</div>
            </div>
            <div className="rounded-md bg-muted p-2 text-center">
              <div className="font-semibold text-foreground">Cultura &lt; {job.minCultureScore}</div>
              <div>Eliminatório</div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {candidate.alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {candidate.alerts.map((alert, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {alert}
              </div>
            ))}
          </div>
        )}

        {/* Scores editing */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-4 font-display text-base font-bold text-foreground">Notas por Etapa</h2>
          <div className="space-y-4">
            {STAGES.map((stage) => {
              const hasScore = scores[stage.id] !== undefined;
              const weight = weights[stage.id as StageId] || 0;
              return (
                <div key={stage.id} className="flex items-center gap-4">
                  <div className="w-44">
                    <span className="text-sm text-foreground">{stage.label}</span>
                    <span className="ml-1 text-xs text-muted-foreground">({weight}%)</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={hasScore ? scores[stage.id] : ""}
                    placeholder="—"
                    onChange={(e) => updateScore(stage.id, Number(e.target.value))}
                    className="h-9 w-20 rounded-lg border border-input bg-background px-2 text-center text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          !hasScore ? "w-0" : (scores[stage.id] >= 80 ? "bg-accent" : scores[stage.id] >= 60 ? "bg-warning" : "bg-destructive")
                        )}
                        style={{ width: hasScore ? `${scores[stage.id]}%` : "0%" }}
                      />
                    </div>
                  </div>
                  <span className="w-8 text-right text-xs text-muted-foreground">
                    {hasScore ? scores[stage.id] : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weighted breakdown */}
        <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-3 font-display text-base font-bold text-foreground">Cálculo do Score Final</h2>
          <div className="space-y-2 text-sm">
            {STAGES.map((stage) => {
              const score = scores[stage.id];
              const weight = weights[stage.id as StageId] || 0;
              if (score === undefined) return null;
              const contribution = Math.round((score * weight) / 100);
              return (
                <div key={stage.id} className="flex justify-between text-muted-foreground">
                  <span>{stage.label}: {score} × {weight}%</span>
                  <span className="font-semibold text-foreground">{contribution}</span>
                </div>
              );
            })}
            <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground">
              <span>Score Final</span>
              <span>{finalScore}</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
