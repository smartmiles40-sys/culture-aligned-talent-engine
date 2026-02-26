import AppLayout from "@/components/layout/AppLayout";
import { useCandidate, useUpdateCandidate, useDeleteCandidate } from "@/hooks/useCandidates";
import { useJob } from "@/hooks/useJobs";
import { useJobStages } from "@/hooks/useStages";
import { useCandidateEvaluations, useUpsertEvaluation, useCandidateDisc, useUpsertDisc } from "@/hooks/useEvaluations";
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Info, Trash2, Archive, Edit2, Upload, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const { data: candidate, isLoading } = useCandidate(id);
  const { data: job } = useJob(candidate?.job_id);
  const { data: stages = [] } = useJobStages(candidate?.job_id);
  const { data: evaluations = [] } = useCandidateEvaluations(id);
  const { data: disc } = useCandidateDisc(id);
  const upsertEval = useUpsertEvaluation();
  const upsertDisc = useUpsertDisc();
  const updateCandidate = useUpdateCandidate();
  const deleteCandidate = useDeleteCandidate();

  if (isLoading) {
    return <AppLayout><div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">Carregando...</div></AppLayout>;
  }

  if (!candidate) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Candidato não encontrado.</p>
        </div>
      </AppLayout>
    );
  }

  const scorableStages = stages.filter(s => s.is_enabled && s.weight > 0);
  const totalWeight = scorableStages.reduce((sum, s) => sum + s.weight, 0);

  const getEvalScore = (stageId: string) => {
    const ev = evaluations.find(e => e.stage_id === stageId);
    return ev?.score ?? null;
  };

  const finalScore = totalWeight > 0
    ? scorableStages.reduce((sum, s) => {
        const sc = getEvalScore(s.id);
        return sc !== null ? sum + (sc * s.weight) / totalWeight : sum;
      }, 0)
    : null;

  const classification = finalScore === null ? null
    : finalScore >= 80 ? "Forte"
    : finalScore >= 70 ? "Desenvolvível"
    : "Risco";

  const handleScoreChange = (stageId: string, value: number) => {
    upsertEval.mutate({
      candidate_id: candidate.id,
      stage_id: stageId,
      score: Math.min(100, Math.max(0, value)),
      evaluator_id: user?.id,
    });
  };

  const handleEdit = () => {
    setEditName(candidate.name);
    setEditEmail(candidate.email);
    setEditing(true);
  };

  const handleSaveEdit = () => {
    updateCandidate.mutate({ id: candidate.id, name: editName, email: editEmail });
    setEditing(false);
  };

  const handleDelete = () => {
    deleteCandidate.mutate(candidate.id);
    navigate("/candidatos");
  };

  const inputClass = "h-9 w-20 rounded-lg border border-input bg-background px-2 text-center text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/candidatos" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 rounded-lg border border-input bg-background px-2 text-sm font-bold" />
                <input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="h-8 rounded-lg border border-input bg-background px-2 text-sm" />
                <button onClick={handleSaveEdit} className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Salvar</button>
                <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground">Cancelar</button>
              </div>
            ) : (
              <>
                <h1 className="font-display text-2xl font-bold text-foreground">{candidate.name}</h1>
                <p className="text-sm text-muted-foreground">{candidate.email} • {job?.title || "—"}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleEdit} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title="Editar">
              <Edit2 className="h-4 w-4" />
            </button>
            <button onClick={() => updateCandidate.mutate({ id: candidate.id, status: "archived" })} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title="Arquivar">
              <Archive className="h-4 w-4" />
            </button>
            <button onClick={() => setShowDelete(true)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10" title="Excluir">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Score */}
        <div className="mb-6 flex items-center gap-6 rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="text-center">
            <div className="font-display text-4xl font-bold text-foreground">
              {finalScore !== null ? Math.round(finalScore) : "—"}
            </div>
            <span className={cn(
              "inline-block rounded-md px-2 py-0.5 text-xs font-semibold",
              classification === "Forte" ? "bg-success/10 text-foreground" :
              classification === "Desenvolvível" ? "bg-warning/10 text-foreground" :
              classification === "Risco" ? "bg-destructive/10 text-destructive" :
              "bg-muted text-muted-foreground"
            )}>
              {classification || "Pendente"}
            </span>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
              <div className="rounded-md bg-muted p-2 text-center">
                <div className="font-semibold text-foreground">≥ 80</div>
                <div>Forte</div>
              </div>
              <div className="rounded-md bg-muted p-2 text-center">
                <div className="font-semibold text-foreground">70–79</div>
                <div>Desenvolvível</div>
              </div>
              <div className="rounded-md bg-muted p-2 text-center">
                <div className="font-semibold text-foreground">&lt; 70</div>
                <div>Risco</div>
              </div>
              <div className="rounded-md bg-muted p-2 text-center">
                <div className="font-semibold text-foreground">Cultura &lt; {job?.min_culture_score || 60}</div>
                <div>Eliminatório</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {candidate.alerts?.length > 0 && (
          <div className="mb-6 space-y-2">
            {candidate.alerts.map((alert, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {alert}
              </div>
            ))}
          </div>
        )}

        {/* CV info */}
        {candidate.cv_url && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-card">
            <h2 className="mb-2 font-display text-sm font-bold text-foreground">Currículo</h2>
            <a href={candidate.cv_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-info hover:underline">
              <ExternalLink className="h-4 w-4" /> Ver currículo
            </a>
          </div>
        )}

        {/* CV Analysis */}
        {candidate.cv_analysis && typeof candidate.cv_analysis === "object" && (
          <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-3 font-display text-base font-bold text-foreground">Análise de CV (IA)</h2>
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 px-3 py-1.5 text-center">
                <div className="font-display text-2xl font-bold text-foreground">{(candidate.cv_analysis as any).score ?? "—"}</div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
              <span className={cn(
                "rounded-md px-2 py-1 text-xs font-semibold",
                (candidate.cv_analysis as any).recommendation === "Recomendado" ? "bg-success/10 text-foreground" :
                (candidate.cv_analysis as any).recommendation === "Não Recomendado" ? "bg-destructive/10 text-destructive" :
                "bg-warning/10 text-foreground"
              )}>
                {(candidate.cv_analysis as any).recommendation}
              </span>
            </div>
            {(candidate.cv_analysis as any).summary && (
              <p className="mb-3 text-sm text-muted-foreground">{(candidate.cv_analysis as any).summary}</p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(candidate.cv_analysis as any).strengths?.length > 0 && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold text-foreground">Pontos Fortes</h3>
                  <ul className="space-y-1">
                    {(candidate.cv_analysis as any).strengths.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="mt-0.5 text-success">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(candidate.cv_analysis as any).weaknesses?.length > 0 && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold text-foreground">Pontos de Atenção</h3>
                  <ul className="space-y-1">
                    {(candidate.cv_analysis as any).weaknesses.map((w: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="mt-0.5 text-warning">!</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scores editing */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-4 font-display text-base font-bold text-foreground">Notas por Etapa</h2>
          {scorableStages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma etapa configurada para esta vaga. <Link to={`/vagas/${candidate.job_id}/configurar`} className="text-info hover:underline">Configurar etapas</Link></p>
          ) : (
            <div className="space-y-4">
              {scorableStages.map((stage) => {
                const score = getEvalScore(stage.id);
                return (
                  <div key={stage.id} className="flex items-center gap-4">
                    <div className="w-44">
                      <span className="text-sm text-foreground">{stage.label}</span>
                      <span className="ml-1 text-xs text-muted-foreground">({stage.weight}%)</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={score !== null ? score : ""}
                      placeholder="—"
                      onChange={(e) => handleScoreChange(stage.id, Number(e.target.value))}
                      className={inputClass}
                    />
                    <div className="flex-1">
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            score === null ? "w-0" : (score >= 80 ? "bg-accent" : score >= 60 ? "bg-warning" : "bg-destructive")
                          )}
                          style={{ width: score !== null ? `${score}%` : "0%" }}
                        />
                      </div>
                    </div>
                    <span className="w-8 text-right text-xs text-muted-foreground">
                      {score !== null ? score : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DISC */}
        <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-4 font-display text-base font-bold text-foreground">DISC / Temperamento</h2>
          {disc ? (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "D", value: disc.d_score },
                  { label: "I", value: disc.i_score },
                  { label: "S", value: disc.s_score },
                  { label: "C", value: disc.c_score },
                ].map(item => (
                  <div key={item.label} className="rounded-lg bg-muted p-3 text-center">
                    <div className="font-display text-lg font-bold text-foreground">{item.value ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
              {disc.summary && <p className="text-sm text-muted-foreground">{disc.summary}</p>}
              {disc.external_url && (
                <a href={disc.external_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-info hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" /> Link externo
                </a>
              )}
              {disc.file_url && (
                <a href={disc.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-info hover:underline">
                  <Upload className="h-3.5 w-3.5" /> Arquivo DISC
                </a>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Não coletado</p>
              <p className="mt-1 text-xs text-muted-foreground">Upload manual ou link externo pode ser adicionado pelo recrutador</p>
            </div>
          )}
        </div>

        {/* Score breakdown */}
        {scorableStages.length > 0 && (
          <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-3 font-display text-base font-bold text-foreground">Cálculo do Score Final</h2>
            <div className="space-y-2 text-sm">
              {scorableStages.map((stage) => {
                const score = getEvalScore(stage.id);
                if (score === null) return (
                  <div key={stage.id} className="flex justify-between text-muted-foreground">
                    <span>{stage.label}</span>
                    <span className="italic">Pendente</span>
                  </div>
                );
                const contribution = totalWeight > 0 ? Math.round((score * stage.weight) / totalWeight) : 0;
                return (
                  <div key={stage.id} className="flex justify-between text-muted-foreground">
                    <span>{stage.label}: {score} × {stage.weight}%</span>
                    <span className="font-semibold text-foreground">{contribution}</span>
                  </div>
                );
              })}
              <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground">
                <span>Score Final</span>
                <span>{finalScore !== null ? Math.round(finalScore) : "—"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir candidato?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
