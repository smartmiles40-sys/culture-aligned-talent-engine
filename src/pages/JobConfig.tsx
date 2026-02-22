import AppLayout from "@/components/layout/AppLayout";
import { useJob, useUpdateJob } from "@/hooks/useJobs";
import { useJobStages, useCreateStage, useUpdateStage, useDeleteStage, useAllStageQuestions, useCreateQuestion, useUpdateQuestion, useDeleteQuestion, DEFAULT_STAGES } from "@/hooks/useStages";
import { useCandidatesByJob } from "@/hooks/useCandidates";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Copy, Check, Plus, X, Trash2, GripVertical, ChevronDown, ChevronUp, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const AREAS = ["Comercial", "Operações", "Marketing", "Financeiro", "Relacionamento"];
const FIELD_TYPES = [
  { value: "text", label: "Texto curto" },
  { value: "textarea", label: "Texto longo" },
  { value: "number", label: "Número" },
  { value: "select", label: "Múltipla escolha" },
  { value: "upload", label: "Upload" },
  { value: "url", label: "URL" },
];

export default function JobConfig() {
  const { jobId } = useParams<{ jobId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionType, setNewQuestionType] = useState("textarea");

  const { data: job, isLoading } = useJob(jobId);
  const { data: stages = [] } = useJobStages(jobId);
  const { data: questions = [] } = useAllStageQuestions(jobId);
  const { data: jobCandidates = [] } = useCandidatesByJob(jobId);
  const updateJob = useUpdateJob();
  const createStage = useCreateStage();
  const updateStage = useUpdateStage();
  const deleteStage = useDeleteStage();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();

  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [behavioralProfile, setBehavioralProfile] = useState("");
  const [practicalCase, setPracticalCase] = useState("");
  const [minCulture, setMinCulture] = useState(60);
  const [minTechnical, setMinTechnical] = useState(60);
  const [cultureRejection, setCultureRejection] = useState(true);
  const [initialized, setInitialized] = useState(false);

  if (job && !initialized) {
    setTitle(job.title);
    setArea(job.area);
    setSkills(job.required_skills || []);
    setBehavioralProfile(job.behavioral_profile || "");
    setPracticalCase(job.practical_case || "");
    setMinCulture(job.min_culture_score);
    setMinTechnical(job.min_technical_score);
    setCultureRejection(job.culture_rejection_enabled);
    setInitialized(true);
  }

  if (isLoading) return <AppLayout><div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">Carregando...</div></AppLayout>;
  if (!job) return <AppLayout><div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">Vaga não encontrada.</div></AppLayout>;

  const applicationLink = `${window.location.origin}/aplicar/${jobId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(applicationLink);
    setCopied(true);
    toast({ title: "Link copiado!", description: applicationLink });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    updateJob.mutate({
      id: job.id,
      title,
      area,
      required_skills: skills,
      behavioral_profile: behavioralProfile || null,
      practical_case: practicalCase || null,
      min_culture_score: minCulture,
      min_technical_score: minTechnical,
      culture_rejection_enabled: cultureRejection,
    } as any);
  };

  const handleCreateDefaultStages = () => {
    DEFAULT_STAGES.forEach((s, i) => {
      createStage.mutate({
        job_id: jobId,
        stage_key: s.stage_key,
        label: s.label,
        stage_order: s.stage_order,
        weight: s.weight,
        is_enabled: true,
      } as any);
    });
  };

  const handleAddQuestion = (stageId: string) => {
    if (!newQuestionText.trim()) return;
    const stageQuestions = questions.filter(q => q.stage_id === stageId);
    createQuestion.mutate({
      stage_id: stageId,
      question_text: newQuestionText.trim(),
      field_type: newQuestionType,
      is_required: true,
      question_order: stageQuestions.length + 1,
    } as any);
    setNewQuestionText("");
    setNewQuestionType("textarea");
  };

  const totalWeight = stages.filter(s => s.is_enabled).reduce((sum, s) => sum + s.weight, 0);

  const inputClass = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/vagas" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">Configurar Vaga</h1>
            <p className="text-sm text-muted-foreground">{job.title} • {jobCandidates.length} candidatos</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateJob.mutate({ id: job.id, status: job.status === "active" ? "draft" : "active" })}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                job.status === "active"
                  ? "bg-muted text-muted-foreground hover:bg-muted/80"
                  : "bg-success text-foreground hover:bg-success/80"
              )}
            >
              {job.status === "active" ? "Desativar" : "Ativar Vaga"}
            </button>
          </div>
        </div>

        {/* Link */}
        <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-card">
          <label className="mb-2 block text-sm font-semibold text-foreground">Link de Candidatura Externa</label>
          <div className="flex items-center gap-2">
            <input readOnly value={applicationLink} className={inputClass + " flex-1 bg-muted text-muted-foreground"} />
            <button onClick={handleCopyLink} className="flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic info */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-4 font-display text-base font-bold text-foreground">Informações Básicas</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Título</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Área</label>
                <select value={area} onChange={(e) => setArea(e.target.value)} className={inputClass}>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Perfil Comportamental</label>
                <input value={behavioralProfile} onChange={(e) => setBehavioralProfile(e.target.value)} className={inputClass} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={cultureRejection} onChange={(e) => setCultureRejection(e.target.checked)} className="h-4 w-4 rounded border-input" />
                <label className="text-sm text-foreground">Rejeição por cultura ativa</label>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-4 font-display text-base font-bold text-foreground">Competências Técnicas</h2>
            <div className="mb-3 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  {skill}
                  <button onClick={() => setSkills(skills.filter((s) => s !== skill))} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { if (newSkill.trim()) setSkills([...skills, newSkill.trim()]); setNewSkill(""); } }} placeholder="Adicionar competência..." className={inputClass + " flex-1"} />
              <button onClick={() => { if (newSkill.trim()) { setSkills([...skills, newSkill.trim()]); setNewSkill(""); } }} className="flex h-10 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Adicionar</button>
            </div>
          </div>

          {/* Stages */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-foreground">Etapas e Perguntas</h2>
              <span className={cn("text-sm font-bold", totalWeight === 100 ? "text-foreground" : "text-destructive")}>
                Peso total: {totalWeight}%
              </span>
            </div>

            {stages.length === 0 ? (
              <div className="py-8 text-center">
                <Settings className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Nenhuma etapa configurada</p>
                <button onClick={handleCreateDefaultStages} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  Criar Etapas Padrão
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {stages.map((stage) => {
                  const stageQuestions = questions.filter(q => q.stage_id === stage.id);
                  const isExpanded = expandedStage === stage.id;
                  return (
                    <div key={stage.id} className="rounded-lg border border-border bg-background">
                      <div className="flex items-center gap-3 p-3">
                        <button onClick={() => setExpandedStage(isExpanded ? null : stage.id)} className="text-muted-foreground">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        <div className="flex-1">
                          <input
                            value={stage.label}
                            onChange={(e) => updateStage.mutate({ id: stage.id, label: e.target.value })}
                            className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={stage.is_enabled}
                            onChange={(e) => updateStage.mutate({ id: stage.id, is_enabled: e.target.checked })}
                            className="h-4 w-4 rounded border-input"
                          />
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={stage.weight}
                            onChange={(e) => updateStage.mutate({ id: stage.id, weight: Number(e.target.value) })}
                            className="h-8 w-16 rounded border border-input bg-background px-2 text-center text-xs"
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                          <button onClick={() => deleteStage.mutate(stage.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border p-3">
                          <div className="space-y-2">
                            {stageQuestions.map((q) => (
                              <div key={q.id} className="flex items-start gap-2 rounded-md bg-muted/50 p-2">
                                <div className="flex-1">
                                  <input
                                    value={q.question_text}
                                    onChange={(e) => updateQuestion.mutate({ id: q.id, question_text: e.target.value })}
                                    className="w-full bg-transparent text-sm text-foreground focus:outline-none"
                                  />
                                  <div className="mt-1 flex items-center gap-2">
                                    <select
                                      value={q.field_type}
                                      onChange={(e) => updateQuestion.mutate({ id: q.id, field_type: e.target.value })}
                                      className="h-6 rounded border border-input bg-background px-1 text-[10px]"
                                    >
                                      {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                                    </select>
                                    <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                      <input
                                        type="checkbox"
                                        checked={q.is_required}
                                        onChange={(e) => updateQuestion.mutate({ id: q.id, is_required: e.target.checked })}
                                        className="h-3 w-3"
                                      />
                                      Obrigatória
                                    </label>
                                  </div>
                                </div>
                                <button onClick={() => deleteQuestion.mutate(q.id)} className="rounded p-1 text-muted-foreground hover:text-destructive">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <input
                              value={newQuestionText}
                              onChange={(e) => setNewQuestionText(e.target.value)}
                              placeholder="Nova pergunta..."
                              className="h-8 flex-1 rounded border border-input bg-background px-2 text-sm"
                            />
                            <select value={newQuestionType} onChange={(e) => setNewQuestionType(e.target.value)} className="h-8 rounded border border-input bg-background px-2 text-xs">
                              {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                            </select>
                            <button onClick={() => handleAddQuestion(stage.id)} className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Eliminatory */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-4 font-display text-base font-bold text-foreground">Critérios Eliminatórios</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Score Mínimo Cultural</label>
                <input type="number" min={0} max={100} value={minCulture} onChange={(e) => setMinCulture(Number(e.target.value))} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Score Mínimo Técnico</label>
                <input type="number" min={0} max={100} value={minTechnical} onChange={(e) => setMinTechnical(Number(e.target.value))} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end pb-8">
            <button onClick={handleSave} disabled={updateJob.isPending} className="rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-accent-foreground hover:opacity-90 disabled:opacity-50">
              {updateJob.isPending ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
