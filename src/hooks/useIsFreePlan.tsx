import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isNativePlatform } from "@/lib/native";

/**
 * Universal "is this user on the free / demo plan?" hook.
 * Used to gate Pro-only actions (analysis, script, profile analysis).
 *
 * Native iOS/Android: always returns false (App Store Guideline 4.2 — full access).
 * Web: true when user has no active paid subscription.
 *
 * Note: Free users still get 3 free analyses + 3 free scripts via useFreeCredits.
 * Paywall should only be shown when free credits are exhausted.
 */
export function useIsFreePlan() {
  const { user } = useAuth();

  const { data: userSub, isLoading } = useQuery({
    queryKey: ["user-subscription-plan", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("plans(price_rub)")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const isFreePlan = isNativePlatform
    ? false
    : !user || !userSub || (userSub.plans as any)?.price_rub === 0;

  return { isFreePlan, isLoading };
}
