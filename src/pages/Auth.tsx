import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2, User, Phone, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendMeLogo } from "@/components/TrendMeLogo";

type Mode = "login" | "register" | "forgot";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute top-0 right-0 w-72 md:w-96 h-72 md:h-96 rounded-full blur-3xl opacity-[0.08]" style={{ background: "hsl(var(--primary))" }} />
      <div className="absolute bottom-0 left-0 w-72 md:w-96 h-72 md:h-96 rounded-full blur-3xl opacity-[0.06]" style={{ background: "hsl(var(--primary))" }} />

      <Link to="/" className="absolute top-4 left-4 md:top-6 md:left-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> На главную
      </Link>

      <div className="w-full max-w-sm space-y-6 md:space-y-8 animate-fade-in relative">
        {/* Logo & Title */}
        <div className="text-center space-y-3 md:space-y-4">
          <div className="inline-block animate-bounce-soft">
            <TrendMeLogo size={56} className="md:w-16 md:h-16 shadow-lg mx-auto" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              trendme
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 md:mt-2">
              {mode === "login" && "Войдите в свой аккаунт"}
              {mode === "register" && "Создайте аккаунт"}
              {mode === "forgot" && "Восстановление пароля"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div className="space-y-2.5 md:space-y-3">
            {mode === "register" && (
              <>
                <div className="relative animate-fade-in">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="text" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} className="pl-11 h-11 md:h-12 bg-card border-border rounded-xl card-shadow text-sm" disabled={loading} />
                </div>
                <div className="relative animate-fade-in">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="tel" placeholder="Номер телефона" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-11 h-11 md:h-12 bg-card border-border rounded-xl card-shadow text-sm" disabled={loading} />
                </div>
              </>
            )}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11 h-11 md:h-12 bg-card border-border rounded-xl card-shadow text-sm" disabled={loading} />
            </div>
            {mode !== "forgot" && (
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type={showPassword ? "text" : "password"} placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 pr-11 h-11 md:h-12 bg-card border-border rounded-xl card-shadow text-sm" disabled={loading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
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

          <Button type="submit" disabled={loading} className="w-full h-11 md:h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm md:text-base font-semibold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <>
                {mode === "login" && "Войти"}
                {mode === "register" && "Зарегистрироваться"}
                {mode === "forgot" && "Отправить ссылку"}
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Switch mode */}
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
