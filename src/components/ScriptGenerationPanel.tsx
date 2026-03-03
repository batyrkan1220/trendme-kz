import { useState, useRef, useEffect } from "react";
import { Copy, RefreshCw, Send, Sparkles, Loader2, ArrowLeft, Zap, Target, Eye, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

interface ScriptPanelProps {
  transcript: string;
  summary: any;
  caption: string;
  language?: "ru" | "kk";
  onBack: () => void;
}

type Msg = { role: "user" | "assistant"; content: string };

const SCRIPT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-script`;

async function streamScript({
  transcript,
  summary,
  caption,
  language,
  messages,
  onDelta,
  onDone,
  onError,
}: {
  transcript: string;
  summary: any;
  caption: string;
  language?: string;
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    onError("Необходимо авторизоваться");
    return;
  }

  const resp = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ transcript, summary, caption, language, messages }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Ошибка сервера" }));
    onError(err.error || "Ошибка генерации");
    return;
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
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  onDone();
}

export function ScriptGenerationPanel({ transcript, summary, caption, language = "ru", onBack }: ScriptPanelProps) {
  const { user } = useAuth();
  const isKk = language === "kk";
  const [activeTab, setActiveTab] = useState<"new" | "original">("new");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [scriptContent, setScriptContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef("");

  // Auto-generate on mount
  useEffect(() => {
    generateScript([]);
  }, []);

  const generateScript = async (chatMsgs: Msg[]) => {
    setIsGenerating(true);
    setScriptContent("");
    scriptRef.current = "";

    // Add initial assistant greeting if first gen
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
      transcript,
      summary,
      caption,
      language,
      messages: chatMsgs,
      onDelta: (text) => {
        accumulated += text;
        scriptRef.current = accumulated;
        setScriptContent(accumulated);
      },
      onDone: () => {
        setIsGenerating(false);
      },
      onError: (err) => {
        toast.error(err);
        setIsGenerating(false);
      },
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

    // Build messages for API (exclude the greeting)
    const apiMessages: Msg[] = newMessages
      .filter((m, i) => !(i === 0 && m.role === "assistant"))
      .map(m => ({ role: m.role, content: m.content }));

    await streamScript({
      transcript,
      summary,
      caption,
      language,
      messages: apiMessages,
      onDelta: (text) => {
        accumulated += text;
        scriptRef.current = accumulated;
        setScriptContent(accumulated);
      },
      onDone: () => {
        setIsGenerating(false);
        setMessages(prev => [...prev, { role: "assistant", content: isKk ? "Сценарий жаңартылды! ✨ Тағы бірдеңе өзгерту керек пе?" : "Сценарий обновлен! ✨ Что-то ещё поменять?" }]);
      },
      onError: (err) => {
        toast.error(err);
        setIsGenerating(false);
      },
    });
  };

  const handleRegenerate = () => {
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

  const saveScript = async () => {
    if (!user || !scriptContent || isSaving) return;
    setIsSaving(true);
    const title = caption?.slice(0, 80) || (isKk ? "Сценарий" : "Сценарий");
    const { error } = await supabase.from("saved_scripts" as any).insert({
      user_id: user.id,
      title,
      content: scriptRef.current || scriptContent,
      source_video_url: null,
    });
    if (error) {
      toast.error(isKk ? "Сақтау қатесі" : "Ошибка сохранения");
    } else {
      toast.success(isKk ? "Сценарий Кітапханаға сақталды! 📚" : "Сценарий сохранён в Библиотеку! 📚");
    }
    setIsSaving(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold text-foreground">{isKk ? "AI Сценарист" : "AI Сценарист"}</h2>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Chat panel */}
        <div className="w-full md:w-[320px] flex-shrink-0 border-b md:border-b-0 md:border-r border-border/50 flex flex-col bg-card max-h-[40vh] md:max-h-none">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Regenerate + input */}
          <div className="p-2 md:p-3 border-t border-border/50 space-y-2">
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-2 w-full rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-border/50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              {isKk ? "Қайта генерациялау" : "Перегенерировать"}
            </button>
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={isKk ? "Сұрауыңызды жазыңыз" : "Напишите свой запрос"}
                className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={isGenerating}
              />
              <button
                onClick={handleSend}
                disabled={!chatInput.trim() || isGenerating}
                className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right — Script tabs */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {/* Tabs */}
          <div className="flex border-b border-border/50">
            <button
              onClick={() => setActiveTab("new")}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "new"
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              {isKk ? "Жаңа сценарий" : "Новый сценарий"}
            </button>
            <button
              onClick={() => setActiveTab("original")}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "original"
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              📄 {isKk ? "Бастапқы сценарий" : "Исходный сценарий"}
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "new" ? (
              <div className="p-3 md:p-6">
                {/* Copy button */}
                <div className="flex flex-wrap justify-end gap-2 mb-3 md:mb-4">
                  <button
                    onClick={saveScript}
                    disabled={!scriptContent || isGenerating || isSaving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <BookOpen className="h-4 w-4" />
                    {isSaving ? (isKk ? "Сақтаудамын..." : "Сохраняю...") : (isKk ? "Кітапханаға" : "В библиотеку")}
                  </button>
                  <button
                    onClick={copyScript}
                    disabled={!scriptContent}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-border/50 disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                    {isKk ? "Көшіру" : "Скопировать"}
                  </button>
                </div>

                {/* Script content */}
                {isGenerating && !scriptContent ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-7 w-7 text-primary animate-pulse" />
                    </div>
                    <p className="text-muted-foreground font-medium">Генерируем сценарий...</p>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : scriptContent ? (
                  <div className="bg-card rounded-xl border border-border/50 p-6">
                    <div className="prose prose-sm max-w-none text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground [&_p]:text-foreground/80 [&_li]:text-foreground/80 [&_ol]:text-foreground/80">
                      <ReactMarkdown>{scriptContent}</ReactMarkdown>
                    </div>
                    {isGenerating && (
                      <div className="mt-4 flex items-center gap-2 text-primary">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Генерация...</span>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Content analysis cards */}
                {summary && !isGenerating && scriptContent && (
                  <div className="mt-6">
                    <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                      🧠 Анализ контента
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
                      <div className="bg-card rounded-xl border border-border/50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold text-foreground">Visual Hook/text:</span>
                        </div>
                        <p className="text-xs text-foreground/70 leading-relaxed">
                          {summary.visual_hook || summary.text_hook || "Нет визуального хука"}
                        </p>
                      </div>
                      <div className="bg-card rounded-xl border border-border/50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold text-foreground">Суть видео:</span>
                        </div>
                        <p className="text-xs text-foreground/70 leading-relaxed">
                          {summary.summary || "Нет данных"}
                        </p>
                      </div>
                      <div className="bg-card rounded-xl border border-border/50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold text-foreground">Рабочие приемы:</span>
                        </div>
                        <p className="text-xs text-foreground/70 leading-relaxed">
                          {summary.hook_phrase || "Нет рабочих техник"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Original script/transcript tab */
              <div className="p-3 md:p-6">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => { navigator.clipboard.writeText(transcript || ""); toast.success("Скопировано!"); }}
                    disabled={!transcript}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-border/50 disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                    Скопировать
                  </button>
                </div>
                <div className="bg-card rounded-xl border border-border/50 p-6">
                  {transcript ? (
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{transcript}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">[Речь отсутствует, только звуки и фоновый шум]</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
