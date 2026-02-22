import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DbCandidate {
  id: string;
  job_id: string;
  name: string;
  email: string;
  phone: string | null;
  cv_url: string | null;
  cv_analysis: any;
  current_stage_id: string | null;
  status: string;
  classification: string | null;
  final_score: number | null;
  alerts: string[];
  applied_at: string;
  updated_at: string;
}

export function useCandidates(filters?: { jobId?: string; classification?: string; status?: string; search?: string }) {
  return useQuery({
    queryKey: ["candidates", filters],
    queryFn: async () => {
      let query = supabase.from("candidates").select("*").order("applied_at", { ascending: false });
      if (filters?.jobId) query = query.eq("job_id", filters.jobId);
      if (filters?.classification) query = query.eq("classification", filters.classification);
      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.search) query = query.ilike("name", `%${filters.search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as DbCandidate[];
    },
  });
}

export function useCandidate(id: string | undefined) {
  return useQuery({
    queryKey: ["candidates", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as DbCandidate | null;
    },
  });
}

export function useUpdateCandidate() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbCandidate> & { id: string }) => {
      const { data, error } = await supabase.from("candidates").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidates"] });
      toast({ title: "Candidato atualizado!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });
}

export function useDeleteCandidate() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("candidates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidates"] });
      toast({ title: "Candidato excluído!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });
}

export function useCandidatesByJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ["candidates", "job", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("job_id", jobId!)
        .order("final_score", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as DbCandidate[];
    },
  });
}
