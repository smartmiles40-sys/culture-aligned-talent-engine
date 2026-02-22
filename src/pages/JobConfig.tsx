import AppLayout from "@/components/layout/AppLayout";
import { MOCK_JOBS, AREAS, STAGES } from "@/data/mockData";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Copy, Check, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StageId } from "@/data/types";

export default function JobConfig() {
  const { jobId } = useParams<{ jobId: string }>();
  const job = MOCK_JOBS.find((j) => j.id === jobId);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const [area, setArea] = useState<string>(job?.area || "Comercial");
  const [skills, setSkills] = useState<string[]>(job?.requiredSkills || []);
  const [newSkill, setNewSkill] = useState("");
  const [behavioralProfile, setBehavioralProfile] = useState(job?.behavioralProfile || "");
  const [practicalCase, setPracticalCase] = useState(job?.practicalCase || "");
  const [minCulture, setMinCulture] = useState(job?.minCultureScore || 60);
  const [minTechnical, setMinTechnical] = useState(job?.minTechnicalScore || 60);
  const [weights, setWeights] = useState<Record<string, number>>(
    job?.weights || { application: 15, video_or_case: 25, culture: 25, disc: 5, online_interview: 15, in_person: 15 }
  );

  if (!job) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Vaga não encontrada.</p>
        </div>
      </AppLayout>
    );
  }

  const applicationLink = `${window.location.origin}/aplicar/${jobId}`;
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(applicationLink);
    setCopied(true);
    toast({ title: "Link copiado!", description: applicationLink });
    setTimeout(() => setCopied(false), 2000);
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const updateWeight = (stageId: string, value: number) => {
    setWeights((prev) => ({ ...prev, [stageId]: value }));
  };

  const inputClass = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/vagas" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Configurar Vaga</h1>
            <p className="text-sm text-muted-foreground">{job.title}</p>
          </div>
        </div>

        {/* Link externo */}
        <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-card">
          <label className="mb-2 block text-sm font-semibold text-foreground">Link de Candidatura Externa</label>
          <div className="flex items-center gap-2">
            <input readOnly value={applicationLink} className={inputClass + " flex-1 bg-muted text-muted-foreground"} />
            <button
              onClick={handleCopyLink}
              className="flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Área */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-4 font-display text-base font-bold text-foreground">Informações Básicas</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>
          </div>

          {/* Skills */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-4 font-display text-base font-bold text-foreground">Competências Técnicas</h2>
            <div className="mb-3 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  {skill}
                  <button onClick={() => setSkills(skills.filter((s) => s !== skill))} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill()}
                placeholder="Adicionar competência..."
                className={inputClass + " flex-1"}
              />
              <button onClick={addSkill} className="flex h-10 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">
                <Plus className="h-4 w-4" /> Adicionar
              </button>
            </div>
          </div>

          {/* Caso Prático */}
          {area !== "Comercial" && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h2 className="mb-4 font-display text-base font-bold text-foreground">Caso Prático</h2>
              <textarea
                value={practicalCase}
                onChange={(e) => setPracticalCase(e.target.value)}
                rows={4}
                placeholder="Descreva o caso prático que o candidato deverá resolver..."
                className="min-h-[100px] w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {/* Pesos */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-foreground">Pesos das Etapas</h2>
              <span className={`text-sm font-bold ${totalWeight === 100 ? "text-foreground" : "text-destructive"}`}>
                Total: {totalWeight}%
              </span>
            </div>
            <div className="space-y-4">
              {STAGES.map((stage) => (
                <div key={stage.id} className="flex items-center gap-4">
                  <span className="w-40 text-sm text-foreground">{stage.label}</span>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={weights[stage.id] || 0}
                    onChange={(e) => updateWeight(stage.id, Number(e.target.value))}
                    className="flex-1 accent-accent"
                  />
                  <span className="w-12 text-right text-sm font-semibold text-foreground">{weights[stage.id] || 0}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scores mínimos */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-4 font-display text-base font-bold text-foreground">Critérios Eliminatórios</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Score Mínimo Cultural</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={minCulture}
                  onChange={(e) => setMinCulture(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Score Mínimo Técnico</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={minTechnical}
                  onChange={(e) => setMinTechnical(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end pb-8">
            <button
              onClick={() => toast({ title: "Configurações salvas!", description: "As alterações foram aplicadas à vaga." })}
              className="rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-accent-foreground hover:opacity-90"
            >
              Salvar Configurações
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
