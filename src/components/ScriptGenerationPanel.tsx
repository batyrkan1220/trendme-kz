import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { isNativePlatform } from "@/lib/native";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import {
  Copy, RefreshCw, Send, Sparkles, Loader2, ArrowLeft, MessageCircle, X,
  Check, Wand2, Scissors, Heart, Zap, Languages, Undo2,
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

export function ScriptGenerationPanel({ transcript, summary, caption, language = "ru", videoUrl, onBack }: ScriptPanelProps) {
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

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const scriptRef = useRef("");
  const savedScriptId = useRef<string | null>(null);

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
      },
      onError: (err) => { toast.error(err); setIsGenerating(false); },
    });
  };

  const handleSend = () => sendMessage(chatInput.trim());

  const handleRegenerate = async () => {
    if (!isNativePlatform || user) {
      const ok = await spend("script_generation", isKk ? "Сценарийді қайта генерациялау" : "Перегенерация сценария");
      if (!ok) return;
    }
    setMessages([greetingMsg]);
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
    onBack,
    disabled: chatOpen,
  });

  // ── Quick action presets ───────────────────────────────
  const quickActions = useMemo(() => [
    { emoji: "🔥", label: isKk ? "Хукты күшейт" : "Сделай хук сильнее",
      prompt: isKk ? "Бастапқы хукты толық ауыстыр, әлдеқайда күштірек қыл" : "Сделай хук в начале значительно сильнее, замени его полностью" },
    { emoji: "😂", label: isKk ? "Юмор қос" : "Добавь юмор",
      prompt: isKk ? "Сценарийге жеңіл юмор мен ирония қос" : "Добавь лёгкий юмор и иронию в сценарий" },
    { emoji: "⚡", label: isKk ? "30 секундқа қысқарт" : "Сократи до 30 сек",
      prompt: isKk ? "Сценарийді дәл 30 секундқа қысқарт, ең маңызды бөліктерді ғана қалдыр" : "Сократи сценарий ровно до 30 секунд, оставь только самое важное" },
    { emoji: "🎯", label: isKk ? "Instagram-ға бейімде" : "Адаптируй под Instagram",
      prompt: isKk ? "Сценарийді Instagram Reels форматына бейімде — стиль, ұзақтық, CTA" : "Адаптируй сценарий под Instagram Reels — стиль, длительность, CTA" },
    { emoji: "🇰🇿", label: isKk ? "Орысшаға аудар" : "Переведи на казахский",
      prompt: isKk ? "Сценарийді орыс тіліне аудар, табиғи стильмен" : "Переведи весь сценарий на казахский язык, естественным разговорным стилем" },
  ], [isKk]);

  return (
    <div
      className="flex flex-col h-full relative bg-background-subtle"
      {...backSwipeProps}
      style={backSwipeStyle}
    >
      {/* ───── Header ───── */}
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

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-viral/15 ring-1 ring-viral/30 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground leading-none mb-0.5">
              AI Сценарист
            </p>
            <h2 className="text-sm font-bold text-foreground leading-none truncate">
              {isKk ? "Сценарий редакторы" : "Редактор сценария"}
            </h2>
          </div>
        </div>

        {savedToast && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground animate-fade-in mr-1">
            <Check className="h-3 w-3 text-success" />
            {isKk ? "Сақталды" : "Сохранено"}
          </span>
        )}

        <button
          onClick={handleRegenerate}
          disabled={isGenerating}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          title={isKk ? "Қайта" : "Заново"}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
          {isKk ? "Қайта" : "Заново"}
        </button>

        <button
          onClick={copyScript}
          disabled={!scriptContent}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold text-foreground bg-muted hover:bg-muted/70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {copiedAll ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">
            {copiedAll ? (isKk ? "Көшірілді" : "Скопировано") : (isKk ? "Көшіру" : "Копировать")}
          </span>
        </button>

        <button
          onClick={() => setChatOpen(v => !v)}
          className={`hidden lg:inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold transition-all ${
            chatOpen
              ? "bg-foreground text-background"
              : "bg-viral text-viral-foreground hover:brightness-105"
          }`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {chatOpen ? (isKk ? "Чатты жабу" : "Скрыть чат") : (isKk ? "AI чат" : "AI чат")}
        </button>
      </header>

      {/* ───── Body: script + (desktop chat) ───── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Script column */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 md:py-6 pb-28 md:pb-8">
            <div className="max-w-3xl mx-auto">
              {isGenerating && !scriptContent ? (
                <div className="flex flex-col items-center justify-center py-16 gap-5 animate-fade-in">
                  <div className="relative">
                    <span className="absolute inset-0 rounded-2xl bg-viral/40 blur-2xl -z-10" />
                    <div className="w-20 h-20 rounded-2xl bg-viral flex items-center justify-center shadow-glow-primary animate-scale-in ring-1 ring-white/20">
                      <Sparkles className="h-9 w-9 text-foreground animate-pulse" />
                    </div>
                  </div>
                  <p className="text-muted-foreground font-medium text-center text-sm md:text-base">
                    {isKk ? "Сценарий генерациялануда..." : "Генерируем сценарий..."}
                    <br />
                    <span className="text-xs text-muted-foreground/70">
                      {isKk ? "10–20 секунд" : "Это займёт 10–20 секунд"}
                    </span>
                  </p>
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : scriptContent ? (
                <article className="bg-card rounded-2xl border border-border/60 shadow-soft p-5 md:p-7">
                  <div className="prose prose-sm max-w-none text-foreground
                    [&_h1]:text-foreground [&_h1]:text-lg [&_h1]:font-extrabold [&_h1]:mt-6 [&_h1]:mb-3
                    [&_h2]:text-foreground [&_h2]:text-[15px] [&_h2]:font-extrabold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:tracking-wide [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2
                    [&_h3]:text-foreground [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2
                    [&_strong]:text-foreground [&_strong]:font-bold
                    [&_p]:text-foreground/85 [&_p]:mb-3 [&_p]:leading-[1.75] [&_p]:text-[14px]
                    [&_li]:text-foreground/85 [&_li]:mb-1.5 [&_li]:leading-[1.7]
                    [&_ol]:space-y-1.5 [&_ul]:space-y-1.5
                    [&_hr]:my-6 [&_hr]:border-border/40
                    [&_blockquote]:border-l-[3px] [&_blockquote]:border-viral [&_blockquote]:bg-viral/8 [&_blockquote]:px-4 [&_blockquote]:py-2.5 [&_blockquote]:rounded-r-xl [&_blockquote]:my-3
                    [&_blockquote_p]:text-foreground [&_blockquote_p]:font-semibold [&_blockquote_p]:text-[13.5px] [&_blockquote_p]:mb-0
                    [&_em]:text-muted-foreground [&_em]:text-xs [&_em]:not-italic [&_em]:opacity-80
                    [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[12.5px]">
                    <ReactMarkdown>{scriptContent}</ReactMarkdown>
                  </div>
                  {isGenerating && (
                    <div className="mt-4 flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs">{isKk ? "Жалғасуда..." : "Продолжаю писать..."}</span>
                    </div>
                  )}
                </article>
              ) : null}

              {/* Quick actions — appear after script is ready */}
              {scriptContent && !isGenerating && (
                <div className="mt-5 animate-fade-in">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5 px-1">
                    {isKk ? "Жылдам өзгерістер" : "Быстрые правки"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((a) => (
                      <button
                        key={a.label}
                        onClick={() => sendMessage(a.prompt)}
                        disabled={isGenerating}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-card border border-border/70 text-[13px] font-semibold text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all active:scale-95 shadow-soft disabled:opacity-50"
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

        {/* Desktop right chat panel */}
        <aside
          className={`hidden lg:flex flex-col border-l border-border/60 bg-card transition-all duration-300 overflow-hidden ${
            chatOpen ? "w-[400px] xl:w-[440px]" : "w-0 border-l-0"
          }`}
        >
          {chatOpen && (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-foreground" />
                  <span className="text-sm font-bold text-foreground">{isKk ? "AI көмекші" : "AI помощник"}</span>
                </div>
                <button onClick={() => setChatOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-foreground text-background rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl px-3.5 py-2.5 bg-muted text-foreground rounded-bl-md flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {isKk ? "Жазып жатыр..." : "Пишу..."}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick chips */}
              <div className="px-3 pt-2 pb-1 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-hide">
                {quickActions.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => sendMessage(a.prompt)}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11.5px] font-semibold border border-border/70 text-foreground hover:bg-foreground hover:text-background transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
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
                    placeholder={isKk ? "ИИ-ден сценарийді өзгертуді сұраңыз..." : "Попросите ИИ изменить сценарий..."}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-viral/40 focus:border-viral/50"
                    disabled={isGenerating}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!chatInput.trim() || isGenerating}
                    className="w-11 h-11 rounded-xl bg-viral text-viral-foreground flex items-center justify-center hover:brightness-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-soft"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* ───── Mobile floating chat trigger ───── */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="lg:hidden fixed left-1/2 -translate-x-1/2 z-[99997] flex items-center gap-2 pl-3.5 pr-5 h-12 rounded-full bg-viral text-viral-foreground shadow-glow-viral active:scale-95 transition-transform animate-fade-in ring-1 ring-foreground/10"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 18px)" }}
          aria-label="AI чат"
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          <span className="text-sm font-bold whitespace-nowrap">
            {isKk ? "AI редактор" : "AI редактор"}
          </span>
        </button>
      )}

      {/* ───── Mobile chat sheet ───── */}
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
            className="bg-card rounded-t-3xl border-t border-border/60 shadow-2xl flex flex-col"
            style={{
              maxHeight: keyboardHeight > 0
                ? `${(window.visualViewport?.height || window.innerHeight) * 0.78}px`
                : "82vh",
              minHeight: keyboardHeight > 0 ? "240px" : "55vh",
              animation: "slide-up 0.3s ease-out",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1.5 shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex items-center justify-between px-4 pb-2 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-viral/15 ring-1 ring-viral/30 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-foreground" />
                </div>
                <span className="text-sm font-bold text-foreground">
                  {isKk ? "AI редактор" : "AI редактор"}
                </span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Закрыть"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Quick chips */}
            {keyboardHeight === 0 && (
              <div className="px-3 py-2.5 flex gap-1.5 overflow-x-auto shrink-0 border-b border-border/30 scrollbar-hide">
                {quickActions.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => sendMessage(a.prompt)}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold border border-border/70 text-foreground hover:bg-foreground hover:text-background transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                  >
                    <span className="text-sm leading-none">{a.emoji}</span>
                    {a.label}
                  </button>
                ))}
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold border border-viral/40 text-foreground bg-viral/10 hover:bg-viral hover:text-viral-foreground transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isGenerating ? "animate-spin" : ""}`} />
                  {isKk ? "Қайта" : "Заново"}
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-foreground text-background rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-3.5 py-2.5 bg-muted text-foreground rounded-bl-md flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {isKk ? "Жазып жатыр..." : "Пишу..."}
                    </span>
                  </div>
                </div>
              )}
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
                  placeholder={isKk ? "ИИ-ден сценарийді өзгертуді сұраңыз..." : "Попросите ИИ изменить сценарий..."}
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
