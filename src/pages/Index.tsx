import AppLayout from "@/components/layout/AppLayout";
import StatCard from "@/components/dashboard/StatCard";
import { useJobs } from "@/hooks/useJobs";
import { useCandidates } from "@/hooks/useCandidates";
import { Briefcase, Clock, Users, Star, Shield, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ScoreDistribution from "@/components/dashboard/ScoreDistribution";
import CulturalTechnical from "@/components/dashboard/CulturalTechnical";
import CandidateOrigin from "@/components/dashboard/CandidateOrigin";
import FunnelVelocity from "@/components/dashboard/FunnelVelocity";
import FunnelConversion from "@/components/dashboard/FunnelConversion";

export default function Dashboard() {
  const { data: jobs = [], isLoading: jobsLoading } = useJobs();
  const { data: candidates = [], isLoading: candidatesLoading } = useCandidates();

  // Fetch evaluations for cultural/technical breakdown
  const { data: allEvaluations = [] } = useQuery({
    queryKey: ["dashboard-evaluations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidate_evaluations")
        .select("candidate_id, stage_id, score");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch stages for all jobs
  const { data: allStages = [] } = useQuery({
    queryKey: ["dashboard-stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_stages")
        .select("id, job_id, stage_key, label");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch candidate responses for origin data
  const { data: allResponses = [] } = useQuery({
    queryKey: ["dashboard-responses-origin"],
    queryFn: async () => {
      // Find questions that match "onde você ficou sabendo" pattern
      const { data: questions } = await supabase
        .from("stage_questions")
        .select("id, question_text")
        .ilike("question_text", "%ficou sabendo%");
      if (!questions?.length) return [];
      const qIds = questions.map((q) => q.id);
      const { data: responses, error } = await supabase
        .from("candidate_responses")
        .select("candidate_id, response_value, question_id")
        .in("question_id", qIds);
      if (error) throw error;
      return responses || [];
    },
  });

  const isLoading = jobsLoading || candidatesLoading;
  const activeJobs = jobs.filter((j) => j.status === "active");

  // ── KPI calculations ──
  const scoredCandidates = candidates.filter((c) => c.final_score !== null);
  const strongCount = scoredCandidates.filter((c) => (c.final_score || 0) >= 80).length;
  const strongPct = scoredCandidates.length > 0 ? Math.round((strongCount / scoredCandidates.length) * 100) : 0;
  const avgScore = scoredCandidates.length > 0
    ? Math.round(scoredCandidates.reduce((s, c) => s + (c.final_score || 0), 0) / scoredCandidates.length)
    : null;

  // "Aguardando Revisão" — status in_progress and applied > 48h ago
  const now = Date.now();
  const awaitingReview = candidates.filter((c) => {
    if (c.status !== "in_progress") return false;
    const applied = new Date(c.applied_at).getTime();
    return now - applied > 48 * 60 * 60 * 1000;
  }).length;

  // "Em Entrevista" — current stage label contains "entrevista"
  const interviewStageIds = new Set(
    allStages
      .filter((s) => s.label?.toLowerCase().includes("entrevista"))
      .map((s) => s.id)
  );
  const inInterview = candidates.filter((c) => c.current_stage_id && interviewStageIds.has(c.current_stage_id)).length;

  // "Contratações no Mês" — status approved in current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const hiresThisMonth = candidates.filter((c) => {
    if (c.status !== "approved") return false;
    const d = new Date(c.updated_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  // ── Funnel Health per job ──
  const funnelData = activeJobs.map((job) => {
    const jobCandidates = candidates.filter((c) => c.job_id === job.id);
    const scored = jobCandidates.filter((c) => c.final_score !== null);
    const avgJobScore = scored.length > 0 ? Math.round(scored.reduce((s, c) => s + (c.final_score || 0), 0) / scored.length) : null;
    const strongInJob = scored.filter((c) => (c.final_score || 0) >= 80).length;
    const interviewInJob = jobCandidates.filter((c) => c.current_stage_id && interviewStageIds.has(c.current_stage_id)).length;
    const daysOpen = Math.floor((now - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24));

    let health: "Saudável" | "Atenção" | "Crítico";
    if (strongInJob >= 1 && daysOpen < 30) {
      health = "Saudável";
    } else if (daysOpen > 30 && strongInJob === 0) {
      health = "Crítico";
    } else if (jobCandidates.length === 0 && daysOpen > 7) {
      health = "Crítico";
    } else {
      health = "Atenção";
    }

    return { job, total: jobCandidates.length, avgScore: avgJobScore, strong: strongInJob, interview: interviewInJob, daysOpen, health };
  });

  // ── Score Distribution ──
  const scoreBuckets = [
    { range: "0–59", min: 0, max: 59, color: "#EF4444" },
    { range: "60–69", min: 60, max: 69, color: "#F59E0B" },
    { range: "70–79", min: 70, max: 79, color: "#3B82F6" },
    { range: "80–89", min: 80, max: 89, color: "#22C55E" },
    { range: "90–100", min: 90, max: 100, color: "#15803D" },
  ];
  const scoreDistribution = scoreBuckets.map((b) => ({
    ...b,
    count: scoredCandidates.filter((c) => (c.final_score || 0) >= b.min && (c.final_score || 0) <= b.max).length,
  }));

  // ── Cultural vs Technical per job ──
  // Map stage_id -> stage_key for evaluations
  const stageKeyMap = new Map(allStages.map((s) => [s.id, s.stage_key]));
  const culturalTechnicalByJob = activeJobs.map((job) => {
    const jobCandidateIds = new Set(candidates.filter((c) => c.job_id === job.id).map((c) => c.id));
    const jobEvals = allEvaluations.filter((e) => jobCandidateIds.has(e.candidate_id));

    const culturalScores: number[] = [];
    const technicalScores: number[] = [];
    jobEvals.forEach((e) => {
      if (e.score === null) return;
      const key = stageKeyMap.get(e.stage_id);
      if (key === "culture") culturalScores.push(e.score);
      if (key === "technical" || key === "commercial" || key === "application") technicalScores.push(e.score);
    });

    const avgCultural = culturalScores.length > 0 ? Math.round(culturalScores.reduce((a, b) => a + b, 0) / culturalScores.length) : null;
    const avgTechnical = technicalScores.length > 0 ? Math.round(technicalScores.reduce((a, b) => a + b, 0) / technicalScores.length) : null;
    return { title: job.title, cultural: avgCultural, technical: avgTechnical };
  });

  // ── Candidate Origin ──
  const normalizeChannel = (raw: string): string => {
    const lower = raw.toLowerCase().trim();
    if (lower.includes("linkedin")) return "LinkedIn";
    if (lower.includes("instagram")) return "Instagram";
    if (lower.includes("facebook")) return "Facebook";
    if (lower.includes("indeed")) return "Indeed";
    if (lower.includes("indicação") || lower.includes("indicacao")) return "Indicação";
    if (lower.includes("google")) return "Google";
    if (lower.includes("site")) return "Site";
    if (!lower || lower.length < 2) return "Outros";
    // Capitalize first letter
    return raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1);
  };

  const candidateScoreMap = new Map(candidates.map((c) => [c.id, c.final_score]));
  const channelMap = new Map<string, { count: number; totalScore: number; scoredCount: number }>();
  allResponses.forEach((r) => {
    if (!r.response_value) return;
    const channel = normalizeChannel(r.response_value);
    const existing = channelMap.get(channel) || { count: 0, totalScore: 0, scoredCount: 0 };
    existing.count++;
    const score = candidateScoreMap.get(r.candidate_id);
    if (score !== null && score !== undefined) {
      existing.totalScore += score;
      existing.scoredCount++;
    }
    channelMap.set(channel, existing);
  });
  const originData = Array.from(channelMap.entries())
    .map(([channel, d]) => ({ channel, count: d.count, avgScore: d.scoredCount > 0 ? Math.round(d.totalScore / d.scoredCount) : null }))
    .sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0));

  const scoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 70) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  const healthBadge = (health: string) => {
    const styles = {
      "Saudável": "bg-success/10 text-success",
      "Atenção": "bg-warning/10 text-warning",
      "Crítico": "bg-destructive/10 text-destructive",
    };
    return (
      <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold", styles[health as keyof typeof styles] || "")}>
        {health}
      </span>
    );
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Dashboard de Recrutamento</h1>
        <p className="mt-1 text-sm text-muted-foreground">Se Tu For, Eu Vou – Sistema de Recrutamento por Alta Performance</p>
      </div>

      {/* ── BLOCO 1: 6 KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/vagas">
          <StatCard icon={Briefcase} label="Vagas Ativas" value={isLoading ? "..." : activeJobs.length} change={`${jobs.length} vagas total`} variant="accent" />
        </Link>
        <StatCard
          icon={Clock}
          label="Aguardando Revisão"
          value={isLoading ? "..." : awaitingReview}
          change="sem ação há +48h"
          variant={awaitingReview > 0 ? "danger" : "success"}
        />
        <StatCard icon={Users} label="Em Andamento" value={isLoading ? "..." : candidates.filter(c => {
          const stage = (c as any).pipeline_stage || "nova_candidatura";
          return stage !== "nova_candidatura" && stage !== "reprovado" && stage !== "contratado";
        }).length} change="em etapas ativas do pipeline" />
        <Link to="/candidatos?classification=Forte">
          <StatCard icon={Star} label="Taxa de Candidatos Fortes" value={isLoading ? "..." : `${strongPct}%`} change="score ≥ 80 sobre o total" variant="success" />
        </Link>
        <StatCard icon={Shield} label="Score Médio Geral" value={isLoading ? "..." : avgScore !== null ? avgScore : "—"} variant="warning" change={avgScore !== null ? "Baseado em avaliações reais" : "Sem dados ainda"} />
        <StatCard icon={Trophy} label="Contratações no Mês" value={isLoading ? "..." : hiresThisMonth} change="posições preenchidas este mês" />
      </div>

      {/* ── BLOCO 2: Saúde do Funil por Vaga ── */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-bold text-foreground">Saúde do Funil por Vaga</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">Visão consolidada de cada processo seletivo aberto</p>

        {funnelData.length === 0 ? (
          <div className="mt-4 rounded-xl border border-border bg-card p-10 text-center shadow-card">
            <Briefcase className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">Nenhuma vaga ativa no momento</p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["VAGA", "CANDIDATOS", "SCORE MÉDIO", "FORTES (≥80)", "EM ENTREVISTA", "DIAS ABERTA", "SAÚDE"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {funnelData.map((row, i) => (
                    <tr key={row.job.id} className={cn("border-b border-border last:border-0", i % 2 === 1 && "bg-muted/20")}>
                      <td className="px-4 py-3">
                        <Link to={`/candidatos?jobId=${row.job.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                          {row.job.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{row.job.area}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground">{row.total}</td>
                      <td className={cn("px-4 py-3 font-semibold", scoreColor(row.avgScore))}>
                        {row.avgScore !== null ? row.avgScore : "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground">{row.strong}</td>
                      <td className="px-4 py-3 text-foreground">{row.interview}</td>
                      <td className={cn("px-4 py-3 font-medium", row.daysOpen > 30 ? "text-destructive" : row.daysOpen >= 15 ? "text-warning" : "text-muted-foreground")}>
                        {row.daysOpen}d
                      </td>
                      <td className="px-4 py-3">{healthBadge(row.health)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── BLOCO 3: Distribuição de Scores ── */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Score Distribution Chart */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-base font-bold text-foreground">Distribuição de Scores</h2>
          {scoredCandidates.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Sem candidatos avaliados ainda</p>
          ) : (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} barCategoryGap="20%">
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis hide allowDecimals={false} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    <LabelList dataKey="count" position="top" style={{ fontSize: 12, fontWeight: 600 }} />
                    {scoreDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Cultural vs Technical */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-base font-bold text-foreground">Fit Cultural vs. Técnico</h2>
          <div className="mt-4 space-y-4">
            {culturalTechnicalByJob.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma vaga ativa</p>
            )}
            {culturalTechnicalByJob.map((item) => (
              <div key={item.title} className="space-y-2">
                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-xs text-muted-foreground">Cultural</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${item.cultural || 0}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs font-semibold text-foreground">{item.cultural ?? "—"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-xs text-muted-foreground">Técnico</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${item.technical || 0}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs font-semibold text-foreground">{item.technical ?? "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BLOCO 4: Origem dos Candidatos ── */}
      {originData.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-bold text-foreground">Origem dos Candidatos</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Qual canal traz mais qualidade — não só volume</p>
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["CANAL", "CANDIDATOS", "SCORE MÉDIO"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {originData.map((row, i) => (
                    <tr key={row.channel} className={cn("border-b border-border last:border-0", i % 2 === 1 && "bg-muted/20")}>
                      <td className="px-4 py-3 font-medium text-foreground">{row.channel}</td>
                      <td className="px-4 py-3 text-foreground">{row.count}</td>
                      <td className={cn("px-4 py-3 font-semibold", scoreColor(row.avgScore))}>
                        {row.avgScore !== null ? row.avgScore : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
