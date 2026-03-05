import { AppLayout } from "@/components/layout/AppLayout";
import { Search, TrendingUp, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setName(data?.name ?? null));
  }, [user]);

  const displayName = name || user?.email?.split("@")[0] || "";
  const greeting = displayName ? `Привет, ${displayName}` : "Привет";

  const actions = [
    {
      icon: Search,
      title: "Поиск по слову",
      description: "Найдите вирусные видео по ключевым словам",
      path: "/search",
      iconColor: "text-blue-500",
    },
    {
      icon: TrendingUp,
      title: "Тренды",
      description: "Проверьте найденные видео в радаре",
      path: "/trends",
      iconColor: "text-orange-500",
    },
  ];

  return (
    <AppLayout>
      <div className="p-4 md:p-8 lg:p-12 max-w-3xl mx-auto w-full animate-fade-in">
        {/* Greeting */}
        <div className="text-center mb-8 md:mb-12">
          <p className="text-muted-foreground text-sm md:text-base mb-1">👋 {greeting}</p>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            Найдем вирусные видео?)
          </h1>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {actions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="group flex flex-col items-center text-center gap-3 p-5 md:p-8 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-muted/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                <action.icon className={`h-5 w-5 md:h-6 md:w-6 ${action.iconColor}`} />
              </div>
              <div>
                <p className="font-semibold text-sm md:text-base text-foreground">{action.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Demo banner */}
        <div className="mt-8 md:mt-12 flex items-center justify-between gap-4 rounded-2xl bg-muted/50 p-5 md:p-6">
          <div>
            <p className="font-bold text-foreground text-sm md:text-base">Вы находитесь в демо-режиме</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Чтобы открыть все функции активируйте тариф</p>
          </div>
          <Link
            to="/pricing"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[hsl(350,70%,65%)] hover:bg-[hsl(350,70%,58%)] text-white font-semibold text-sm px-5 py-3 transition-colors"
          >
            <Lock className="h-4 w-4" />
            Выбрать тариф
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
