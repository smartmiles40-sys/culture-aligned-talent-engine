import AppLayout from "@/components/layout/AppLayout";
import { CULTURE_VALUES, AREAS } from "@/data/mockData";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Send, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import FileUpload from "@/components/shared/FileUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TECHNICAL_QUESTIONS = [
  { id: "experience", label: "Descreva sua experiência profissional relevante para esta vaga.", type: "textarea" },
  { id: "tools", label: "Quais ferramentas e softwares você domina?", type: "textarea" },
  { id: "channels", label: "Quais canais de atendimento você já utilizou profissionalmente?", type: "text" },
  { id: "salary", label: "Qual sua pretensão salarial?", type: "text" },
  { id: "availability", label: "Você tem disponibilidade para trabalho 100% presencial?", type: "select", options: ["Sim", "Não"] },
  { id: "previous", label: "Descreva sua experiência anterior mais relevante e os resultados alcançados.", type: "textarea" },
];

const COMMERCIAL_QUESTIONS = [
  { id: "monthly_goals", label: "Qual foi sua maior meta mensal atingida? Descreva números.", type: "textarea" },
  { id: "conversion", label: "Qual sua taxa de conversão média?", type: "text" },
  { id: "calls_volume", label: "Qual o volume de ligações/contatos que você fazia por dia?", type: "text" },
  { id: "results_history", label: "Descreva seu histórico de resultados nos últimos 6 meses.", type: "textarea" },
];

const CULTURE_QUESTIONS = [
  { id: "owner_thinking", label: "O que significa 'pensamento de dono' para você? Dê um exemplo real.", type: "textarea" },
  { id: "error_reaction", label: "Como você reage quando comete um erro no trabalho?", type: "textarea" },
  { id: "deadlines", label: "Como você lida com prazos apertados?", type: "textarea" },
  { id: "pressure", label: "Como você reage sob cobrança intensa?", type: "textarea" },
  { id: "conflicts", label: "Como você resolve conflitos com colegas de trabalho?", type: "textarea" },
  { id: "priorities", label: "Como você prioriza suas tarefas quando tudo é urgente?", type: "textarea" },
  { id: "growth", label: "Como você contribui para o crescimento da empresa além da sua função?", type: "textarea" },
  { id: "confidential", label: "Como você lida com informações confidenciais?", type: "textarea" },
  { id: "future", label: "Onde você se vê em 3 anos?", type: "textarea" },
  { id: "responsibility", label: "Se você não bater a meta, de quem é a responsabilidade?", type: "textarea" },
  { id: "transparency", label: "O que significa transparência no ambiente profissional?", type: "textarea" },
  { id: "meritocracy", label: "Você acredita que meritocracia deve ser rígida? Por quê?", type: "textarea" },
];

export default function ApplicationForm() {
  const [area, setArea] = useState<string>("Comercial");
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const { toast } = useToast();

  const isCommercial = area === "Comercial";

  // Steps: Dados Pessoais, Currículo, Triagem Técnica, [Performance Comercial], Fit Cultural, Revisão
  const totalSteps = isCommercial ? 6 : 5;

  const inputClass = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
  const textareaClass = "min-h-[80px] w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  const handleCvUploadAndAnalyze = async () => {
    if (!cvFile) {
      setCvError("Por favor, envie seu currículo antes de avançar.");
      return;
    }
    setAnalyzing(true);
    setCvError(null);
    try {
      const fileName = `internal/${Date.now()}-${cvFile.name}`;
      const { error: uploadError } = await supabase.storage.from("cvs").upload(fileName, cvFile);
      if (uploadError) throw new Error("Erro ao enviar currículo: " + uploadError.message);
      // Analysis is done internally, just advance
      setStep(step + 1);
      toast({ title: "Currículo enviado", description: "O currículo foi enviado com sucesso." });
    } catch (e: any) {
      setCvError(e.message || "Erro ao enviar currículo.");
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      handleCvUploadAndAnalyze();
    } else {
      setStep(step + 1);
    }
  };

  // Map step index to content
  const getStepContent = () => {
    // Step 0: Dados Pessoais
    if (step === 0) return "personal";
    // Step 1: Currículo
    if (step === 1) return "cv";
    // Step 2: Triagem Técnica
    if (step === 2) return "technical";
    // Step 3: Performance Comercial (only if commercial)
    if (isCommercial && step === 3) return "commercial";
    // Culture: step 3 (non-commercial) or step 4 (commercial)
    const cultureStep = isCommercial ? 4 : 3;
    if (step === cultureStep) return "culture";
    // Review: last step
    return "review";
  };

  const currentContent = getStepContent();

  if (submitted) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">Candidatura Enviada!</h2>
            <p className="mt-2 text-muted-foreground">Sua aplicação será analisada.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const progressPercent = ((step + 1) / totalSteps) * 100;

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Formulário de Candidatura</h1>
          <p className="mt-1 text-sm text-muted-foreground">Preencha todas as etapas com honestidade e clareza</p>
        </div>

        {/* Step indicator */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Etapa {step + 1} de {totalSteps}</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors",
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                Etapa {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-fade-in">
          {currentContent === "personal" && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-foreground">Etapa 1</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Nome Completo</label>
                  <input className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                  <input type="email" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Telefone</label>
                  <input className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Área de Interesse</label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className={inputClass}
                  >
                    {AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentContent === "cv" && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-foreground">Etapa 2</h2>
              <p className="text-sm text-muted-foreground">
                Envie seu currículo em PDF ou Word.
              </p>
              <FileUpload
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                label="Arraste seu currículo ou clique para selecionar"
                hint="Formatos aceitos: PDF, DOC, DOCX"
                icon="file"
                onChange={(file) => { setCvFile(file); setCvError(null); }}
              />
              {cvError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {cvError}
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

          {currentContent === "technical" && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-foreground">Etapa 3</h2>
              {TECHNICAL_QUESTIONS.map((q) => (
                <div key={q.id}>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{q.label}</label>
                  {q.type === "textarea" ? (
                    <textarea className={textareaClass} />
                  ) : q.type === "select" ? (
                    <select className={inputClass}>
                      {q.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input className={inputClass} />
                  )}
                </div>
              ))}
            </div>
          )}

          {currentContent === "commercial" && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-foreground">Etapa 4</h2>
              <p className="text-sm text-muted-foreground">Responda com números reais.</p>
              {COMMERCIAL_QUESTIONS.map((q) => (
                <div key={q.id}>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{q.label}</label>
                  {q.type === "textarea" ? (
                    <textarea className={textareaClass} />
                  ) : (
                    <input className={inputClass} />
                  )}
                </div>
              ))}
            </div>
          )}

          {currentContent === "culture" && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-foreground">Etapa {isCommercial ? 5 : 4}</h2>
              {CULTURE_QUESTIONS.map((q) => (
                <div key={q.id}>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{q.label}</label>
                  <textarea className={textareaClass} />
                </div>
              ))}
            </div>
          )}

          {currentContent === "review" && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-foreground">Etapa {totalSteps}</h2>
              <p className="text-sm text-muted-foreground">
                Revise suas respostas antes de enviar.
              </p>
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
                disabled={analyzing || (step === 1 && !cvFile)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {analyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                {step === 1 ? (analyzing ? "Enviando..." : "Enviar Currículo") : "Próximo"}
              </button>
            ) : (
              <button
                onClick={() => setSubmitted(true)}
                className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition-all hover:opacity-90"
              >
                <Send className="h-4 w-4" />
                Enviar Candidatura
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
