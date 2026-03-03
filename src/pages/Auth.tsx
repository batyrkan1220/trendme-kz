import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Mail, Lock, ArrowRight, Loader2, User, Phone, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Mode = "login" | "register" | "forgot";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Введите email"); return; }

    if (mode === "forgot") {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) toast.error("Ошибка: " + error.message);
      else toast.success("Ссылка для сброса отправлена на email");
      return;
    }

    if (!password) { toast.error("Введите пароль"); return; }

    if (mode === "register") {
      if (!name.trim()) { toast.error("Введите имя"); return; }
      if (!phone.trim()) { toast.error("Введите номер телефона"); return; }
      if (password.length < 6) { toast.error("Пароль должен быть не менее 6 символов"); return; }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) toast.error("Ошибка входа: " + error.message);
        else navigate("/dashboard");
      } else {
        const { error } = await signUp(email, password, { name: name.trim(), phone: phone.trim() });
        if (error) toast.error("Ошибка регистрации: " + error.message);
        else toast.success("Проверьте email для подтверждения регистрации");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-[0.08]" style={{ background: "hsl(258 80% 58%)" }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-[0.06]" style={{ background: "hsl(168 76% 42%)" }} />

      <div className="w-full max-w-sm space-y-8 animate-fade-in relative">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-hero glow-primary animate-bounce-soft">
            <Flame className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">TrendTok</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {mode === "login" && "Войдите в свой аккаунт"}
              {mode === "register" && "Создайте аккаунт"}
              {mode === "forgot" && "Восстановление пароля"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {mode === "register" && (
              <>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="text" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} className="pl-11 h-12 bg-card border-border rounded-xl card-shadow" disabled={loading} />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="tel" placeholder="Номер телефона" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-11 h-12 bg-card border-border rounded-xl card-shadow" disabled={loading} />
                </div>
              </>
            )}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11 h-12 bg-card border-border rounded-xl card-shadow" disabled={loading} />
            </div>
            {mode !== "forgot" && (
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 h-12 bg-card border-border rounded-xl card-shadow" disabled={loading} />
              </div>
            )}
          </div>

          {mode === "login" && (
            <div className="text-right">
              <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary hover:underline">
                Забыли пароль?
              </button>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full h-12 gradient-hero text-primary-foreground border-0 glow-primary hover:opacity-90 transition-opacity rounded-xl text-base font-semibold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <>
                {mode === "login" && "Войти"}
                {mode === "register" && "Зарегистрироваться"}
                {mode === "forgot" && "Отправить ссылку"}
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground space-y-2">
          {mode === "forgot" ? (
            <button onClick={() => setMode("login")} className="text-primary hover:underline font-semibold inline-flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Назад ко входу
            </button>
          ) : (
            <p>
              {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
              <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-primary hover:underline font-semibold">
                {mode === "login" ? "Зарегистрироваться" : "Войти"}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
