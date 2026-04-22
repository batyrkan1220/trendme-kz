import { supabase } from "@/integrations/supabase/client";
import { mapAuthError } from "./authErrors";

export type AuthMeta = { name?: string; phone?: string };

const norm = (email: string) => email.trim().toLowerCase();

export const authService = {
  /**
   * Регистрирует пользователя. Supabase автоматически отправит 6-значный OTP
   * на email (через наш auth-email-hook).
   */
  async signUp(email: string, password: string, meta?: AuthMeta) {
    const { data, error } = await supabase.auth.signUp({
      email: norm(email),
      password,
      options: {
        // emailRedirectTo нужен только если пользователь всё-таки нажмёт ссылку.
        emailRedirectTo: `${window.location.origin}/`,
        data: meta ? { name: meta.name, phone: meta.phone } : undefined,
      },
    });
    if (error) return { data: null, error: new Error(mapAuthError(error)) };
    return { data, error: null as Error | null };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: norm(email),
      password,
    });
    if (error) {
      const friendly = mapAuthError(error);
      const e = new Error(friendly) as Error & { code?: string };
      // Маркируем «email не подтверждён» — UI должен предложить ввести OTP.
      if (/email not confirmed/i.test(error.message)) e.code = "email_not_confirmed";
      return { data: null, error: e };
    }
    return { data, error: null as Error | null };
  },

  /**
   * Подтверждение OTP кода для регистрации (signup) или восстановления (recovery).
   */
  async verifyOtp(email: string, token: string, type: "email" | "recovery" | "signup" = "email") {
    const { data, error } = await supabase.auth.verifyOtp({
      email: norm(email),
      token: token.trim(),
      type,
    });
    if (error) return { data: null, error: new Error(mapAuthError(error)) };
    return { data, error: null as Error | null };
  },

  /**
   * Повторная отправка OTP. Используется на экране OTP и при попытке логина
   * с неподтверждённым email.
   */
  async resendOtp(email: string, type: "signup" | "email_change" = "signup") {
    const { data, error } = await supabase.auth.resend({
      type,
      email: norm(email),
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) return { data: null, error: new Error(mapAuthError(error)) };
    return { data, error: null as Error | null };
  },

  async resetPasswordForEmail(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(norm(email), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { data: null, error: new Error(mapAuthError(error)) };
    return { data, error: null as Error | null };
  },

  async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) return { data: null, error: new Error(mapAuthError(error)) };
    return { data, error: null as Error | null };
  },
};
