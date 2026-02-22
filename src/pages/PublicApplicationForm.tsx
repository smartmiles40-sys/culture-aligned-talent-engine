import PublicLayout from "@/components/layout/PublicLayout";
import { MOCK_JOBS } from "@/data/mockData";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Send, CheckCircle, Loader2, FileCheck, AlertCircle } from "lucide-react";
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

interface CvAnalysis {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

export default function PublicApplicationForm() {
  const { jobId } = useParams<{ jobId: string }>();
  const job = MOCK_JOBS.find((j) => j.id === jobId);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [cvAnalysis, setCvAnalysis] = useState<CvAnalysis | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const { toast } = useToast();

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

  const isCommercial = job.area === "Comercial";
  // Steps: Personal, CV Upload, Technical, Commercial/Case, Culture
  const totalSteps = 5;

  const handleCvUploadAndAnalyze = async () => {
    if (!cvFile) {
      setCvError("Por favor, envie seu currículo antes de avançar.");
      return;
    }

    setAnalyzing(true);
    setCvError(null);

    try {
      // Upload CV to storage
      const fileName = `${jobId}/${Date.now()}-${cvFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("cvs")
        .upload(fileName, cvFile);

      if (uploadError) {
        throw new Error("Erro ao enviar currículo: " + uploadError.message);
      }

      // Call edge function to analyze
      const { data, error } = await supabase.functions.invoke("analyze-cv", {
        body: {
          cvPath: fileName,
          jobTitle: job.title,
          jobArea: job.area,
          requiredSkills: job.requiredSkills,
          behavioralProfile: job.behavioralProfile,
        },
      });

      if (error) throw new Error(error.message);

      setCvAnalysis(data as CvAnalysis);
      setStep(step + 1);
    } catch (e: any) {
      console.error("CV analysis error:", e);
      setCvError(e.message || "Erro ao analisar currículo. Tente novamente.");
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

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
  const inputClass = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
  const textareaClass = "min-h-[80px] w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  const handleNext = () => {
    if (step === 1) {
      // CV step — need to upload and analyze
      handleCvUploadAndAnalyze();
    } else {
      setStep(step + 1);
    }
  };

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
        {/* Step 0: Personal Data */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-foreground">Dados Pessoais</h2>
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
                <label className="mb-1.5 block text-sm font-medium text-foreground">LinkedIn (opcional)</label>
                <input className={inputClass} placeholder="https://linkedin.com/in/..." />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: CV Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-foreground">Envie seu Currículo</h2>
            <p className="text-sm text-muted-foreground">
              Envie seu currículo em PDF ou Word. Ele será analisado automaticamente para verificar a compatibilidade com a vaga.
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
                <div>
                  <p className="text-sm font-medium text-foreground">Analisando currículo com IA...</p>
                  <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Technical + CV Analysis Result */}
        {step === 2 && (
          <div className="space-y-4">
            {cvAnalysis && (
              <div className="mb-6 rounded-xl border border-border bg-muted/30 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileCheck className="h-5 w-5 text-foreground" />
                  <h3 className="font-display text-base font-bold text-foreground">Análise do Currículo</h3>
                </div>
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
                    cvAnalysis.score >= 70 ? "bg-accent/20 text-foreground" : cvAnalysis.score >= 50 ? "bg-warning/20 text-foreground" : "bg-destructive/10 text-destructive"
                  }`}>
                    {cvAnalysis.score}
                  </div>
                  <div>
                    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                      cvAnalysis.recommendation === "Recomendado" ? "bg-accent/20 text-foreground" :
                      cvAnalysis.recommendation === "Com Ressalvas" ? "bg-warning/20 text-foreground" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {cvAnalysis.recommendation}
                    </span>
                    <p className="mt-1 text-sm text-muted-foreground">{cvAnalysis.summary}</p>
                  </div>
                </div>
                {cvAnalysis.strengths.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-foreground mb-1">Pontos Fortes:</p>
                    <ul className="space-y-1">
                      {cvAnalysis.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-muted-foreground">✓ {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {cvAnalysis.weaknesses.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-foreground mb-1">Pontos de Atenção:</p>
                    <ul className="space-y-1">
                      {cvAnalysis.weaknesses.map((w, i) => (
                        <li key={i} className="text-xs text-muted-foreground">⚠ {w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <h2 className="font-display text-lg font-bold text-foreground">Triagem Técnica</h2>
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

        {/* Step 3: Commercial / Case */}
        {step === 3 && isCommercial && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-foreground">Performance Comercial</h2>
            <p className="text-sm text-muted-foreground">Responda com números reais e envie seu vídeo de apresentação.</p>
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
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-foreground">Vídeo de Apresentação</label>
              <FileUpload
                accept="video/mp4,video/quicktime,video/webm"
                label="Arraste seu vídeo ou clique para selecionar"
                hint="Formatos aceitos: MP4, MOV, WEBM • Máximo 2 minutos"
                icon="video"
              />
            </div>
          </div>
        )}

        {step === 3 && !isCommercial && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-foreground">Caso Prático</h2>
            {job.practicalCase && (
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="text-sm font-medium text-foreground">Instruções do caso:</p>
                <p className="mt-1 text-sm text-muted-foreground">{job.practicalCase}</p>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Sua resposta ao caso prático</label>
              <textarea className={textareaClass} rows={6} placeholder="Descreva sua solução..." />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Arquivo complementar (opcional)</label>
              <FileUpload
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                label="Arraste seu arquivo ou clique para selecionar"
                hint="PDF, Word, PowerPoint, Excel"
                icon="file"
              />
            </div>
          </div>
        )}

        {/* Step 4: Culture */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-foreground">Fit Cultural</h2>
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
              <p className="text-xs font-medium text-foreground">
                ⚡ Esta etapa é eliminatória. Score mínimo: 60/100. Responda com autenticidade.
              </p>
            </div>
            {CULTURE_QUESTIONS.map((q) => (
              <div key={q.id}>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{q.label}</label>
                <textarea className={textareaClass} />
              </div>
            ))}
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
              {step === 1 ? (analyzing ? "Analisando..." : "Enviar e Analisar") : "Próximo"}
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
    </PublicLayout>
  );
}
