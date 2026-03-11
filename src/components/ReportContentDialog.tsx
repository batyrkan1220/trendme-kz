import { useState } from "react";
import { Flag, ShieldX, AlertTriangle, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const REASONS = [
  { value: "inappropriate", label: "Неприемлемый контент", icon: AlertTriangle },
  { value: "spam", label: "Спам / Реклама", icon: ShieldX },
  { value: "misleading", label: "Вводящий в заблуждение", icon: Flag },
  { value: "other", label: "Другое", icon: Flag },
];

interface ReportContentDialogProps {
  open: boolean;
  onClose: () => void;
  videoId: string;
  videoUrl: string;
  authorUsername?: string;
}

export function ReportContentDialog({ open, onClose, videoId, videoUrl, authorUsername }: ReportContentDialogProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [blocking, setBlocking] = useState(false);

  if (!open) return null;

  const handleReport = async () => {
    if (!user || !reason) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("content_reports" as any).insert({
        user_id: user.id,
        video_id: videoId,
        video_url: videoUrl,
        author_username: authorUsername || null,
        reason,
        details: details.trim() || null,
      } as any);
      if (error) throw error;
      setSubmitted(true);
      toast.success("Жалоба отправлена. Мы рассмотрим её в течение 24 часов.");
    } catch {
      toast.error("Не удалось отправить жалобу");
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!user || !authorUsername) return;
    setBlocking(true);
    try {
      const { error } = await supabase.from("blocked_users" as any).insert({
        user_id: user.id,
        blocked_username: authorUsername,
      } as any);
      if (error && !(error as any).message?.includes("duplicate")) throw error;
      toast.success(`Пользователь @${authorUsername} заблокирован`);
    } catch {
      toast.error("Не удалось заблокировать пользователя");
    } finally {
      setBlocking(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setDetails("");
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl p-5 pb-8 sm:pb-5 animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar for mobile */}
        <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-4 sm:hidden" />

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check className="h-7 w-7 text-green-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">Жалоба отправлена</h3>
              <p className="text-sm text-muted-foreground mt-1">Мы рассмотрим вашу жалобу в течение 24 часов</p>
            </div>
            {authorUsername && (
              <button
                onClick={handleBlock}
                disabled={blocking}
                className="w-full py-3 rounded-xl bg-destructive/10 text-destructive text-sm font-semibold hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
              >
                {blocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldX className="h-4 w-4" />}
                Заблокировать @{authorUsername}
              </button>
            )}
            <button onClick={handleClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Закрыть
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Flag className="h-5 w-5 text-destructive" />
              <h3 className="text-lg font-bold text-foreground">Пожаловаться</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-4">Выберите причину жалобы:</p>

            <div className="flex flex-col gap-2 mb-4">
              {REASONS.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                      reason === r.value
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "bg-muted/50 text-foreground border border-transparent hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {r.label}
                  </button>
                );
              })}
            </div>

            <textarea
              placeholder="Дополнительные подробности (необязательно)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full h-20 px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground text-sm font-semibold hover:bg-muted/80 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleReport}
                disabled={!reason || loading}
                className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                Отправить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
