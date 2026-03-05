import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type ActionKey = "search" | "video_analysis" | "account_analysis" | "ai_script";

interface UsageLimits {
  search?: number;
  video_analysis?: number;
  account_analysis?: number;
  ai_script?: number;
}

export function useSubscription() {
  const { user } = useAuth();

  // Get active subscription with plan details
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["user-subscription-limits", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("*, plans(*)")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  // Count usage within current subscription period
  const { data: usageCounts = {}, isLoading: usageLoading } = useQuery({
    queryKey: ["user-usage-counts", user?.id, subscription?.started_at],
    queryFn: async () => {
      const startDate = subscription?.started_at || new Date().toISOString();
      const { data } = await supabase
        .from("activity_log")
        .select("type")
        .eq("user_id", user!.id)
        .gte("created_at", startDate);

      const counts: Record<string, number> = {};
      for (const row of data || []) {
        counts[row.type] = (counts[row.type] || 0) + 1;
      }
      return counts;
    },
    enabled: !!user && !!subscription,
    staleTime: 10_000,
  });

  const plan = subscription?.plans as any;
  const limits: UsageLimits | null = plan?.usage_limits || null;
  const isFreeTrial = plan?.price_rub === 0;
  const hasActiveSubscription = !!subscription && new Date(subscription.expires_at) > new Date();

  const getRemaining = (action: ActionKey): number | null => {
    if (!limits || limits[action] === undefined) return null; // unlimited
    const limit = limits[action]!;
    const used = usageCounts[action] || 0;
    return Math.max(0, limit - used);
  };

  const canUse = (action: ActionKey): boolean => {
    if (!hasActiveSubscription) return false;
    const remaining = getRemaining(action);
    if (remaining === null) return true; // unlimited
    return remaining > 0;
  };

  const checkAndLog = async (action: ActionKey, description?: string): Promise<boolean> => {
    if (!user) return false;

    if (!hasActiveSubscription) {
      toast.error("Подписка неактивна. Выберите тариф.");
      return false;
    }

    if (!canUse(action)) {
      const limit = limits?.[action] || 0;
      toast.error(`Лимит исчерпан (${limit}/${limit}). Обновите тариф.`);
      return false;
    }

    // Log usage
    await supabase.from("activity_log").insert({
      user_id: user.id,
      type: action,
      payload_json: { description: description || action },
    });

    return true;
  };

  return {
    plan,
    isFreeTrial,
    hasActiveSubscription,
    limits,
    usageCounts,
    getRemaining,
    canUse,
    checkAndLog,
    isLoading: subLoading || usageLoading,
  };
}
