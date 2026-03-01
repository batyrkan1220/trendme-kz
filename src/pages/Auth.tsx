import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Mail, Lock, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Заполните все поля");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error("Ошибка входа: " + error.message);
        } else {
          navigate("/dashboard");
        }
      } else {
        if (password.length < 6) {
          toast.error("Пароль должен быть не менее 6 символов");
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password);
        if (error) {
          toast.error("Ошибка регистрации: " + error.message);
        } else {
          toast.success("Проверьте email для подтверждения регистрации");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-200/30 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-200/30 to-transparent rounded-full blur-3xl" />

      <div className="w-full max-w-sm space-y-8 animate-fade-in relative">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-hero glow-primary animate-bounce-soft">
            <Flame className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Trend TikTok</h1>
            <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              {isLogin ? "Войдите в свой аккаунт" : "Создайте аккаунт"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-12 bg-card border-border rounded-xl card-shadow"
                disabled={loading}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 h-12 bg-card border-border rounded-xl card-shadow"
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 gradient-hero text-primary-foreground border-0 glow-primary hover:opacity-90 transition-opacity rounded-xl text-base font-semibold"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                {isLogin ? "Войти" : "Зарегистрироваться"}
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline font-semibold"
          >
            {isLogin ? "Зарегистрироваться" : "Войти"}
          </button>
        </p>
      </div>
    </div>
  );
}
