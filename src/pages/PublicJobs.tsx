import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, MapPin, ChevronRight, Search, Loader2 } from "lucide-react";
import logo from "@/assets/logo-vertical-off-white.jpg";

interface PublicJob {
  id: string;
  title: string;
  area: string;
  created_at: string;
  required_skills: string[] | null;
}

export default function PublicJobs() {
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, area, created_at, required_skills")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      setJobs(data || []);
      setLoading(false);
    };
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.area.toLowerCase().includes(search.toLowerCase())
  );

  const areas = [...new Set(jobs.map((j) => j.area))];

  return (
    <div className="min-h-screen bg-primary">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b border-sidebar-border">
        <div className="absolute inset-0 gradient-premium opacity-90" />
        <div className="relative mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-display text-sm font-bold text-accent-foreground shadow-elevated">
              RH
            </div>
            <span className="font-display text-base font-bold text-primary-foreground/90 tracking-tight">
              Recrutamento
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground leading-tight tracking-tight">
            Vagas Abertas
          </h1>
          <p className="mt-4 max-w-xl text-base text-primary-foreground/60 leading-relaxed">
            Encontre a oportunidade ideal para sua carreira. Explore nossas posições e candidate-se à vaga que mais combina com o seu perfil.
          </p>

          {/* Search */}
          <div className="mt-8 max-w-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por cargo ou área..."
                className="h-12 w-full rounded-xl border border-sidebar-border bg-sidebar-accent pl-11 pr-4 text-sm text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              />
            </div>
          </div>

          {/* Area chips */}
          {areas.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {areas.map((area) => (
                <button
                  key={area}
                  onClick={() => setSearch(search === area ? "" : area)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    search === area
                      ? "bg-accent text-accent-foreground shadow-md"
                      : "bg-sidebar-accent text-primary-foreground/50 hover:text-primary-foreground/80 hover:bg-sidebar-accent/80"
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Job Listing */}
      <main className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent p-16 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-primary-foreground/20" />
            <p className="mt-4 font-display text-lg font-semibold text-primary-foreground/60">
              Nenhuma vaga encontrada
            </p>
            <p className="mt-2 text-sm text-primary-foreground/35">
              {search
                ? "Tente alterar os termos da pesquisa."
                : "No momento não há vagas abertas. Volte em breve!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-widest text-primary-foreground/30 mb-6">
              {filteredJobs.length} {filteredJobs.length === 1 ? "vaga disponível" : "vagas disponíveis"}
            </p>
            {filteredJobs.map((job, i) => (
              <Link
                key={job.id}
                to={`/aplicar/${job.id}`}
                className="group relative flex items-center justify-between rounded-2xl border border-sidebar-border bg-sidebar-accent p-6 transition-all hover:border-accent/40 hover:shadow-elevated animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent/20">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-primary-foreground group-hover:text-accent transition-colors">
                      {job.title}
                    </h2>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-primary-foreground/40">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.area}
                      </span>
                      <span>
                        {new Date(job.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {job.required_skills && job.required_skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {job.required_skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-md bg-primary/60 px-2 py-0.5 text-[10px] font-medium text-primary-foreground/50"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden text-xs font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                    Candidatar-se
                  </span>
                  <ChevronRight className="h-5 w-5 text-primary-foreground/20 transition-all group-hover:text-accent group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-sidebar-border py-8">
        <div className="mx-auto max-w-5xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/20 font-display text-[9px] font-bold text-accent">
              RH
            </div>
            <span className="text-xs text-primary-foreground/25">Plataforma de Recrutamento</span>
          </div>
          <span className="text-[10px] text-primary-foreground/15">
            © {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  );
}
