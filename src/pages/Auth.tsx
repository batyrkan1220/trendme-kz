import { useState } from "react";
import { trackRegistrationEvent } from "@/components/TrackingPixels";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2, User, Phone, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { TrendMeLogo } from "@/components/TrendMeLogo";
import { isNativePlatform } from "@/lib/native";

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
  const [appleLoading, setAppleLoading] = useState(false);
  const isNative = isNativePlatform;

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Apple кіру қатесі. Қайталап көріңіз.");
        console.error("[Apple Sign In]", result.error);
      }
    } catch (err) {
      toast.error("Apple кіру қатесі.");
      console.error("[Apple Sign In]", err);
    } finally {
      setAppleLoading(false);
    }
  };

  // Native: show only Apple Sign In
  if (isNative) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-5 py-8 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[400px] max-h-[400px] rounded-full blur-3xl opacity-[0.08]" style={{ background: "hsl(var(--primary))" }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[400px] max-h-[400px] rounded-full blur-3xl opacity-[0.06]" style={{ background: "hsl(var(--primary))" }} />

        <div className="w-full max-w-sm space-y-8 animate-fade-in relative">
          <div className="text-center space-y-3 pt-4">
            <TrendMeLogo size={56} className="mx-auto" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">trendme</h1>
              <p className="text-base text-muted-foreground mt-1.5">Трендтерді бірінші біл</p>
            </div>
          </div>

          <Button
            onClick={handleAppleSignIn}
            disabled={appleLoading}
            className="w-full h-14 rounded-2xl text-base font-semibold bg-white text-black hover:bg-white/90 shadow-lg"
          >
            {appleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <svg className="h-5 w-5 mr-2.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple арқылы кіру
              </>
            )}
          </Button>

          <div className="h-8" />
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const now = Date.now();
    if (now - lastSubmitTime < 3000) {
      toast.error("Подождите несколько секунд перед повторной попыткой.");
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
        else {
          trackRegistrationEvent();
          toast.success("Проверьте email для подтверждения регистрации");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-5 py-8 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[400px] max-h-[400px] rounded-full blur-3xl opacity-[0.08]" style={{ background: "hsl(var(--primary))" }} />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[400px] max-h-[400px] rounded-full blur-3xl opacity-[0.06]" style={{ background: "hsl(var(--primary))" }} />

      {/* Back to home — only on web */}
      {!isNative && (
        <Link to="/" className="absolute top-4 left-4 md:top-6 md:left-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> На главную
        </Link>
      )}

      <div className="w-full max-w-sm space-y-6 animate-fade-in relative">
        {/* Logo & Title — larger on native */}
        <div className="text-center space-y-3">
          <div className={isNative ? "pt-4" : ""}>
            <TrendMeLogo size={isNative ? 56 : 40} className="mx-auto" />
          </div>
          <div>
            <h1 className={`font-bold tracking-tight text-foreground ${isNative ? "text-3xl" : "text-2xl md:text-3xl"}`}>
              trendme
            </h1>
            <p className={`text-muted-foreground mt-1.5 ${isNative ? "text-base" : "text-sm"}`}>
              {mode === "login" && "Войдите в свой аккаунт"}
              {mode === "register" && "Создайте аккаунт"}
              {mode === "forgot" && "Восстановление пароля"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2.5">
            {mode === "register" && (
              <>
                <div className="relative animate-fade-in">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="text" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} className="pl-11 h-12 bg-card border-border rounded-xl card-shadow text-base" disabled={loading} autoComplete="name" />
                </div>
                <div className="relative animate-fade-in flex gap-2">
                  <div className="relative shrink-0 w-[90px]">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      className="h-12 w-full pl-9 pr-2 bg-card border border-border rounded-xl card-shadow text-base appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                  <Input type="tel" placeholder="Номер телефона" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 bg-card border-border rounded-xl card-shadow text-base" disabled={loading} autoComplete="tel" />
                </div>
              </>
            )}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11 h-12 bg-card border-border rounded-xl card-shadow text-base" disabled={loading} autoComplete="email" />
            </div>
            {mode !== "forgot" && (
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type={showPassword ? "text" : "password"} placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 pr-11 h-12 bg-card border-border rounded-xl card-shadow text-base" disabled={loading} autoComplete={mode === "login" ? "current-password" : "new-password"} />
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

          <Button type="submit" disabled={loading} className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-base font-semibold shadow-lg shadow-primary/20">
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

        {/* Native app safe area spacer */}
        {isNative && <div className="h-8" />}
      </div>
    </div>
  );
}
