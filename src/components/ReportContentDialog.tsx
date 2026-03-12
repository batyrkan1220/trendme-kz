import { useState } from "react";
import { cn } from "@/lib/utils";
import { Flag, ShieldX, AlertTriangle, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

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
  /** When rendered inside a high z-index overlay (e.g. fullscreen player) */
  elevated?: boolean;
}

function ReportContent({
  onClose,
  videoId,
  videoUrl,
  authorUsername,
}: Omit<ReportContentDialogProps, "open" | "elevated">) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const handleReport = async () => {
    console.log("[Report] handleReport called", { userId: user?.id, reason, videoId, videoUrl });

    if (!user) {
      toast.error("Жалоба жіберу үшін аккаунтқа кіріңіз");
      console.warn("[Report] Aborted: user missing");
      return;
    }

    if (!reason) {
      toast.error("Алдымен шағым себебін таңдаңыз");
      console.warn("[Report] Aborted: reason missing");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        user_id: user.id,
        video_id: videoId,
        video_url: videoUrl,
        author_username: authorUsername || null,
        reason,
        details: details.trim() || null,
      };
      console.log("[Report] Inserting:", payload);
      const { error } = await supabase.from("content_reports").insert(payload);
      if (error) {
        console.error("[Report] Supabase error:", error);
        throw error;
      }
      console.log("[Report] Success");
      setSubmitted(true);
    } catch (err) {
      console.error("[Report] Catch error:", err);
      toast.error("Не удалось отправить жалобу");
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!user || !authorUsername) return;
    setBlocking(true);
    try {
      const { error } = await supabase.from("blocked_users").insert({
        user_id: user.id,
        blocked_username: authorUsername,
      });
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

  if (submitted) {
    return (
      <div
        className="flex flex-col items-center gap-4 py-4 px-1"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
          <Check className="h-7 w-7 text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-foreground">Жалоба отправлена</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Мы рассмотрим вашу жалобу в течение 24 часов
          </p>
        </div>
        {authorUsername && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleBlock(); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleBlock(); }}
            disabled={blocking}
            className="w-full py-3 rounded-xl bg-destructive/10 text-destructive text-sm font-semibold hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
            style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
          >
            {blocking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldX className="h-4 w-4" />
            )}
            Заблокировать @{authorUsername}
          </button>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleClose(); }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
        >
          Закрыть
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-3 px-1"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        <Flag className="h-5 w-5 text-destructive" />
        <h3 className="text-lg font-bold text-foreground">Пожаловаться</h3>
      </div>

      <p className="text-sm text-muted-foreground">Выберите причину жалобы:</p>

      <div className="flex flex-col gap-2">
        {REASONS.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.value}
              type="button"
              onClick={(e) => { e.stopPropagation(); setReason(r.value); }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setReason(r.value); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                reason === r.value
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "bg-muted/50 text-foreground border border-transparent hover:bg-muted"
              }`}
              style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
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
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="w-full h-20 px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleClose(); }}
          className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground text-sm font-semibold hover:bg-muted/80 transition-colors"
          style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleReport(); }}
          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleReport(); }}
          disabled={!reason || loading}
          className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Flag className="h-4 w-4" />
          )}
          Отправить
        </button>
      </div>
    </div>
  );
}

export function ReportContentDialog({
  open,
  onClose,
  videoId,
  videoUrl,
  authorUsername,
  elevated = false,
}: ReportContentDialogProps) {
  const isMobile = useIsMobile();
  const contentProps = { onClose, videoId, videoUrl, authorUsername };
  const zClass = elevated ? "z-[10000]" : "";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent
          className={cn("px-4 pb-8", zClass)}
          style={elevated ? { zIndex: 10000 } : undefined}
          overlayClassName={elevated ? "z-[10000]" : undefined}
        >
          <DrawerTitle className="sr-only">Пожаловаться</DrawerTitle>
          <div className="pt-2 pb-4">
            <ReportContent {...contentProps} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn("max-w-sm p-5", zClass)}
        style={elevated ? { zIndex: 10000 } : undefined}
      >
        <DialogTitle className="sr-only">Пожаловаться</DialogTitle>
        <ReportContent {...contentProps} />
      </DialogContent>
    </Dialog>
  );
}
