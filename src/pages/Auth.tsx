import { useState, useEffect } from "react";
import { trackRegistrationEvent } from "@/components/TrackingPixels";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2, User, Phone, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendMeLogo } from "@/components/TrendMeLogo";

type Mode = "login" | "register" | "forgot";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneCode, setPhoneCode] = useState("+7");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const now = Date.now();
    if (now - lastSubmitTime < 3000) {
      toast.error("Подождите несколько секунд перед повторной попыткой.");
      return;
      return;
    }
    setLastSubmitTime(now);
    if (!email) { toast.error("Введите email"); return; }

    if (mode === "forgot") {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) {
        const msg = error.message || "";
        if (msg.includes("rate limit") || msg.includes("security purposes")) {
          toast.error("Слишком частые запросы. Подождите несколько секунд.");
        } else {
          toast.error("Не удалось отправить ссылку. Проверьте email и попробуйте снова.");
        }
      }
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
        if (error) {
          const msg = error.message || "";
          if (msg.includes("Invalid login credentials")) {
            toast.error("Неверный email или пароль. Проверьте данные и попробуйте снова.");
          } else if (msg.includes("Email not confirmed")) {
            toast.error("Email не подтверждён. Проверьте почту и перейдите по ссылке.");
          } else if (msg.includes("rate limit") || msg.includes("security purposes")) {
            toast.error("Слишком частые запросы. Подождите несколько секунд.");
          } else {
            toast.error("Ошибка входа. Попробуйте позже.");
          }
        }
        else navigate("/dashboard");
      } else {
        const { error } = await signUp(email, password, { name: name.trim(), phone: `${phoneCode}${phone.trim()}` });
        if (error) {
          const msg = error.message || "";
          if (msg.includes("already registered") || msg.includes("already been registered")) {
            toast.error("Этот email уже зарегистрирован. Попробуйте войти.");
          } else if (msg.includes("rate limit") || msg.includes("after 2 seconds") || msg.includes("security purposes")) {
            toast.error("Слишком частые запросы. Подождите несколько секунд.");
          } else if (msg.includes("valid email") || msg.includes("invalid")) {
            toast.error("Введите корректный email адрес.");
          } else if (msg.includes("weak password") || msg.includes("at least")) {
            toast.error("Пароль слишком простой. Используйте минимум 6 символов.");
          } else {
            toast.error("Ошибка регистрации. Попробуйте позже.");
          }
        }
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
            <TrendMeLogo size={40} className="md:w-12 md:h-12 mx-auto" />
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
                <div className="relative animate-fade-in flex gap-2">
                  <div className="relative shrink-0 w-[90px]">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      className="h-11 md:h-12 w-full pl-9 pr-2 bg-card border border-border rounded-xl card-shadow text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                      disabled={loading}
                    >
                      <option value="+7">🇰🇿 +7</option>
                      <option value="+7">🇷🇺 +7</option>
                      <option value="+998">🇺🇿 +998</option>
                      <option value="+996">🇰🇬 +996</option>
                      <option value="+992">🇹🇯 +992</option>
                      <option value="+993">🇹🇲 +993</option>
                      <option value="+375">🇧🇾 +375</option>
                      <option value="+380">🇺🇦 +380</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+90">🇹🇷 +90</option>
                    </select>
                  </div>
                  <Input type="tel" placeholder="Номер телефона" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 md:h-12 bg-card border-border rounded-xl card-shadow text-sm" disabled={loading} />
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
