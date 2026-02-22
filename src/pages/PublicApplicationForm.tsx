import PublicLayout from "@/components/layout/PublicLayout";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Send, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import FileUpload from "@/components/shared/FileUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface JobData {
  id: string;
  title: string;
  area: string;
  status: string;
  practical_case: string | null;
}

interface StageData {
  id: string;
  stage_key: string;
  label: string;
  stage_order: number;
  is_enabled: boolean;
}

interface QuestionData {
  id: string;
  stage_id: string;
  question_text: string;
  field_type: string;
  options: any;
  is_required: boolean;
  question_order: number;
}

export default function PublicApplicationForm() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<JobData | null>(null);
  const [stages, setStages] = useState<StageData[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    async function loadJob() {
      if (!jobId) return;
      const { data: jobData } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .eq("status", "active")
        .maybeSingle();

      if (!jobData) { setLoading(false); return; }
      setJob(jobData as JobData);

      const { data: stageData } = await supabase
        .from("job_stages")
        .select("*")
        .eq("job_id", jobId)
        .eq("is_enabled", true)
        .order("stage_order");
      setStages((stageData || []) as StageData[]);

      if (stageData?.length) {
        const stageIds = stageData.map((s: any) => s.id);
        const { data: questionData } = await supabase
          .from("stage_questions")
          .select("*")
          .in("stage_id", stageIds)
          .order("question_order");
        setQuestions((questionData || []) as QuestionData[]);
      }
      setLoading(false);
    }
    loadJob();
  }, [jobId]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PublicLayout>
    );
  }

  if (!job) {
    return (
      <PublicLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <h2 className="font-display text-xl font-bold text-foreground">Vaga não encontrada</h2>
            <p className="mt-2 text-sm text-muted-foreground">O link pode estar incorreto ou a vaga foi encerrada.</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Build form steps: always personal + CV first, then stage-based steps
  const formSteps: { type: "personal" | "cv" | "stage"; stageId?: string; label: string }[] = [
    { type: "personal", label: "Etapa 1" },
    { type: "cv", label: "Etapa 2" },
  ];

  // Add stages that have questions (skip cv_upload and application since they're handled)
  const questionStages = stages.filter(s => !["application", "cv_upload"].includes(s.stage_key) && questions.some(q => q.stage_id === s.id));
  questionStages.forEach((s, i) => {
    formSteps.push({ type: "stage", stageId: s.id, label: `Etapa ${i + 3}` });
  });

  const totalSteps = formSteps.length;
  const currentStep = formSteps[step];

  const handleCvUpload = async () => {
    if (!cvFile) {
      setCvError("Por favor, envie seu currículo antes de avançar.");
      return;
    }
    setAnalyzing(true);
    setCvError(null);
    try {
      const fileName = `${jobId}/${Date.now()}-${cvFile.name}`;
      const { error: uploadError } = await supabase.storage.from("cvs").upload(fileName, cvFile);
      if (uploadError) throw new Error("Erro ao enviar currículo: " + uploadError.message);
      setFormData(prev => ({ ...prev, __cv_url: fileName }));
      setStep(step + 1);
    } catch (e: any) {
      setCvError(e.message);
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleNext = () => {
    if (currentStep?.type === "cv") {
      handleCvUpload();
    } else {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Create candidate
      const { data: candidate, error: candidateError } = await supabase
        .from("candidates")
        .insert([{
          job_id: jobId,
          name: formData.name || "Sem nome",
          email: formData.email || "sem@email.com",
          phone: formData.phone || null,
          cv_url: formData.__cv_url || null,
          status: "in_progress",
        }])
        .select()
        .single();
      if (candidateError) throw candidateError;

      // Save responses
      const responseEntries = Object.entries(formData)
        .filter(([key]) => key.startsWith("q_"))
        .map(([key, value]) => ({
          candidate_id: candidate.id,
          question_id: key.replace("q_", ""),
          response_value: value,
        }));
      if (responseEntries.length > 0) {
        await supabase.from("candidate_responses").insert(responseEntries);
      }

      // Trigger CV analysis in background
      if (formData.__cv_url) {
        supabase.functions.invoke("analyze-cv", {
          body: { fileName: formData.__cv_url, candidateId: candidate.id, jobTitle: job.title },
        }).catch(() => {});
      }

      setSubmitted(true);
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
  const textareaClass = "min-h-[80px] w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  if (submitted) {
    return (
      <PublicLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
              <CheckCircle className="h-8 w-8 text-foreground" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">Candidatura Enviada!</h2>
            <p className="mt-2 text-muted-foreground">Sua aplicação para <strong>{job.title}</strong> será analisada.</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const progressPercent = ((step + 1) / totalSteps) * 100;

  return (
    <PublicLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">{job.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{job.area}</p>
      </div>

      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Etapa {step + 1} de {totalSteps}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        {currentStep?.type === "personal" && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-foreground">Etapa 1</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Nome Completo *</label>
                <input value={formData.name || ""} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className={inputClass} required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email *</label>
                <input type="email" value={formData.email || ""} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} className={inputClass} required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Telefone</label>
                <input value={formData.phone || ""} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} className={inputClass} />
              </div>
            </div>
          </div>
        )}

        {currentStep?.type === "cv" && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-foreground">Etapa 2</h2>
            <p className="text-sm text-muted-foreground">Envie seu currículo em PDF ou Word.</p>
            <FileUpload
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              label="Arraste seu currículo ou clique para selecionar"
              hint="Formatos aceitos: PDF, DOC, DOCX"
              icon="file"
              onChange={(file) => { setCvFile(file); setCvError(null); }}
            />
            {cvError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />{cvError}
              </div>
            )}
            {analyzing && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <p className="text-sm text-foreground">Enviando currículo...</p>
              </div>
            )}
          </div>
        )}

        {currentStep?.type === "stage" && currentStep.stageId && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-foreground">{currentStep.label}</h2>
            {questions
              .filter(q => q.stage_id === currentStep.stageId)
              .map((q) => (
                <div key={q.id}>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    {q.question_text}{q.is_required && " *"}
                  </label>
                  {q.field_type === "textarea" ? (
                    <textarea
                      value={formData[`q_${q.id}`] || ""}
                      onChange={(e) => setFormData(p => ({ ...p, [`q_${q.id}`]: e.target.value }))}
                      className={textareaClass}
                    />
                  ) : q.field_type === "select" && q.options ? (
                    <select
                      value={formData[`q_${q.id}`] || ""}
                      onChange={(e) => setFormData(p => ({ ...p, [`q_${q.id}`]: e.target.value }))}
                      className={inputClass}
                    >
                      <option value="">Selecione...</option>
                      {(Array.isArray(q.options) ? q.options : []).map((o: string) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : q.field_type === "number" ? (
                    <input
                      type="number"
                      value={formData[`q_${q.id}`] || ""}
                      onChange={(e) => setFormData(p => ({ ...p, [`q_${q.id}`]: e.target.value }))}
                      className={inputClass}
                    />
                  ) : (
                    <input
                      value={formData[`q_${q.id}`] || ""}
                      onChange={(e) => setFormData(p => ({ ...p, [`q_${q.id}`]: e.target.value }))}
                      className={inputClass}
                    />
                  )}
                </div>
              ))}
            {questions.filter(q => q.stage_id === currentStep.stageId).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma pergunta configurada para esta etapa.</p>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0 || analyzing}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            Voltar
          </button>
          {step < totalSteps - 1 ? (
            <button
              onClick={handleNext}
              disabled={analyzing || (currentStep?.type === "cv" && !cvFile) || (currentStep?.type === "personal" && (!formData.name || !formData.email))}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {analyzing && <Loader2 className="h-4 w-4 animate-spin" />}
              {currentStep?.type === "cv" ? (analyzing ? "Enviando..." : "Enviar Currículo") : "Próximo"}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition-all hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? "Enviando..." : "Enviar Candidatura"}
            </button>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
