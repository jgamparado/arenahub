import { FormEvent, useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppLogo } from "../components/AppLogo";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../hooks/useAuth";
import { demoAdminEmail, demoAdminPassword, demoSignIn } from "../lib/localDemo";
import { isLocalDemoEnabled, supabase } from "../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState(demoAdminEmail);
  const [password, setPassword] = useState(demoAdminPassword);
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (session) return <Navigate to="/dashboard" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      if (isLocalDemoEnabled) {
        await demoSignIn(email, password);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }

      toast.success("Bem-vindo ao painel.");
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";
      navigate(from, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message.toLowerCase().includes("email not confirmed") ? "Confirme este usuário no Supabase Auth antes de entrar." : "E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-5">
          <AppLogo />
          <div>
            <CardTitle>Login do gestor</CardTitle>
            <CardDescription>Acesse o painel administrativo da ArenaHub.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-800">E-mail</span>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-800">Senha</span>
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            <Button className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LockKeyhole className="h-5 w-5" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
