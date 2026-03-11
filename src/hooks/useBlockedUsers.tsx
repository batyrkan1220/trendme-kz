import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useBlockedUsers() {
  const { user } = useAuth();
  const [blockedUsernames, setBlockedUsernames] = useState<Set<string>>(new Set());

  const fetchBlocked = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("blocked_users" as any)
      .select("blocked_username")
      .eq("user_id", user.id);
    if (data) {
      setBlockedUsernames(new Set((data as any[]).map((d: any) => d.blocked_username)));
    }
  }, [user]);

  useEffect(() => { fetchBlocked(); }, [fetchBlocked]);

  const blockUser = useCallback(async (username: string) => {
    if (!user) return;
    await supabase.from("blocked_users" as any).insert({
      user_id: user.id,
      blocked_username: username,
    } as any);
    setBlockedUsernames((prev) => new Set([...prev, username]));
  }, [user]);

  const unblockUser = useCallback(async (username: string) => {
    if (!user) return;
    await (supabase.from("blocked_users" as any) as any)
      .delete()
      .eq("user_id", user.id)
      .eq("blocked_username", username);
    setBlockedUsernames((prev) => {
      const next = new Set(prev);
      next.delete(username);
      return next;
    });
  }, [user]);

  const isBlocked = useCallback((username?: string | null) => {
    if (!username) return false;
    return blockedUsernames.has(username);
  }, [blockedUsernames]);

  return { blockedUsernames, isBlocked, blockUser, unblockUser, refetch: fetchBlocked };
}
