import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    // Also check hash for type=recovery
    if (window.location.hash.includes("type=recovery")) {
      setReady(true);
    }
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Пароль должен быть не менее 6 символов"); return; }
    if (password !== confirm) { toast.error("Пароли не совпадают"); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error("Ошибка: " + error.message);
    } else {
      toast.success("Пароль успешно изменён");
      navigate("/dashboard", { replace: true });
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Проверка ссылки...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-[0.08]" style={{ background: "hsl(72 100% 50%)" }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-[0.06]" style={{ background: "hsl(82 90% 45%)" }} />

      <div className="w-full max-w-sm space-y-8 animate-fade-in relative">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-hero glow-primary">
            <Flame className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Новый пароль</h1>
            <p className="text-sm text-muted-foreground mt-2">Введите новый пароль</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder="Новый пароль" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 h-12 bg-card border-border rounded-xl card-shadow" disabled={loading} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder="Подтвердите пароль" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-11 h-12 bg-card border-border rounded-xl card-shadow" disabled={loading} />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 gradient-hero text-primary-foreground border-0 glow-primary hover:opacity-90 transition-opacity rounded-xl text-base font-semibold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (<>Сохранить <ArrowRight className="h-5 w-5 ml-2" /></>)}
          </Button>
        </form>
      </div>
    </div>
  );
}
