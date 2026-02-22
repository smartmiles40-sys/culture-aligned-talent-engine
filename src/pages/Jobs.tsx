import AppLayout from "@/components/layout/AppLayout";
import JobCard from "@/components/jobs/JobCard";
import { MOCK_JOBS, AREAS } from "@/data/mockData";
import { Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Jobs() {
  const [filter, setFilter] = useState<string>("all");

  const filteredJobs = filter === "all" ? MOCK_JOBS : MOCK_JOBS.filter((j) => j.area === filter);

  return (
    <AppLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Vagas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie as vagas e configure o processo seletivo</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
          <Plus className="h-4 w-4" />
          Nova Vaga
        </button>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          Todas
        </button>
        {AREAS.map((area) => (
          <button
            key={area}
            onClick={() => setFilter(area)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter === area ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {area}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </AppLayout>
  );
}
