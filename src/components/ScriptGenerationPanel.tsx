import { useState, useRef, useEffect, useCallback } from "react";
import { isNativePlatform } from "@/lib/native";
import { Copy, RefreshCw, Send, Sparkles, Loader2, ArrowLeft, Zap, Target, Eye, MessageCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTokens } from "@/hooks/useTokens";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

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

export function ScriptGenerationPanel({ transcript, summary, caption, language = "ru", videoUrl, coverUrl, onBack }: ScriptPanelProps) {
  const { user } = useAuth();
  const { spend } = useTokens();
  const isKk = language === "kk";
  const [activeTab, setActiveTab] = useState<"new" | "original">("new");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [scriptContent, setScriptContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef("");
  const savedScriptId = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!isNativePlatform || user) {
        const ok = await spend("script_generation", isKk ? "Сценарий генерациясы" : "Генерация сценария");
        if (!ok) { onBack(); return; }
      }
      generateScript([]);
    })();
  }, []);

  const generateScript = async (chatMsgs: Msg[]) => {
    setIsGenerating(true);
    setScriptContent("");
    scriptRef.current = "";
    if (chatMsgs.length === 0) {
      setMessages([{
        role: "assistant",
        content: isKk
          ? "Сәлем! 👋 Мен сенің AI сценаристің!\n\nСценарийді вирустық сақтай отырып жетілдіруге көмектесемін.\n\nНеден бастайық?"
          : "Привет! 👋 Я твой AI сценарист!\n\nПомогу тебе доработать сценарий сохранив вирусность.\n\nС чего начнем?"
      }]);
    }
    let accumulated = "";
    await streamScript({
      transcript, summary, caption, language, messages: chatMsgs,
      onDelta: (text) => { accumulated += text; scriptRef.current = accumulated; setScriptContent(accumulated); },
      onDone: () => { setIsGenerating(false); autoSaveScript(); },
      onError: (err) => { toast.error(err); setIsGenerating(false); },
    });
  };

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text || isGenerating) return;
    setChatInput("");
    const userMsg: Msg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsGenerating(true);
    setScriptContent("");
    scriptRef.current = "";
    let accumulated = "";
    const apiMessages: Msg[] = newMessages.filter((m, i) => !(i === 0 && m.role === "assistant")).map(m => ({ role: m.role, content: m.content }));
    await streamScript({
      transcript, summary, caption, language, messages: apiMessages,
      onDelta: (text) => { accumulated += text; scriptRef.current = accumulated; setScriptContent(accumulated); },
      onDone: () => {
        setIsGenerating(false);
        autoSaveScript();
        setMessages(prev => [...prev, { role: "assistant", content: isKk ? "Сценарий жаңартылды! ✨ Тағы бірдеңе өзгерту керек пе?" : "Сценарий обновлен! ✨ Что-то ещё поменять?" }]);
      },
      onError: (err) => { toast.error(err); setIsGenerating(false); },
    });
  };

  const handleRegenerate = async () => {
    if (!isNativePlatform || user) {
      const ok = await spend("script_generation", isKk ? "Сценарийді қайта генерациялау" : "Перегенерация сценария");
      if (!ok) return;
    }
    generateScript([]);
    setMessages([{
      role: "assistant",
      content: isKk
        ? "Сәлем! 👋 Мен сенің AI сценаристің!\n\nСценарийді вирустық сақтай отырып жетілдіруге көмектесемін.\n\nНеден бастайық?"
        : "Привет! 👋 Я твой AI сценарист!\n\nПомогу тебе доработать сценарий сохранив вирусность.\n\nС чего начнем?"
    }]);
  };

  const copyScript = () => {
    navigator.clipboard.writeText(scriptRef.current || scriptContent);
    toast.success(isKk ? "Сценарий көшірілді!" : "Сценарий скопирован!");
  };

  const autoSaveScript = async () => {
    if (!user) return;
    const content = scriptRef.current;
    if (!content) return;
    const title = caption?.slice(0, 80) || "Сценарий";
    if (savedScriptId.current) {
      await supabase.from("saved_scripts").update({ content }).eq("id", savedScriptId.current);
    } else {
      const { data, error } = await supabase.from("saved_scripts").insert({
        user_id: user.id, title, content, source_video_url: videoUrl || null,
      }).select("id").single();
      if (data) savedScriptId.current = data.id;
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // iOS keyboard detection via visualViewport API
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

  // Scroll input into view when keyboard opens
  useEffect(() => {
    if (keyboardHeight > 0) {
      setTimeout(() => {
        mobileInputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [keyboardHeight]);

  // Drag-to-dismiss handlers for mobile bottom sheet
  const onDragStart = useCallback((clientY: number) => {
    dragStartY.current = clientY;
    setIsDragging(true);
  }, []);

  const onDragMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    const dy = clientY - dragStartY.current;
    setSheetDragY(Math.max(0, dy)); // only allow dragging down
  }, [isDragging]);

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
    if (sheetDragY > 100) {
      setChatOpen(false);
    }
    setSheetDragY(0);
  }, [sheetDragY]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 pt-[calc(env(safe-area-inset-top,0px)+12px)] border-b border-border/50 bg-card shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors active:scale-95">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">{isKk ? "AI Сценарист" : "AI Сценарист"}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyScript} disabled={!scriptContent} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-border/50 disabled:opacity-50">
            <Copy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isKk ? "Көшіру" : "Скопировать"}</span>
          </button>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${chatOpen ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground border-border/50 hover:text-foreground hover:bg-muted/50"}`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI чат</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main script area — full width */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border/50 shrink-0">
            <button
              onClick={() => setActiveTab("new")}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 ${activeTab === "new" ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}
            >
              <Sparkles className="h-4 w-4" />
              {isKk ? "Жаңа сценарий" : "Новый сценарий"}
            </button>
            <button
              onClick={() => setActiveTab("original")}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 ${activeTab === "original" ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}
            >
              📄 {isKk ? "Бастапқы" : "Исходный"}
            </button>
          </div>

          {/* Script content — scrollable */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
            {activeTab === "new" ? (
              <>
                {isGenerating && !scriptContent ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-7 w-7 text-primary animate-pulse" />
                    </div>
                    <p className="text-muted-foreground font-medium">{isKk ? "Сценарий генерациялануда..." : "Генерируем сценарий..."}</p>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : scriptContent ? (
                  <>
                    <div className="bg-card rounded-xl border border-border/50 p-4 md:p-6">
                      <div className="prose prose-sm max-w-none text-foreground [&_h2]:text-foreground [&_h2]:text-[15px] [&_h2]:font-extrabold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:tracking-wide [&_h3]:text-foreground [&_h3]:text-sm [&_h3]:mt-4 [&_h3]:mb-2 [&_strong]:text-primary [&_p]:text-foreground/85 [&_p]:mb-3 [&_p]:leading-[1.7] [&_li]:text-foreground/80 [&_li]:mb-1.5 [&_ol]:space-y-2 [&_ul]:space-y-2 [&_hr]:my-6 [&_hr]:border-border/20 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/60 [&_blockquote]:bg-primary/5 [&_blockquote]:px-4 [&_blockquote]:py-2.5 [&_blockquote]:rounded-r-xl [&_blockquote]:my-2 [&_blockquote_p]:text-foreground/90 [&_blockquote_p]:font-medium [&_blockquote_p]:text-[13px] [&_em]:text-muted-foreground [&_em]:text-xs [&_em]:not-italic [&_em]:opacity-70">
                        <ReactMarkdown>{scriptContent}</ReactMarkdown>
                      </div>
                      {isGenerating && (
                        <div className="mt-4 flex items-center gap-2 text-primary">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">{isKk ? "Генерация..." : "Генерация..."}</span>
                        </div>
                      )}
                    </div>

                    {/* Content analysis */}
                    {summary && !isGenerating && (
                      <div className="mt-6">
                        <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                          🧠 {isKk ? "Контент талдауы" : "Анализ контента"}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
                          <div className="bg-card rounded-xl border border-border/50 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="h-4 w-4 text-primary" />
                              <span className="text-sm font-bold text-foreground">Visual Hook:</span>
                            </div>
                            <p className="text-xs text-foreground/70 leading-relaxed">{summary.visual_hook || summary.text_hook || "—"}</p>
                          </div>
                          <div className="bg-card rounded-xl border border-border/50 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="h-4 w-4 text-primary" />
                              <span className="text-sm font-bold text-foreground">Суть:</span>
                            </div>
                            <p className="text-xs text-foreground/70 leading-relaxed">{summary.summary || "—"}</p>
                          </div>
                          <div className="bg-card rounded-xl border border-border/50 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Eye className="h-4 w-4 text-primary" />
                              <span className="text-sm font-bold text-foreground">Приёмы:</span>
                            </div>
                            <p className="text-xs text-foreground/70 leading-relaxed">{summary.hook_phrase || "—"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </>
            ) : (
              <div className="bg-card rounded-xl border border-border/50 p-4 md:p-6">
                <div className="flex justify-end mb-3">
                  <button
                    onClick={() => { navigator.clipboard.writeText(transcript || ""); toast.success(isKk ? "Көшірілді!" : "Скопировано!"); }}
                    disabled={!transcript}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-border/50 disabled:opacity-50"
                  >
                    <Copy className="h-3.5 w-3.5" /> {isKk ? "Көшіру" : "Скопировать"}
                  </button>
                </div>
                {transcript ? (
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{transcript}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">{isKk ? "[Сөз жоқ, тек дыбыстар мен фондық шу]" : "[Речь отсутствует, только звуки и фоновый шум]"}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Chat — slide-out panel */}
        {/* Desktop: right side panel */}
        <div
          className={`hidden md:flex flex-col border-l border-border/50 bg-card transition-all duration-300 overflow-hidden ${chatOpen ? "w-[340px]" : "w-0 border-l-0"}`}
        >
          {chatOpen && (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">AI Көмекші</span>
                </div>
                <button onClick={() => setChatOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted text-foreground rounded-bl-md flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground animate-pulse">
                        {isKk ? "Сценарий өңделуде..." : "Обновляю сценарий..."}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="p-3 border-t border-border/50 space-y-2 shrink-0">
                <button onClick={handleRegenerate} disabled={isGenerating} className="flex items-center gap-2 px-3 py-2 w-full rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-border/50 disabled:opacity-50">
                  <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                  {isKk ? "Қайта генерациялау" : "Перегенерировать"}
                </button>
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder={isKk ? "Сұрауыңызды жазыңыз" : "Напишите запрос..."}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-background border border-border/50 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={isGenerating}
                  />
                  <button onClick={handleSend} disabled={!chatInput.trim() || isGenerating} className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mobile: floating AI assistant button with label */}
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="md:hidden fixed bottom-24 left-4 z-[99997] flex items-center gap-2.5 pl-4 pr-5 h-12 rounded-full bg-primary text-primary-foreground shadow-xl active:scale-95 transition-transform animate-fade-in"
            style={{ boxShadow: "0 4px 24px hsl(72 100% 50% / 0.35)" }}
          >
            <Sparkles className="h-5 w-5 shrink-0" />
            <span className="text-sm font-bold whitespace-nowrap">
              {isKk ? "AI редактор" : "AI редактор"}
            </span>
          </button>
        )}

        {/* Mobile: bottom sheet overlay — keyboard-aware */}
        {chatOpen && (
          <div className="md:hidden fixed inset-0 z-[99998] flex flex-col" style={{ height: keyboardHeight > 0 ? `${window.visualViewport?.height || window.innerHeight}px` : '100%', top: keyboardHeight > 0 ? `${window.visualViewport?.offsetTop || 0}px` : 0 }}>
            <div className="flex-1 min-h-0 bg-foreground/30 backdrop-blur-sm" style={{ opacity: isDragging ? Math.max(0, 1 - sheetDragY / 300) : 1 }} onClick={() => setChatOpen(false)} />
            <div
              ref={sheetRef}
              className="bg-card rounded-t-2xl border-t border-border/50 shadow-2xl flex flex-col"
              style={{
                maxHeight: keyboardHeight > 0 ? `${(window.visualViewport?.height || window.innerHeight) * 0.7}px` : "85vh",
                minHeight: keyboardHeight > 0 ? "200px" : "50vh",
                animation: isDragging ? "none" : "slide-up 0.3s ease-out",
                transition: isDragging ? "none" : "transform 0.3s ease-out, max-height 0.2s ease-out",
                transform: `translateY(${sheetDragY}px)`,
              }}
            >
              {/* Drag handle — swipe down to close */}
              <div
                className="flex justify-center pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing touch-none"
                onTouchStart={(e) => onDragStart(e.touches[0].clientY)}
                onTouchMove={(e) => onDragMove(e.touches[0].clientY)}
                onTouchEnd={onDragEnd}
                onMouseDown={(e) => onDragStart(e.clientY)}
                onMouseMove={(e) => isDragging && onDragMove(e.clientY)}
                onMouseUp={onDragEnd}
              >
                <div className={`w-10 h-1.5 rounded-full transition-colors ${isDragging ? "bg-primary/60" : "bg-muted-foreground/30"}`} />
              </div>
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">{isKk ? "AI сценарий редакторы" : "AI редактор сценария"}</span>
                </div>
                <button onClick={() => setChatOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Quick action chips — hide when keyboard is open to save space */}
              {keyboardHeight === 0 && (
                <div className="px-3 py-2 flex gap-2 overflow-x-auto shrink-0 border-b border-border/30">
                  {[
                    isKk ? "Қысқарт" : "Сократи",
                    isKk ? "Хукты күшейт" : "Усиль хук",
                    isKk ? "Тонды өзгерт" : "Смени тон",
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => { setChatInput(chip); }}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap shrink-0"
                    >
                      {chip}
                    </button>
                  ))}
                  <button
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border border-primary/30 text-primary hover:bg-primary/10 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${isGenerating ? "animate-spin" : ""}`} />
                    {isKk ? "Қайта" : "Заново"}
                  </button>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted text-foreground rounded-bl-md flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground animate-pulse">
                        {isKk ? "Сценарий өңделуде..." : "Обновляю сценарий..."}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input — always visible above keyboard */}
              <div className="p-3 border-t border-border/50 shrink-0" style={{ paddingBottom: keyboardHeight > 0 ? "8px" : "max(env(safe-area-inset-bottom, 0px) + 12px, 12px)" }}>
                <div className="flex gap-2">
                  <input
                    ref={mobileInputRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder={isKk ? "Мысалы: хукты күшейт..." : "Например: усиль хук..."}
                    className="flex-1 px-3.5 py-3 rounded-xl bg-background border border-border/50 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={isGenerating}
                  />
                  <button onClick={handleSend} disabled={!chatInput.trim() || isGenerating} className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
