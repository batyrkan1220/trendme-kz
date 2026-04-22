import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * Free trial credits — every new user gets 3 free analyses + 3 free scripts.
 * Tracked on profiles table. Atomically decremented via consume_free_credit RPC.
 *
 * - Pro users (paid sub) → free credits are ignored, full access via subscription.
 * - Free users → can use up to 3 analyses + 3 scripts before paywall.
 */
export function useFreeCredits() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["free-credits", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("free_analyses_left, free_scripts_left")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 5_000,
  });

  const analysesLeft = data?.free_analyses_left ?? 0;
  const scriptsLeft = data?.free_scripts_left ?? 0;

  const consume = async (kind: "analysis" | "script"): Promise<number> => {
    const { data, error } = await supabase.rpc("consume_free_credit", { _kind: kind });
    if (error) {
      toast.error("Не удалось списать пробный кредит");
      return -1;
    }
    qc.invalidateQueries({ queryKey: ["free-credits"] });
    return (data as number) ?? -1;
  };

  return { analysesLeft, scriptsLeft, isLoading, consume };
}
