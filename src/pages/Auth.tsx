import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2, User, Phone, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoIcon from "@/assets/logo-icon-cropped.png";

type MobileTab = "login" | "register";

export default function Auth() {
  const [mobileTab, setMobileTab] = useState<MobileTab>("login");
  const [showForgot, setShowForgot] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // Forgot state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) { toast.error("Введите email"); return; }
    if (!loginPassword) { toast.error("Введите пароль"); return; }
    setLoginLoading(true);
    try {
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) toast.error("Ошибка входа: " + error.message);
      else navigate("/dashboard");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) { toast.error("Введите имя"); return; }
    if (!regPhone.trim()) { toast.error("Введите номер телефона"); return; }
    if (!regEmail) { toast.error("Введите email"); return; }
    if (!regPassword) { toast.error("Введите пароль"); return; }
    if (regPassword.length < 6) { toast.error("Пароль должен быть не менее 6 символов"); return; }
    setRegLoading(true);
    try {
      const { error } = await signUp(regEmail, regPassword, { name: regName.trim(), phone: regPhone.trim() });
      if (error) toast.error("Ошибка регистрации: " + error.message);
      else toast.success("Проверьте email для подтверждения регистрации");
    } finally {
      setRegLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) { toast.error("Введите email"); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) toast.error("Ошибка: " + error.message);
    else toast.success("Ссылка для сброса отправлена на email");
  };

  if (showForgot) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 py-8 relative">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-[0.06]" style={{ background: "hsl(var(--primary))" }} />
        <Link to="/" className="absolute top-4 left-4 md:top-6 md:left-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> На главную
        </Link>
        <div className="w-full max-w-sm space-y-6 animate-fade-in">
          <div className="text-center space-y-3">
            <img src={logoIcon} alt="TrendMe" className="h-14 w-14 rounded-2xl shadow-lg mx-auto" />
            <h1 className="text-2xl font-bold">Восстановление пароля</h1>
            <p className="text-sm text-muted-foreground">Введите email для получения ссылки сброса</p>
          </div>
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="Email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="pl-11 h-12 bg-card border-border rounded-xl text-sm" disabled={forgotLoading} />
            </div>
            <Button type="submit" disabled={forgotLoading} className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-semibold">
              {forgotLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Отправить ссылку <ArrowRight className="h-4 w-4 ml-2" /></>}
            </Button>
          </form>
          <div className="text-center">
            <button onClick={() => setShowForgot(false)} className="text-sm text-primary hover:underline font-semibold inline-flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Назад ко входу
            </button>
          </div>
        </div>
      </div>
    );
  }

  const LoginForm = (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="pl-11 h-12 bg-card border-border rounded-xl text-sm" disabled={loginLoading} />
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="password" placeholder="Пароль" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pl-11 h-12 bg-card border-border rounded-xl text-sm" disabled={loginLoading} />
        </div>
      </div>
      <div className="text-right">
        <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-primary hover:underline">
          Забыли пароль?
        </button>
      </div>
      <Button type="submit" disabled={loginLoading} className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-semibold">
        {loginLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Войти <ArrowRight className="h-4 w-4 ml-2" /></>}
      </Button>
    </form>
  );

  const RegisterForm = (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="text" placeholder="Имя" value={regName} onChange={(e) => setRegName(e.target.value)} className="pl-11 h-12 bg-card border-border rounded-xl text-sm" disabled={regLoading} />
        </div>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="tel" placeholder="Номер телефона" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="pl-11 h-12 bg-card border-border rounded-xl text-sm" disabled={regLoading} />
        </div>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="email" placeholder="Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="pl-11 h-12 bg-card border-border rounded-xl text-sm" disabled={regLoading} />
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="password" placeholder="Пароль (мин. 6 символов)" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="pl-11 h-12 bg-card border-border rounded-xl text-sm" disabled={regLoading} />
        </div>
      </div>
      <Button type="submit" disabled={regLoading} className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-semibold">
        {regLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Создать аккаунт <ArrowRight className="h-4 w-4 ml-2" /></>}
      </Button>
    </form>
  );

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 right-0 w-72 md:w-[500px] h-72 md:h-[500px] rounded-full blur-[120px] opacity-[0.06]" style={{ background: "hsl(var(--primary))" }} />
      <div className="absolute bottom-0 left-0 w-72 md:w-[400px] h-72 md:h-[400px] rounded-full blur-[100px] opacity-[0.04]" style={{ background: "hsl(var(--primary))" }} />

      <Link to="/" className="absolute top-4 left-4 md:top-6 md:left-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors z-10">
        <ArrowLeft className="h-4 w-4" /> На главную
      </Link>

      <div className="w-full max-w-4xl animate-fade-in relative">
        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <img src={logoIcon} alt="TrendMe" className="h-14 w-14 md:h-16 md:w-16 rounded-2xl shadow-lg mx-auto mb-3 animate-bounce-soft" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            <span className="text-foreground">Trend</span>
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">Me</span>
          </h1>
        </div>

        {/* Mobile: Tabs */}
        <div className="md:hidden mb-6">
          <div className="flex rounded-xl bg-muted p-1">
            <button
              onClick={() => setMobileTab("login")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mobileTab === "login"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => setMobileTab("register")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mobileTab === "register"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Регистрация
            </button>
          </div>
        </div>

        {/* Mobile: Active form */}
        <div className="md:hidden">
          <div className="bg-card border border-border/50 rounded-2xl p-6 card-shadow">
            <h2 className="text-lg font-bold text-foreground mb-1">
              {mobileTab === "login" ? "Войти в аккаунт" : "Создать аккаунт"}
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              {mobileTab === "login" ? "Введите свои данные для входа" : "Заполните форму для регистрации"}
            </p>
            {mobileTab === "login" ? LoginForm : RegisterForm}
          </div>
        </div>

        {/* Desktop: Two columns */}
        <div className="hidden md:grid md:grid-cols-2 gap-6">
          {/* Login card */}
          <div className="bg-card border border-border/50 rounded-2xl p-8 card-shadow hover-lift transition-all">
            <h2 className="text-xl font-bold text-foreground mb-1">Войти</h2>
            <p className="text-sm text-muted-foreground mb-6">Введите свои данные для входа</p>
            {LoginForm}
          </div>

          {/* Register card */}
          <div className="bg-card border border-primary/20 rounded-2xl p-8 shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.12)] hover-lift transition-all relative">
            <span className="absolute -top-3 left-6 text-xs font-bold text-primary-foreground bg-primary px-3 py-1 rounded-full">
              Новый пользователь
            </span>
            <h2 className="text-xl font-bold text-foreground mb-1">Регистрация</h2>
            <p className="text-sm text-muted-foreground mb-6">Создайте аккаунт бесплатно</p>
            {RegisterForm}
          </div>
        </div>
      </div>
    </div>
  );
}
