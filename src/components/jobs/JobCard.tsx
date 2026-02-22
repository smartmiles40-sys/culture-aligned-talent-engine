import { JobConfig } from "@/data/types";
import { cn } from "@/lib/utils";
import { Users, Calendar, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface JobCardProps {
  job: JobConfig;
}

const statusStyles = {
  active: "bg-success/10 text-success border-success/20",
  draft: "bg-muted text-muted-foreground border-border",
  closed: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels = {
  active: "Ativa",
  draft: "Rascunho",
  closed: "Encerrada",
};

export default function JobCard({ job }: JobCardProps) {
  return (
    <Link
      to={`/vagas/${job.id}`}
      className="group block rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-bold text-foreground">{job.title}</h3>
            <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-semibold", statusStyles[job.status])}>
              {statusLabels[job.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{job.area}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {job.requiredSkills.slice(0, 4).map((skill) => (
          <span key={skill} className="rounded-md bg-secondary/10 px-2 py-0.5 text-[11px] font-medium text-secondary">
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {job.applicants} candidatos
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(job.createdAt).toLocaleDateString("pt-BR")}
        </span>
      </div>
    </Link>
  );
}
