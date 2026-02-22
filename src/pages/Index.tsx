import AppLayout from "@/components/layout/AppLayout";
import StatCard from "@/components/dashboard/StatCard";
import CandidateCard from "@/components/candidates/CandidateCard";
import JobCard from "@/components/jobs/JobCard";
import { MOCK_CANDIDATES, MOCK_JOBS, CULTURE_VALUES } from "@/data/mockData";
import { Briefcase, Users, TrendingUp, Shield, Star } from "lucide-react";

export default function Dashboard() {
  const activeJobs = MOCK_JOBS.filter((j) => j.status === "active");
  const totalApplicants = MOCK_JOBS.reduce((sum, j) => sum + j.applicants, 0);
  const strongCandidates = MOCK_CANDIDATES.filter((c) => c.classification === "Forte");
  const topCandidates = [...MOCK_CANDIDATES].sort((a, b) => b.finalScore - a.finalScore).slice(0, 4);

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Dashboard de Recrutamento</h1>
        <p className="mt-1 text-sm text-muted-foreground">Se Tu For, Eu Vou – Sistema de Recrutamento por Alta Performance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="Vagas Ativas" value={activeJobs.length} change="3 vagas abertas" variant="accent" />
        <StatCard icon={Users} label="Total Candidatos" value={totalApplicants} change="+12 esta semana" />
        <StatCard icon={Star} label="Candidatos Fortes" value={strongCandidates.length} variant="success" />
        <StatCard icon={Shield} label="Score Cultural Médio" value="82" variant="warning" change="Meta: ≥60" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Top Candidatos</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {topCandidates.map((c) => (
              <CandidateCard key={c.id} candidate={c} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Vagas Ativas</h2>
          <div className="space-y-3">
            {activeJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-card">
            <h3 className="font-display text-sm font-bold text-foreground">Pilares Culturais</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {CULTURE_VALUES.map((value) => (
                <span
                  key={value}
                  className="rounded-md bg-primary/5 px-2 py-1 text-[10px] font-medium text-primary"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
