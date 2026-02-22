import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DbJob {
  id: string;
  title: string;
  area: string;
  status: string;
  required_skills: string[];
  behavioral_profile: string | null;
  min_culture_score: number;
  min_technical_score: number;
  practical_case: string | null;
  culture_rejection_enabled: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useJobs(statusFilter?: string) {
  return useQuery({
    queryKey: ["jobs", statusFilter],
    queryFn: async () => {
      let query = supabase.from("jobs").select("*").order("created_at", { ascending: false });
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as DbJob[];
    },
  });
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: ["jobs", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as DbJob | null;
    },
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (job: Partial<DbJob>) => {
      const { data, error } = await supabase.from("jobs").insert([job as any]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Vaga criada com sucesso!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao criar vaga", description: e.message, variant: "destructive" });
    },
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbJob> & { id: string }) => {
      const { data, error } = await supabase.from("jobs").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Vaga atualizada!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao atualizar vaga", description: e.message, variant: "destructive" });
    },
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Vaga excluída!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao excluir vaga", description: e.message, variant: "destructive" });
    },
  });
}
