import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type Mode = "login" | "signup" | "forgot";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar a conta.",
        });
      } else {
        // forgot password
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        });
        if (error) throw error;
        toast({
          title: "Verifique seu e-mail",
          description: "Se o e-mail existir, enviamos um link de redefinição.",
        });
        setMode("login");
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao processar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  const title = mode === "login" ? "Entrar" : mode === "signup" ? "Criar Conta" : "Recuperar senha";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
            SV
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Se Tu For, Eu Vou
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sistema de Recrutamento por Alta Performance
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>

          {mode === "forgot" ? (
            <>
              <p className="text-sm text-muted-foreground">
                Informe o e-mail cadastrado e enviaremos um link para criar uma nova senha.
              </p>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar link de redefinição
              </button>

              <p className="text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-semibold text-foreground hover:underline"
                >
                  Voltar para login
                </button>
              </p>
            </>
          ) : (
            <>
              {mode === "signup" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Nome</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">Senha</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs font-medium text-foreground hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "login" ? "Entrar" : "Criar Conta"}
              </button>

              <p className="text-center text-sm text-muted-foreground">
                {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="font-semibold text-foreground hover:underline"
                >
                  {mode === "login" ? "Criar conta" : "Entrar"}
                </button>
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
