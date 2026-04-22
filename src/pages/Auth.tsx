import { useState } from "react";
import { trackRegistrationEvent, trackPlausible } from "@/components/TrackingPixels";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2, User, Phone, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendMeWordmark } from "@/components/TrendMeWordmark";
import { isNativePlatform } from "@/lib/native";
import { cn } from "@/lib/utils";

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
  const [eulaAccepted, setEulaAccepted] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const isNative = isNativePlatform;

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
      if (!eulaAccepted) { toast.error("Необходимо принять пользовательское соглашение"); return; }
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
        else { trackPlausible("Login"); navigate("/dashboard"); }
      } else {
        // Pre-check: does this email already exist? (Supabase signUp doesn't return a clear error for existing confirmed emails)
        try {
          const checkRes = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-email-exists`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: email.trim().toLowerCase() }),
            }
          );
          if (checkRes.ok) {
            const { exists } = await checkRes.json();
            if (exists) {
              toast.error("Этот email уже зарегистрирован. Попробуйте войти.", {
                action: { label: "Войти", onClick: () => setMode("login") },
              });
              setLoading(false);
              return;
            }
          }
        } catch {
          // If pre-check fails, fall through to signUp anyway
        }

        const { error } = await signUp(email, password, { name: name.trim(), phone: `${phoneCode}${phone.trim()}` });
        if (error) {
          const msg = error.message || "";
          if (msg.includes("already registered") || msg.includes("already been registered") || msg.includes("User already")) {
            toast.error("Этот email уже зарегистрирован. Попробуйте войти.", {
              action: { label: "Войти", onClick: () => setMode("login") },
            });
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
      {/* Background — soft viral green orbs + mesh */}
      <div className="absolute inset-0 gradient-mesh opacity-60 pointer-events-none" />
      <div
        className="absolute top-[-15%] right-[-15%] w-[55vw] h-[55vw] max-w-[480px] max-h-[480px] rounded-full blur-3xl opacity-[0.18]"
        style={{ background: "hsl(var(--viral))" }}
      />
      <div
        className="absolute bottom-[-15%] left-[-15%] w-[55vw] h-[55vw] max-w-[480px] max-h-[480px] rounded-full blur-3xl opacity-[0.12]"
        style={{ background: "hsl(var(--viral))" }}
      />

      {/* Back to home — only on web */}
      {!isNative && (
        <Link
          to="/"
          className="absolute top-4 left-4 md:top-6 md:left-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <ArrowLeft className="h-4 w-4" /> На главную
        </Link>
      )}

      <div className="w-full max-w-[400px] relative z-10 animate-fade-in">
        {/* Logo & Title */}
        <div className="text-center space-y-4 mb-6">
          <div className={cn("flex justify-center", isNative ? "pt-4" : "")}>
            <TrendMeWordmark size="xl" />
          </div>
          <div className="space-y-1.5">
            <h1 className={`font-bold tracking-tight text-foreground ${isNative ? "text-3xl" : "text-2xl md:text-[28px]"}`}>
              {mode === "login" && "С возвращением"}
              {mode === "register" && "Создайте аккаунт"}
              {mode === "forgot" && "Восстановление"}
            </h1>
            <p className={`text-muted-foreground ${isNative ? "text-base" : "text-sm"}`}>
              {mode === "login" && "Войдите, чтобы продолжить"}
              {mode === "register" && "Начните находить тренды за минуту"}
              {mode === "forgot" && "Отправим ссылку для сброса пароля"}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl shadow-card p-5 md:p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2.5">
              {mode === "register" && (
                <>
                  <div className="relative animate-fade-in">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Имя"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-11 h-12 bg-background border-border rounded-xl text-base focus-visible:ring-viral focus-visible:ring-2"
                      disabled={loading}
                      autoComplete="name"
                    />
                  </div>
                  <div className="relative animate-fade-in flex gap-2">
                    <div className="relative shrink-0 w-[92px]">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <select
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value)}
                        className="h-12 w-full pl-9 pr-2 bg-background border border-border rounded-xl text-base appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-viral"
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
                    <Input
                      type="tel"
                      placeholder="Номер телефона"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 bg-background border-border rounded-xl text-base focus-visible:ring-viral focus-visible:ring-2"
                      disabled={loading}
                      autoComplete="tel"
                    />
                  </div>
                </>
              )}
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 bg-background border-border rounded-xl text-base focus-visible:ring-viral focus-visible:ring-2"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              {mode !== "forgot" && (
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 bg-background border-border rounded-xl text-base focus-visible:ring-viral focus-visible:ring-2"
                    disabled={loading}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </div>

            {mode === "register" && (
              <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={eulaAccepted}
                  onChange={(e) => setEulaAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-viral shrink-0"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Я принимаю{" "}
                  <a href="/terms" target="_blank" className="text-foreground hover:underline font-medium">
                    Пользовательское соглашение
                  </a>{" "}
                  и{" "}
                  <a href="/privacy" target="_blank" className="text-foreground hover:underline font-medium">
                    Политику конфиденциальности
                  </a>
                  . Я понимаю, что нетерпимый, оскорбительный контент запрещён.
                </span>
              </label>
            )}

            {mode === "login" && (
              <div className="text-right -mt-1">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  Забыли пароль?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-viral text-viral-foreground hover:bg-viral/90 rounded-xl text-base font-bold shadow-glow-viral transition-all active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {mode === "login" && "Войти"}
                  {mode === "register" && "Зарегистрироваться"}
                  {mode === "forgot" && "Отправить ссылку"}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Switch mode */}
        <div className="text-center text-sm text-muted-foreground mt-5">
          {mode === "forgot" ? (
            <button
              onClick={() => setMode("login")}
              className="text-foreground hover:text-viral transition-colors font-semibold inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Назад ко входу
            </button>
          ) : (
            <p>
              {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
              <button
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-foreground hover:text-viral transition-colors font-bold"
              >
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
