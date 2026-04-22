import { useState } from "react";
import { trackRegistrationEvent, trackPlausible } from "@/components/TrackingPixels";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  Mail, Lock, ArrowRight, Loader2, User, Phone, ArrowLeft, Eye, EyeOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/lib/authService";
import { toast } from "sonner";
import { TrendMeWordmark } from "@/components/TrendMeWordmark";
import { isNativePlatform } from "@/lib/native";
import { cn } from "@/lib/utils";
import { OTPInput } from "@/components/auth/OTPInput";
import { useResendCountdown } from "@/hooks/useResendCountdown";

type Mode = "login" | "register" | "forgot";
type Step = "form" | "otp" | "new-password";

const FAILED_KEY = "trendme_login_failed";
const LOCKOUT_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function readFailed(email: string): { count: number; firstAt: number } {
  try {
    const raw = localStorage.getItem(`${FAILED_KEY}:${email}`);
    if (!raw) return { count: 0, firstAt: 0 };
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.firstAt > LOCKOUT_MS) return { count: 0, firstAt: 0 };
    return parsed;
  } catch {
    return { count: 0, firstAt: 0 };
  }
}
function writeFailed(email: string, data: { count: number; firstAt: number }) {
  try { localStorage.setItem(`${FAILED_KEY}:${email}`, JSON.stringify(data)); } catch {}
}
function clearFailed(email: string) {
  try { localStorage.removeItem(`${FAILED_KEY}:${email}`); } catch {}
}

function passwordStrength(p: string): { score: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!p) return { score: 0, label: "", color: "" };
  let score = 0;
  if (p.length >= 6) score++;
  if (p.length >= 10 && /[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) score++;
  const map = [
    { label: "Слабый", color: "bg-destructive" },
    { label: "Средний", color: "bg-warning" },
    { label: "Хороший", color: "bg-primary" },
    { label: "Надёжный", color: "bg-success" },
  ] as const;
  return { score: Math.min(score, 3) as 0 | 1 | 2 | 3, ...map[Math.min(score, 3)] };
}

