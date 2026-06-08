import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function RedefinirSenha() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Caso a sessão já tenha sido carregada antes do listener (link aberto direto)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsRecovery(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Mínimo de 6 caracteres.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Senhas diferentes", description: "Os campos precisam ser iguais.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Senha atualizada!", description: "Faça login com sua nova senha." });
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Erro ao redefinir senha", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
            SV
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Redefinir Senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">Defina uma nova senha para acessar sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
          {!isRecovery && (
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              Aguardando validação do link de redefinição… Se você não chegou aqui via e-mail, solicite um novo link na tela de login.
            </p>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Nova senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Confirmar nova senha</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isRecovery}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar nova senha
          </button>

          <p className="text-center text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="font-semibold text-foreground hover:underline"
            >
              Voltar para login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
