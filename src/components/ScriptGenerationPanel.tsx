import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { isNativePlatform } from "@/lib/native";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import {
  Copy, RefreshCw, Send, Sparkles, Loader2, ArrowLeft, MessageCircle, X,
  Check, Undo2, ChevronDown, ChevronUp, Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTokens } from "@/hooks/useTokens";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { trackPlausible } from "@/components/TrackingPixels";

interface ScriptPanelProps {
  transcript: string;
  summary: any;
  caption: string;
  language?: "ru" | "kk";
  videoUrl?: string;
  coverUrl?: string | null;
  onBack: () => void;
}

type Msg = { role: "user" | "assistant"; content: string };

const SCRIPT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-script`;

async function streamScript({
  transcript, summary, caption, language, messages, onDelta, onDone, onError,
}: {
  transcript: string; summary: any; caption: string; language?: string;
  messages: Msg[]; onDelta: (text: string) => void; onDone: () => void; onError: (err: string) => void;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token && !isNativePlatform) { onError("Необходимо авторизоваться"); return; }

  const resp = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ transcript, summary, caption, language, messages }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Ошибка сервера" }));
    onError(err.error || "Ошибка генерации"); return;
  }
  if (!resp.body) { onError("Нет ответа"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const c = parsed.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch { buf = line + "\n" + buf; break; }
    }
  }
  onDone();
}

export function ScriptGenerationPanel({
  transcript, summary, caption, language = "ru", videoUrl, onBack,
}: ScriptPanelProps) {
  const { user } = useAuth();
  const { spend } = useTokens();
  const isKk = language === "kk";

  const [messages, setMessages] = useState<Msg[]>([]);
  const [scriptContent, setScriptContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatOpen, setChatOpen] = useState(typeof window !== "undefined" && window.innerWidth >= 1024);
  const [copiedAll, setCopiedAll] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  const [sheetSnap, setSheetSnap] = useState<"half" | "full">("half");
  const [chatWidth, setChatWidth] = useState<number>(() => {
    if (typeof window === "undefined") return 440;
    const saved = parseInt(localStorage.getItem("script-chat-width") || "0", 10);
    return saved >= 360 && saved <= 600 ? saved : 440;
  });
  const isResizingRef = useRef(false);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const scriptRef = useRef("");
  const savedScriptId = useRef<string | null>(null);
  const prevScriptRef = useRef<string | null>(null);
  const prevMessagesRef = useRef<Msg[] | null>(null);

  // ── Initial generation ─────────────────────────────────
  useEffect(() => {
    (async () => {
      if (!isNativePlatform || user) {
        const ok = await spend("script_generation", isKk ? "Сценарий генерациясы" : "Генерация сценария");
        if (!ok) { onBack(); return; }
      }
      generateScript([]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const greetingMsg: Msg = useMemo(() => ({
    role: "assistant",
    content: isKk
      ? "Сәлем! 👋 Сценарийді кез келген сұраныс бойынша өзгерте аламын — қысқарту, эмоция қосу, жаңа хук және т.б."
      : "Привет! 👋 Я могу переписать сценарий по любому запросу — сократить, добавить эмоцию, сменить хук и т.д.",
  }), [isKk]);

  const generateScript = async (chatMsgs: Msg[]) => {
    setIsGenerating(true);
    setScriptContent("");
    scriptRef.current = "";
    if (chatMsgs.length === 0) setMessages([greetingMsg]);
    let accumulated = "";
    await streamScript({
      transcript, summary, caption, language, messages: chatMsgs,
      onDelta: (text) => { accumulated += text; scriptRef.current = accumulated; setScriptContent(accumulated); },
      onDone: () => { setIsGenerating(false); autoSaveScript(); },
      onError: (err) => { toast.error(err); setIsGenerating(false); },
    });
  };

  const sendMessage = async (text: string) => {
    if (!text || isGenerating) return;
    setChatInput("");
    prevScriptRef.current = scriptRef.current || scriptContent;
    prevMessagesRef.current = messages;

    const userMsg: Msg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsGenerating(true);
    setScriptContent("");
    scriptRef.current = "";
    let accumulated = "";
    const apiMessages = newMessages
      .filter((m, i) => !(i === 0 && m.role === "assistant"))
      .map(m => ({ role: m.role, content: m.content }));
    await streamScript({
      transcript, summary, caption, language, messages: apiMessages,
      onDelta: (t) => { accumulated += t; scriptRef.current = accumulated; setScriptContent(accumulated); },
      onDone: () => {
        setIsGenerating(false);
        autoSaveScript();
        trackPlausible("Content Created");
        setMessages(prev => [...prev, {
          role: "assistant",
          content: isKk ? "Сценарий жаңартылды ✨" : "Сценарий обновлён ✨",
        }]);
        if (prevScriptRef.current) setCanUndo(true);
      },
      onError: (err) => { toast.error(err); setIsGenerating(false); },
    });
  };

  const handleSend = () => sendMessage(chatInput.trim());

  const handleUndo = async () => {
    const prev = prevScriptRef.current;
    if (!prev || isGenerating) return;
    setScriptContent(prev);
    scriptRef.current = prev;
    if (prevMessagesRef.current) setMessages(prevMessagesRef.current);
    setCanUndo(false);
    prevScriptRef.current = null;
    prevMessagesRef.current = null;
    await autoSaveScript();
    toast.success(isKk ? "Өзгерістер қайтарылды" : "Изменения отменены");
  };

  const handleRegenerate = async () => {
    if (!isNativePlatform || user) {
      const ok = await spend("script_generation", isKk ? "Сценарийді қайта генерациялау" : "Перегенерация сценария");
      if (!ok) return;
    }
    setMessages([greetingMsg]);
    setCanUndo(false);
    prevScriptRef.current = null;
    prevMessagesRef.current = null;
    generateScript([]);
  };

  const copyScript = async () => {
    const text = scriptRef.current || scriptContent;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success(isKk ? "Сценарий көшірілді!" : "Сценарий скопирован!");
    setTimeout(() => setCopiedAll(false), 1800);
  };

  const autoSaveScript = async () => {
    if (!user) return;
    const content = scriptRef.current;
    if (!content) return;
    const title = caption?.slice(0, 80) || "Сценарий";
    if (savedScriptId.current) {
      await supabase.from("saved_scripts").update({ content }).eq("id", savedScriptId.current);
    } else {
      const { data } = await supabase.from("saved_scripts").insert({
        user_id: user.id, title, content, source_video_url: videoUrl || null,
      }).select("id").single();
      if (data) savedScriptId.current = data.id;
    }
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2200);
  };

  // Word count + reading time
  const scriptStats = useMemo(() => {
    const plain = scriptContent.replace(/[#*`_>-]/g, "").trim();
    const words = plain ? plain.split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.round(words / 150));
    return { words, minutes };
  }, [scriptContent]);

  // ── Auto-scroll chat ───────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // ── iOS keyboard ───────────────────────────────────────
  useEffect(() => {
    if (!chatOpen) { setKeyboardHeight(0); return; }
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const kbH = window.innerHeight - vv.height;
      setKeyboardHeight(kbH > 50 ? kbH : 0);
    };
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    onResize();
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
    };
  }, [chatOpen]);

  // ── Swipe back ─────────────────────────────────────────
  const { swipeProps: backSwipeProps, swipeStyle: backSwipeStyle } = useSwipeBack({
    onBack, disabled: chatOpen,
  });

  // ── Desktop chat resize ───────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const w = Math.min(600, Math.max(360, window.innerWidth - e.clientX));
      setChatWidth(w);
    };
    const onUp = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      localStorage.setItem("script-chat-width", String(chatWidth));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [chatWidth]);

  const startResize = () => {
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    if (!chatOpen) setSheetSnap("half");
  }, [chatOpen]);

  // ── Quick action presets ───────────────────────────────
  const quickActions = useMemo(() => [
    { emoji: "🔥", label: isKk ? "Хукты күшейт" : "Сильнее хук",
      prompt: isKk ? "Бастапқы хукты толық ауыстыр, әлдеқайда күштірек қыл" : "Сделай хук в начале значительно сильнее, замени его полностью" },
    { emoji: "😂", label: isKk ? "Юмор қос" : "Добавь юмор",
      prompt: isKk ? "Сценарийге жеңіл юмор мен ирония қос" : "Добавь лёгкий юмор и иронию в сценарий" },
    { emoji: "⚡", label: isKk ? "30 сек" : "До 30 сек",
      prompt: isKk ? "Сценарийді дәл 30 секундқа қысқарт, ең маңызды бөліктерді ғана қалдыр" : "Сократи сценарий ровно до 30 секунд, оставь только самое важное" },
    { emoji: "🎯", label: isKk ? "Instagram" : "Под Instagram",
      prompt: isKk ? "Сценарийді Instagram Reels форматына бейімде — стиль, ұзақтық, CTA" : "Адаптируй сценарий под Instagram Reels — стиль, длительность, CTA" },
    { emoji: "🇰🇿", label: isKk ? "Орысшаға" : "На казахский",
      prompt: isKk ? "Сценарийді орыс тіліне аудар, табиғи стильмен" : "Переведи весь сценарий на казахский язык, естественным разговорным стилем" },
  ], [isKk]);

  return (
    <div
      className="flex flex-col h-full relative bg-background"
      {...backSwipeProps}
      style={backSwipeStyle}
    >
      {/* ═════════ HEADER ═════════ */}
      <header
        className="flex items-center gap-2 px-3 md:px-5 py-2.5 border-b border-border/60 bg-card/95 backdrop-blur-xl shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors active:scale-95 shrink-0"
          aria-label="Назад"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-viral/15 ring-1 ring-viral/30 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground leading-none mb-0.5">
              AI Сценарист
            </p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-[14px] md:text-[15px] font-bold text-foreground leading-none truncate tracking-tight">
                {isKk ? "Сценарий редакторы" : "Редактор сценария"}
              </h2>
              {scriptStats.words > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10.5px] text-muted-foreground tabular-nums">
                  <Clock className="h-3 w-3" />
                  {scriptStats.words} {isKk ? "сөз" : "слов"} · ~{scriptStats.minutes} мин
                </span>
              )}
            </div>
          </div>
        </div>

        {savedToast && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground animate-fade-in mr-1">
            <Check className="h-3 w-3 text-green-500" />
            {isKk ? "Сақталды" : "Сохранено"}
          </span>
        )}

        {canUndo && (
          <button
            onClick={handleUndo}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 h-9 rounded-lg text-[12px] font-semibold text-foreground bg-viral/15 ring-1 ring-viral/40 hover:bg-viral hover:text-viral-foreground transition-all active:scale-95 disabled:opacity-50 animate-fade-in"
            title={isKk ? "Соңғы өзгерісті қайтару" : "Отменить последнее изменение"}
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isKk ? "Қайтару" : "Отменить"}</span>
          </button>
        )}

        <button
          onClick={handleRegenerate}
          disabled={isGenerating}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          title={isKk ? "Қайта" : "Заново"}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
          {isKk ? "Қайта" : "Заново"}
        </button>

        <button
          onClick={copyScript}
          disabled={!scriptContent}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-[12px] font-semibold text-foreground bg-muted hover:bg-muted/70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {copiedAll ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">
            {copiedAll ? (isKk ? "Көшірілді" : "Скопировано") : (isKk ? "Көшіру" : "Копировать")}
          </span>
        </button>

        <button
          onClick={() => setChatOpen(v => !v)}
          className={`hidden lg:inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-[12px] font-semibold transition-all ${
            chatOpen
              ? "bg-muted text-foreground hover:bg-muted/70"
              : "bg-viral text-viral-foreground hover:brightness-105 shadow-glow-viral"
          }`}
          title={chatOpen ? (isKk ? "Чатты жабу" : "Скрыть чат") : (isKk ? "AI чатты ашу" : "Открыть AI чат")}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {chatOpen ? (isKk ? "Жабу" : "Скрыть") : (isKk ? "AI чат" : "AI чат")}
        </button>
      </header>

      {/* ═════════ BODY ═════════ */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Script column */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto px-3 md:px-8 py-5 md:py-8 pb-32 md:pb-10">
            <div className="max-w-2xl mx-auto">
              {isGenerating && !scriptContent ? (
                <LoadingSkeleton isKk={isKk} />
              ) : scriptContent ? (
                <article className="bg-card rounded-2xl border border-border/60 shadow-soft p-5 md:p-8">
                  <div className="prose prose-sm max-w-none text-foreground
                    [&_h1]:text-foreground [&_h1]:text-[20px] [&_h1]:font-black [&_h1]:mt-7 [&_h1]:mb-4 [&_h1]:tracking-tight
                    [&_h2]:text-foreground [&_h2]:text-[16px] [&_h2]:font-extrabold [&_h2]:mt-7 [&_h2]:mb-3 [&_h2]:tracking-tight [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2
                    [&_h3]:text-foreground [&_h3]:text-[14.5px] [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-2
                    [&_strong]:text-foreground [&_strong]:font-bold
                    [&_p]:text-foreground/85 [&_p]:mb-3 [&_p]:leading-[1.75] [&_p]:text-[14.5px]
                    [&_li]:text-foreground/85 [&_li]:mb-1.5 [&_li]:leading-[1.7] [&_li]:text-[14px]
                    [&_ol]:space-y-1.5 [&_ul]:space-y-1.5
                    [&_hr]:my-7 [&_hr]:border-border/40
                    [&_blockquote]:border-l-[3px] [&_blockquote]:border-viral [&_blockquote]:bg-viral/10 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:rounded-r-xl [&_blockquote]:my-4
                    [&_blockquote_p]:text-foreground [&_blockquote_p]:font-semibold [&_blockquote_p]:text-[14px] [&_blockquote_p]:mb-0
                    [&_em]:text-muted-foreground [&_em]:text-[12.5px] [&_em]:not-italic [&_em]:opacity-85
                    [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_code]:font-mono">
                    <ReactMarkdown>{scriptContent}</ReactMarkdown>
                  </div>
                  {isGenerating && (
                    <div className="mt-4 flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-[12.5px]">{isKk ? "Жалғасуда..." : "Продолжаю писать..."}</span>
                    </div>
                  )}
                </article>
              ) : null}

              {/* Quick actions */}
              {scriptContent && !isGenerating && (
                <div className="mt-6 animate-fade-in">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                    {isKk ? "Жылдам өзгерістер" : "Быстрые правки"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((a) => (
                      <button
                        key={a.label}
                        onClick={() => sendMessage(a.prompt)}
                        disabled={isGenerating}
                        className="inline-flex items-center gap-1.5 px-3.5 h-10 rounded-full bg-card border border-border/60 text-[13px] font-semibold text-foreground/85 hover:bg-viral hover:text-viral-foreground hover:border-transparent hover:shadow-glow-viral transition-all active:scale-95 disabled:opacity-50"
                      >
                        <span className="text-base leading-none">{a.emoji}</span>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop resize handle */}
        {chatOpen && (
          <button
            onMouseDown={startResize}
            className="hidden lg:block w-1.5 cursor-col-resize bg-transparent hover:bg-viral/30 active:bg-viral/50 transition-colors shrink-0 group relative"
            title={isKk ? "Чат енін өзгерту" : "Изменить ширину чата"}
            aria-label="Resize chat"
          >
            <span className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border/40 group-hover:bg-viral/60 transition-colors" />
          </button>
        )}

        {/* Desktop right chat panel */}
        <aside
          className="hidden lg:flex flex-col border-l border-border/60 bg-card overflow-hidden shrink-0"
          style={{
            width: chatOpen ? `${chatWidth}px` : "0px",
            borderLeftWidth: chatOpen ? "1px" : "0",
            transition: isResizingRef.current ? "none" : "width 280ms ease, border-left-width 280ms ease",
          }}
        >
          {chatOpen && (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-viral/15 ring-1 ring-viral/30 flex items-center justify-center">
                    <MessageCircle className="h-3.5 w-3.5 text-foreground" />
                  </div>
                  <span className="text-[13.5px] font-bold text-foreground tracking-tight">
                    {isKk ? "AI көмекші" : "AI помощник"}
                  </span>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg, i) => (
                  <ChatBubble key={i} role={msg.role} content={msg.content} />
                ))}
                {isGenerating && <ChatBubbleTyping isKk={isKk} />}
                <div ref={chatEndRef} />
              </div>

              {/* Quick chips */}
              <div className="px-3 pt-2 pb-1 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-hide">
                {quickActions.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => sendMessage(a.prompt)}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-[12px] font-semibold border border-border/60 bg-background text-foreground/80 hover:bg-viral hover:text-viral-foreground hover:border-transparent transition-all whitespace-nowrap shrink-0 disabled:opacity-50 active:scale-95"
                  >
                    <span className="text-xs leading-none">{a.emoji}</span>
                    {a.label}
                  </button>
                ))}
              </div>

              <div className="p-3 border-t border-border/50 shrink-0">
                <div className="flex gap-2 items-end">
                  <input
                    ref={desktopInputRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder={isKk ? "ИИ-ден сценарийді өзгертуді сұраңыз..." : "Попросите AI изменить сценарий..."}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-background border border-border/60 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-viral/40 focus:border-viral/50"
                    disabled={isGenerating}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!chatInput.trim() || isGenerating}
                    className="w-11 h-11 rounded-xl bg-viral text-viral-foreground flex items-center justify-center hover:brightness-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-soft shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* ═════════ MOBILE floating chat trigger ═════════ */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="lg:hidden fixed left-1/2 -translate-x-1/2 z-[99997] flex items-center gap-2 pl-4 pr-5 h-13 rounded-full bg-viral text-viral-foreground shadow-glow-viral active:scale-95 transition-transform animate-fade-in ring-1 ring-foreground/10"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
          aria-label="AI чат"
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          <span className="text-[14px] font-bold whitespace-nowrap">
            {isKk ? "AI редактор" : "AI редактор"}
          </span>
        </button>
      )}

      {/* ═════════ MOBILE chat sheet ═════════ */}
      {chatOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[99998] flex flex-col"
          style={{
            height: keyboardHeight > 0 ? `${window.visualViewport?.height || window.innerHeight}px` : "100%",
            top: keyboardHeight > 0 ? `${window.visualViewport?.offsetTop || 0}px` : 0,
          }}
        >
          <div
            className="flex-1 min-h-0 bg-foreground/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setChatOpen(false)}
          />
          <div
            className="bg-card rounded-t-3xl border-t border-border/60 shadow-2xl flex flex-col transition-[height] duration-300 ease-out"
            style={{
              height: keyboardHeight > 0
                ? `${(window.visualViewport?.height || window.innerHeight) * 0.8}px`
                : sheetSnap === "full" ? "92vh" : "62vh",
              animation: "slide-up 0.3s ease-out",
            }}
          >
            {/* Drag handle */}
            <button
              onClick={() => keyboardHeight === 0 && setSheetSnap(s => s === "half" ? "full" : "half")}
              className="flex flex-col items-center pt-3 pb-1 shrink-0 active:scale-95 transition-transform"
              aria-label={sheetSnap === "half" ? "Развернуть" : "Свернуть"}
            >
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/40 hover:bg-muted-foreground/60 transition-colors" />
            </button>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-4 pb-2.5 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-viral/15 ring-1 ring-viral/30 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground leading-none mb-0.5">
                    AI Сценарист
                  </p>
                  <span className="text-[14px] font-bold text-foreground tracking-tight leading-none">
                    {isKk ? "Редактор" : "Редактор"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {keyboardHeight === 0 && (
                  <button
                    onClick={() => setSheetSnap(s => s === "half" ? "full" : "half")}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                    aria-label={sheetSnap === "half" ? "Развернуть" : "Свернуть"}
                  >
                    {sheetSnap === "half"
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                )}
                <button
                  onClick={() => setChatOpen(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Закрыть"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Quick chips */}
            {keyboardHeight === 0 && (
              <div className="px-3 py-2.5 flex gap-1.5 overflow-x-auto shrink-0 border-b border-border/40 scrollbar-hide">
                {quickActions.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => sendMessage(a.prompt)}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-[12px] font-semibold border border-border/60 bg-background text-foreground/80 hover:bg-viral hover:text-viral-foreground hover:border-transparent transition-all whitespace-nowrap shrink-0 disabled:opacity-50 active:scale-95"
                  >
                    <span className="text-sm leading-none">{a.emoji}</span>
                    {a.label}
                  </button>
                ))}
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-[12px] font-semibold border border-viral/40 text-foreground bg-viral/10 hover:bg-viral hover:text-viral-foreground hover:border-transparent transition-all whitespace-nowrap shrink-0 disabled:opacity-50 active:scale-95"
                >
                  <RefreshCw className={`h-3 w-3 ${isGenerating ? "animate-spin" : ""}`} />
                  {isKk ? "Қайта" : "Заново"}
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
              {messages.map((msg, i) => (
                <ChatBubble key={i} role={msg.role} content={msg.content} />
              ))}
              {isGenerating && <ChatBubbleTyping isKk={isKk} />}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div
              className="p-3 border-t border-border/50 shrink-0 bg-card"
              style={{ paddingBottom: keyboardHeight > 0 ? "10px" : "max(env(safe-area-inset-bottom, 0px) + 12px, 12px)" }}
            >
              <div className="flex gap-2">
                <input
                  ref={mobileInputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder={isKk ? "ИИ-ден сценарийді өзгертуді сұраңыз..." : "Попросите AI изменить сценарий..."}
                  className="flex-1 px-3.5 py-3 rounded-xl bg-background border border-border/60 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-viral/40 focus:border-viral/50"
                  disabled={isGenerating}
                />
                <button
                  onClick={handleSend}
                  disabled={!chatInput.trim() || isGenerating}
                  className="w-12 h-12 rounded-xl bg-viral text-viral-foreground flex items-center justify-center hover:brightness-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-soft shrink-0"
                  aria-label="Отправить"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────── Sub-components ───────────────────────
function ChatBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap ${
          role === "user"
            ? "bg-foreground text-background rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

function ChatBubbleTyping({ isKk }: { isKk: boolean }) {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl px-3.5 py-2.5 bg-muted text-foreground rounded-bl-md flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground" />
        <span className="text-[12px] text-muted-foreground">
          {isKk ? "Жазып жатыр..." : "Пишу..."}
        </span>
      </div>
    </div>
  );
}

function LoadingSkeleton({ isKk }: { isKk: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5 animate-fade-in">
      <div className="relative">
        <span className="absolute inset-0 rounded-2xl bg-viral/50 blur-2xl -z-10 animate-viral-pulse" />
        <div className="w-24 h-24 rounded-2xl bg-viral flex items-center justify-center shadow-glow-viral animate-scale-in ring-1 ring-foreground/10">
          <Sparkles className="h-10 w-10 text-viral-foreground animate-pulse" />
        </div>
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-foreground font-bold text-[16px] tracking-tight">
          {isKk ? "Сценарий генерациялануда..." : "Пишем сценарий..."}
        </p>
        <p className="text-[12.5px] text-muted-foreground">
          {isKk ? "10–20 секунд" : "10–20 секунд"}
        </p>
      </div>

      {/* Skeleton article preview */}
      <div className="w-full bg-card rounded-2xl border border-border/60 shadow-soft p-5 md:p-7 space-y-3">
        <div className="h-5 w-1/2 rounded-md bg-muted animate-pulse" />
        <div className="space-y-2 pt-1">
          <div className="h-3 w-full rounded bg-muted animate-pulse" style={{ animationDelay: "0.1s" }} />
          <div className="h-3 w-[95%] rounded bg-muted animate-pulse" style={{ animationDelay: "0.2s" }} />
          <div className="h-3 w-[75%] rounded bg-muted animate-pulse" style={{ animationDelay: "0.3s" }} />
        </div>
        <div className="h-4 w-1/3 rounded-md bg-muted animate-pulse mt-5" />
        <div className="space-y-2 pt-1">
          <div className="h-3 w-full rounded bg-muted animate-pulse" style={{ animationDelay: "0.4s" }} />
          <div className="h-3 w-[90%] rounded bg-muted animate-pulse" style={{ animationDelay: "0.5s" }} />
        </div>
      </div>
    </div>
  );
}