export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<Step>("form");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneCode, setPhoneCode] = useState("+7");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [eulaAccepted, setEulaAccepted] = useState(false);

  // OTP step state
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(0);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const { secondsLeft, canResend, start: startCountdown } = useResendCountdown(60);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const isNative = isNativePlatform;

  const strength = passwordStrength(password);

  // ───────────── REGISTER ─────────────
  const handleRegister = async () => {
    if (!email) return toast.error("Введите email");
    if (!name.trim()) return toast.error("Введите имя");
    if (!phone.trim()) return toast.error("Введите номер телефона");
    if (!password) return toast.error("Введите пароль");
    if (password.length < 6) return toast.error("Пароль должен быть не менее 6 символов");
    if (password !== confirmPassword) return toast.error("Пароли не совпадают");
    if (!eulaAccepted) return toast.error("Необходимо принять пользовательское соглашение");

    setLoading(true);
    const { error } = await authService.signUp(email, password, {
      name: name.trim(),
      phone: `${phoneCode}${phone.trim()}`,
    });
    setLoading(false);

    if (error) { toast.error(error.message); return; }
    trackRegistrationEvent();
    trackPlausible("Trial Start");
    toast.success("Мы отправили код на ваш email");
    setStep("otp");
    setOtp("");
    startCountdown(60);
  };

  // ───────────── LOGIN ─────────────
  const handleLogin = async () => {
    if (!email) return toast.error("Введите email");
    if (!password) return toast.error("Введите пароль");

    const key = email.trim().toLowerCase();
    const failed = readFailed(key);
    if (failed.count >= MAX_ATTEMPTS) {
      const minLeft = Math.ceil((LOCKOUT_MS - (Date.now() - failed.firstAt)) / 60000);
      toast.error(`Слишком много попыток. Подождите ${minLeft} мин.`);
      return;
    }

    setLoading(true);
    const { error } = await signIn(key, password);
    setLoading(false);

    if (!error) {
      clearFailed(key);
      trackPlausible("Login");
      navigate("/dashboard");
      return;
    }

    if ((error as any).code === "email_not_confirmed" || /email not confirmed/i.test(error.message)) {
      toast.error("Email не подтверждён", {
        description: "Отправим новый 6-значный код на ваш email.",
        action: {
          label: "Отправить код",
          onClick: async () => {
            setLoading(true);
            const { error: rerr } = await authService.resendOtp(email);
            setLoading(false);
            if (rerr) {
              toast.error(rerr.message);
            } else {
              toast.success("Мы отправили код на ваш email");
              setStep("otp");
              setOtp("");
              startCountdown(60);
            }
          },
        },
        duration: 10000,
      });
      return;
    }

    const next = failed.count === 0
      ? { count: 1, firstAt: Date.now() }
      : { count: failed.count + 1, firstAt: failed.firstAt };
    writeFailed(key, next);

    if (next.count >= MAX_ATTEMPTS) {
      toast.error("Слишком много попыток. Подождите 5 минут.");
    } else {
      toast.error(error.message || "Неверный email или пароль");
    }
  };

  // ───────────── FORGOT (OTP flow) ─────────────
  const handleForgot = async () => {
    if (!email) return toast.error("Введите email");
    setLoading(true);
    const { error } = await authService.resetPasswordForEmail(email);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Мы отправили код на ваш email");
    setStep("otp");
    setOtp("");
    startCountdown(60);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (mode === "register") return handleRegister();
    if (mode === "login") return handleLogin();
    if (mode === "forgot") return handleForgot();
  };

  // ───────────── OTP verify ─────────────
  const handleVerifyOtp = async (codeOverride?: string) => {
    const code = (codeOverride ?? otp).replace(/\D/g, "");
    if (code.length !== 6) { toast.error("Введите 6-значный код"); return; }
    setOtpVerifying(true);
    const otpType: "email" | "recovery" = mode === "forgot" ? "recovery" : "email";
    const { error } = await authService.verifyOtp(email, code, otpType);
    setOtpVerifying(false);
    if (error) {
      toast.error(error.message);
      setOtpError((n) => n + 1);
      return;
    }
    if (mode === "forgot") {
      // recovery успех — пользователь временно залогинен, показываем экран нового пароля
      toast.success("Код подтверждён. Задайте новый пароль");
      setPassword("");
      setConfirmPassword("");
      setStep("new-password");
      return;
    }
    toast.success("Email подтверждён");
    clearFailed(email.trim().toLowerCase());
    if (mode === "register") {
      trackPlausible("Sign Up");
    }
    navigate("/dashboard", { replace: true });
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    const { error } = mode === "forgot"
      ? await authService.resetPasswordForEmail(email)
      : await authService.resendOtp(email);
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Новый код отправлен"); startCountdown(60); }
  };

  // ───────────── New password (after recovery OTP) ─────────────
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return toast.error("Введите новый пароль");
    if (password.length < 6) return toast.error("Пароль должен быть не менее 6 символов");
    if (password !== confirmPassword) return toast.error("Пароли не совпадают");
    setLoading(true);
    const { error } = await authService.updatePassword(password);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Пароль успешно изменён");
    navigate("/dashboard", { replace: true });
  };

  // ───────────── Render ─────────────
  const titleByContext = () => {
    if (step === "new-password") return "Новый пароль";
    if (step === "otp") return mode === "forgot" ? "Подтвердите сброс" : "Подтвердите аккаунт";
    if (mode === "login") return "С возвращением";
    if (mode === "register") return "Создайте аккаунт";
    return "Восстановление пароля";
  };
  const subtitleByContext = () => {
    if (step === "new-password") return "Придумайте новый пароль для входа";
    if (step === "otp") return `Мы отправили 6-значный код на ${email}`;
    if (mode === "login") return "Войдите, чтобы продолжить";
    if (mode === "register") return "Начните находить тренды за минуту";
    return "Введите email — отправим код для сброса";
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-5 py-8 relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-60 pointer-events-none" />
      <div className="absolute top-[-15%] right-[-15%] w-[55vw] h-[55vw] max-w-[480px] max-h-[480px] rounded-full blur-3xl opacity-[0.18]" style={{ background: "hsl(var(--viral))" }} />
      <div className="absolute bottom-[-15%] left-[-15%] w-[55vw] h-[55vw] max-w-[480px] max-h-[480px] rounded-full blur-3xl opacity-[0.12]" style={{ background: "hsl(var(--viral))" }} />

      {!isNative && step === "form" && (
        <Link to="/" className="absolute top-4 left-4 md:top-6 md:left-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors z-10">
          <ArrowLeft className="h-4 w-4" /> На главную
        </Link>
      )}

      <div className="w-full max-w-[400px] relative z-10 animate-fade-in">
        <div className="text-center space-y-4 mb-6">
          <div className={cn("flex justify-center", isNative ? "pt-4" : "")}>
            <TrendMeWordmark size="xl" />
          </div>
          <div className="space-y-1.5">
            <h1 className={`font-bold tracking-tight text-foreground ${isNative ? "text-3xl" : "text-2xl md:text-[28px]"}`}>{titleByContext()}</h1>
            <p className={`text-muted-foreground ${isNative ? "text-base" : "text-sm"}`}>{subtitleByContext()}</p>
          </div>
        </div>

        <div className="glass rounded-2xl shadow-card p-5 md:p-6 space-y-4">
          {step === "new-password" ? (
            <form onSubmit={handleSetNewPassword} className="space-y-3">
              <div className="space-y-2.5">
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Новый пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 bg-background border-border rounded-xl text-base focus-visible:ring-viral focus-visible:ring-2"
                    disabled={loading}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Повторите новый пароль"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-11 h-12 bg-background border-border rounded-xl text-base focus-visible:ring-viral focus-visible:ring-2"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
                {password && (
                  <div className="space-y-1.5 px-1">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= strength.score ? strength.color : "bg-muted")} />
                      ))}
                    </div>
                    {strength.label && (
                      <p className="text-[11px] text-muted-foreground">
                        Надёжность пароля: <span className="font-semibold text-foreground">{strength.label}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 bg-viral text-viral-foreground hover:bg-viral/90 rounded-xl text-base font-bold shadow-glow-viral transition-all active:scale-[0.98]">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (<>Сохранить пароль <ArrowRight className="h-5 w-5 ml-2" /></>)}
              </Button>
            </form>
          ) : step === "otp" ? (
            <div className="space-y-5 py-2">
              <OTPInput
                length={6}
                value={otp}
                onChange={setOtp}
                onComplete={(code) => handleVerifyOtp(code)}
                disabled={otpVerifying}
                errorPulse={otpError}
              />

              <Button
                type="button"
                disabled={otpVerifying || otp.length !== 6}
                onClick={() => handleVerifyOtp()}
                className="w-full h-12 bg-viral text-viral-foreground hover:bg-viral/90 rounded-xl text-base font-bold shadow-glow-viral transition-all active:scale-[0.98]"
              >
                {otpVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Подтвердить"}
              </Button>

              <div className="text-center text-sm">
                {canResend ? (
                  <button type="button" onClick={handleResendOtp} disabled={loading} className="text-foreground hover:text-viral transition-colors font-semibold">
                    {loading ? "Отправляем..." : "Отправить код повторно"}
                  </button>
                ) : (
                  <span className="text-muted-foreground">Отправить код повторно через {secondsLeft} сек</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => { setStep("form"); setOtp(""); }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Изменить email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2.5">
                {mode === "register" && (
                  <>
                    <div className="relative animate-fade-in">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="text" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} className="pl-11 h-12 bg-background border-border rounded-xl text-base focus-visible:ring-viral focus-visible:ring-2" disabled={loading} autoComplete="name" />
                    </div>
                    <div className="relative animate-fade-in flex gap-2">
                      <div className="relative shrink-0 w-[92px]">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <select value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} className="h-12 w-full pl-9 pr-2 bg-background border border-border rounded-xl text-base appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-viral" disabled={loading}>
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
                      <Input type="tel" placeholder="Номер телефона" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 bg-background border-border rounded-xl text-base focus-visible:ring-viral focus-visible:ring-2" disabled={loading} autoComplete="tel" />
                    </div>
                  </>
                )}

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value.toLowerCase())} className="pl-11 h-12 bg-background border-border rounded-xl text-base focus-visible:ring-viral focus-visible:ring-2" disabled={loading} autoComplete="email" inputMode="email" />
                </div>

                {mode !== "forgot" && (
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type={showPassword ? "text" : "password"} placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 pr-11 h-12 bg-background border-border rounded-xl text-base focus-visible:ring-viral focus-visible:ring-2" disabled={loading} autoComplete={mode === "login" ? "current-password" : "new-password"} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                )}

                {mode === "register" && (
                  <>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type={showPassword ? "text" : "password"} placeholder="Повторите пароль" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-11 h-12 bg-background border-border rounded-xl text-base focus-visible:ring-viral focus-visible:ring-2" disabled={loading} autoComplete="new-password" />
                    </div>
                    {password && (
                      <div className="space-y-1.5 px-1">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map((i) => (
                            <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= strength.score ? strength.color : "bg-muted")} />
                          ))}
                        </div>
                        {strength.label && (
                          <p className="text-[11px] text-muted-foreground">
                            Надёжность пароля: <span className="font-semibold text-foreground">{strength.label}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {mode === "register" && (
                <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                  <input type="checkbox" checked={eulaAccepted} onChange={(e) => setEulaAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border accent-viral shrink-0" />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    Я принимаю{" "}
                    <a href="/terms" target="_blank" className="text-foreground hover:underline font-medium">Пользовательское соглашение</a>{" "}
                    и{" "}
                    <a href="/privacy" target="_blank" className="text-foreground hover:underline font-medium">Политику конфиденциальности</a>
                    . Я понимаю, что нетерпимый, оскорбительный контент запрещён.
                  </span>
                </label>
              )}

              {mode === "login" && (
                <div className="text-right -mt-1">
                  <button type="button" onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
                    Забыли пароль?
                  </button>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-12 bg-viral text-viral-foreground hover:bg-viral/90 rounded-xl text-base font-bold shadow-glow-viral transition-all active:scale-[0.98]">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {mode === "login" && "Войти"}
                    {mode === "register" && "Зарегистрироваться"}
                    {mode === "forgot" && "Получить код"}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        {step === "form" && (
          <div className="text-center text-sm text-muted-foreground mt-5">
            {mode === "forgot" ? (
              <button onClick={() => setMode("login")} className="text-foreground hover:text-viral transition-colors font-semibold inline-flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" /> Вернуться ко входу
              </button>
            ) : (
              <p>
                {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
                <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-foreground hover:text-viral transition-colors font-bold">
                  {mode === "login" ? "Зарегистрироваться" : "Войти"}
                </button>
              </p>
            )}
          </div>
        )}

        {isNative && <div className="h-8" />}
      </div>
    </div>
  );
}
