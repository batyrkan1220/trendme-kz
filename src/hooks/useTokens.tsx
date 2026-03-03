import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useTokens() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tokenData, isLoading } = useQuery({
    queryKey: ["user-tokens", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_tokens")
        .select("balance, total_earned, total_spent")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 10_000,
  });

  const { data: pricing = [] } = useQuery({
    queryKey: ["token-pricing"],
    queryFn: async () => {
      const { data } = await supabase.from("token_pricing").select("*");
      return data || [];
    },
    staleTime: 60_000,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["token-transactions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("token_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
    staleTime: 10_000,
  });

  const balance = tokenData?.balance ?? 0;
  const totalEarned = tokenData?.total_earned ?? 0;
  const totalSpent = tokenData?.total_spent ?? 0;

  const spend = async (actionKey: string, description?: string): Promise<boolean> => {
    if (!user) return false;
    const cost = pricing.find((p: any) => p.action_key === actionKey)?.cost;
    if (cost && balance < cost) {
      toast.error(`Недостаточно токенов. Нужно ${cost}, у вас ${balance}`);
      return false;
    }
    const { data, error } = await supabase.rpc("spend_tokens", {
      _user_id: user.id,
      _action_key: actionKey,
      _description: description || null,
    });
    if (error || !data) {
      toast.error("Недостаточно токенов для этого действия");
      return false;
    }
    queryClient.invalidateQueries({ queryKey: ["user-tokens"] });
    queryClient.invalidateQueries({ queryKey: ["token-transactions"] });
    return true;
  };

  const getCost = (actionKey: string): number => {
    return pricing.find((p: any) => p.action_key === actionKey)?.cost ?? 0;
  };

  return { balance, totalEarned, totalSpent, transactions, pricing, isLoading, spend, getCost };
}
