import AppLayout from "@/components/layout/AppLayout";
import StatCard from "@/components/dashboard/StatCard";
import { useJobs } from "@/hooks/useJobs";
import { useCandidates } from "@/hooks/useCandidates";
import { Briefcase, Users, Star, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: jobs = [], isLoading: jobsLoading } = useJobs();
  const { data: candidates = [], isLoading: candidatesLoading } = useCandidates();

  const activeJobs = jobs.filter((j) => j.status === "active");
  const strongCandidates = candidates.filter((c) => c.classification === "Forte");
  const avgCulture = candidates.length > 0
    ? Math.round(candidates.filter(c => c.final_score !== null).reduce((sum, c) => sum + (c.final_score || 0), 0) / (candidates.filter(c => c.final_score !== null).length || 1))
    : null;
  const topCandidates = [...candidates]
    .filter(c => c.final_score !== null)
    .sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
    .slice(0, 6);

  const isLoading = jobsLoading || candidatesLoading;

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Dashboard de Recrutamento</h1>
        <p className="mt-1 text-sm text-muted-foreground">Se Tu For, Eu Vou – Sistema de Recrutamento por Alta Performance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/vagas">
          <StatCard icon={Briefcase} label="Vagas Ativas" value={isLoading ? "..." : activeJobs.length} change={`${jobs.length} vagas total`} variant="accent" />
        </Link>
        <Link to="/candidatos">
          <StatCard icon={Users} label="Total Candidatos" value={isLoading ? "..." : candidates.length} />
        </Link>
        <Link to="/candidatos?classification=Forte">
          <StatCard icon={Star} label="Candidatos Fortes" value={isLoading ? "..." : strongCandidates.length} variant="success" />
        </Link>
        <StatCard
          icon={Shield}
          label="Score Médio"
          value={isLoading ? "..." : avgCulture !== null ? avgCulture : "—"}
          variant="warning"
          change={avgCulture !== null ? "Baseado em avaliações reais" : "Sem dados ainda"}
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">Top Candidatos</h2>
        {topCandidates.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">Nenhum candidato avaliado ainda</p>
            <p className="mt-1 text-xs text-muted-foreground">Crie uma vaga e divulgue o link para receber candidaturas</p>
            <Link
              to="/vagas"
              className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
            >
              Ver Vagas
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {topCandidates.map((c) => (
              <Link
                key={c.id}
                to={`/candidatos/${c.id}`}
                className="group block rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:shadow-card-hover"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
                      {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-foreground">{c.name}</h3>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-bold text-foreground">{Math.round(c.final_score || 0)}</div>
                    <span className={cn(
                      "inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                      c.classification === "Forte" ? "bg-success/10 text-foreground" :
                      c.classification === "Desenvolvível" ? "bg-warning/10 text-foreground" :
                      "bg-destructive/10 text-destructive"
                    )}>
                      {c.classification || "Pendente"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {activeJobs.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Vagas Ativas</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeJobs.map((job) => (
              <Link
                key={job.id}
                to={`/vagas/${job.id}/configurar`}
                className="group block rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:shadow-card-hover"
              >
                <h3 className="font-display text-sm font-bold text-foreground">{job.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{job.area}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {(job.required_skills || []).slice(0, 3).map((s) => (
                    <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground/70">{s}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
