import AppLayout from "@/components/layout/AppLayout";
import { CULTURE_VALUES, AREAS } from "@/data/mockData";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Send, CheckCircle } from "lucide-react";

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

  const isCommercial = area === "Comercial";
  const steps = [
    { title: "Dados Pessoais", id: "personal" },
    { title: "Triagem Técnica", id: "technical" },
    ...(isCommercial ? [{ title: "Performance Comercial", id: "commercial" }] : []),
    { title: "Fit Cultural", id: "culture" },
    { title: "Revisão", id: "review" },
  ];

  if (submitted) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">Candidatura Enviada!</h2>
            <p className="mt-2 text-muted-foreground">Sua aplicação será analisada pela IA e pelo time de recrutamento.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Formulário de Candidatura</h1>
          <p className="mt-1 text-sm text-muted-foreground">Preencha todas as etapas com honestidade e clareza</p>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <button
                onClick={() => setStep(i)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors",
                  i === step
                    ? "bg-secondary text-secondary-foreground"
                    : i < step
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <span className="font-display">{i + 1}</span>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
              {i < steps.length - 1 && <div className="h-0.5 w-4 bg-muted" />}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-fade-in">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-foreground">Dados Pessoais</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Nome Completo</label>
                  <input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                  <input type="email" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Telefone</label>
                  <input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Área de Interesse</label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
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
                    <textarea className="min-h-[80px] w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  ) : q.type === "select" ? (
                    <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                      {q.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 2 && isCommercial && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-foreground">Performance Comercial</h2>
              <p className="text-sm text-muted-foreground">Estas perguntas são específicas para vagas comerciais. Responda com números reais.</p>
              {COMMERCIAL_QUESTIONS.map((q) => (
                <div key={q.id}>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{q.label}</label>
                  {q.type === "textarea" ? (
                    <textarea className="min-h-[80px] w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  ) : (
                    <input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  )}
                </div>
              ))}
            </div>
          )}

          {step === (isCommercial ? 3 : 2) && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-foreground">Fit Cultural Profundo</h2>
              <div className="rounded-lg bg-accent/10 p-3">
                <p className="text-xs font-medium text-accent-foreground">
                  ⚡ Esta etapa é eliminatória. Score mínimo: 60/100. Responda com autenticidade.
                </p>
              </div>
              {CULTURE_QUESTIONS.map((q) => (
                <div key={q.id}>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{q.label}</label>
                  <textarea className="min-h-[80px] w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              ))}
            </div>
          )}

          {step === steps.length - 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-foreground">Revisão Final</h2>
              <p className="text-sm text-muted-foreground">
                Revise suas respostas antes de enviar. A candidatura será avaliada automaticamente pela IA e também pelo time de recrutamento.
              </p>
              <div className="rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold text-foreground">Pontuação Final (modelo padrão)</h3>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between"><span>Vídeo / Caso Prático</span><span className="font-semibold text-foreground">25%</span></div>
                  <div className="flex justify-between"><span>Fit Cultural</span><span className="font-semibold text-foreground">25%</span></div>
                  <div className="flex justify-between"><span>Aplicação Técnica</span><span className="font-semibold text-foreground">15%</span></div>
                  <div className="flex justify-between"><span>DISC</span><span className="font-semibold text-foreground">5%</span></div>
                  <div className="flex justify-between"><span>Entrevista Online</span><span className="font-semibold text-foreground">15%</span></div>
                  <div className="flex justify-between"><span>Presencial</span><span className="font-semibold text-foreground">15%</span></div>
                </div>
              </div>
              <div className="rounded-lg bg-destructive/5 p-3 text-xs text-destructive">
                <strong>Regras eliminatórias:</strong> Cultura &lt; 60 → Reprovação automática | Caso técnico &lt; 60 → Reprovação automática
              </div>
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
            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={() => setSubmitted(true)}
                className="flex items-center gap-2 rounded-lg gradient-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition-all hover:opacity-90"
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
