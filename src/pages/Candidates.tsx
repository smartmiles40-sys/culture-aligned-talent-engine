import AppLayout from "@/components/layout/AppLayout";
import CandidateCard from "@/components/candidates/CandidateCard";
import { MOCK_CANDIDATES, AREAS } from "@/data/mockData";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export default function Candidates() {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");

  const filtered = MOCK_CANDIDATES.filter((c) => {
    if (filter !== "all" && c.area !== filter) return false;
    if (classFilter !== "all" && c.classification !== classFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Candidatos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pipeline completo de candidatos no processo seletivo</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar candidato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {["all", ...AREAS].map((area) => (
            <button
              key={area}
              onClick={() => setFilter(area)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                filter === area ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {area === "all" ? "Todas" : area}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {["all", "Forte", "Desenvolvível", "Risco"].map((cls) => (
            <button
              key={cls}
              onClick={() => setClassFilter(cls)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                classFilter === cls ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {cls === "all" ? "Todos" : cls}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => (
          <CandidateCard key={c.id} candidate={c} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Nenhum candidato encontrado.
          </div>
        )}
      </div>
    </AppLayout>
  );
}
