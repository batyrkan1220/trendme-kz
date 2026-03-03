import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error("Ошибка входа: " + error.message);
      }
    } catch (err: any) {
      toast.error("Ошибка входа");
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
              Войдите, чтобы начать анализировать тренды
            </p>
          </div>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full h-12 bg-card text-foreground border border-border hover:bg-accent transition-colors rounded-xl text-base font-semibold flex items-center justify-center gap-3"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Войти через Google
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Регистрация и вход — одной кнопкой
        </p>
      </div>
    </div>
  );
}
