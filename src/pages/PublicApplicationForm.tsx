import PublicLayout from "@/components/layout/PublicLayout";
import { MOCK_JOBS, CULTURE_VALUES } from "@/data/mockData";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Send, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import FileUpload from "@/components/shared/FileUpload";

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

export default function PublicApplicationForm() {
  const { jobId } = useParams<{ jobId: string }>();
  const job = MOCK_JOBS.find((j) => j.id === jobId);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

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
  const totalSteps = 4; // Personal, Technical, Commercial/Case, Culture
  const stepLabels = ["Dados Pessoais", "Triagem Técnica", isCommercial ? "Performance Comercial" : "Caso Prático", "Fit Cultural"];

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

  return (
    <PublicLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">{job.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{job.area}</p>
      </div>

      {/* Simple progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Etapa {step + 1} de {totalSteps}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
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

        {step === 1 && (
          <div className="space-y-4">
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

        {step === 2 && isCommercial && (
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

        {step === 2 && !isCommercial && (
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

        {step === 3 && (
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
            disabled={step === 0}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            Voltar
          </button>
          {step < totalSteps - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
            >
              Próximo
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
