/**
 * Преобразует технические ошибки Supabase Auth в дружественные сообщения на русском.
 * Используется во всех формах авторизации.
 */
export function mapAuthError(raw: unknown): string {
  const msg =
    typeof raw === "string"
      ? raw
      : raw instanceof Error
      ? raw.message
      : (raw as any)?.message || "";

  const m = String(msg).toLowerCase();

  if (!m) return "Что-то пошло не так. Попробуйте ещё раз.";

  if (m.includes("invalid login credentials")) return "Неверный email или пароль";
  if (m.includes("email not confirmed")) return "Email не подтверждён";
  if (m.includes("user already registered") || m.includes("already been registered") || m.includes("user already")) {
    return "Пользователь с таким email уже существует";
  }
  if (m.includes("token has expired") || m.includes("otp_expired") || m.includes("expired")) {
    return "Код устарел, запросите новый";
  }
  if (m.includes("invalid token") || m.includes("token_not_found") || m.includes("otp")) {
    return "Неверный код, попробуйте снова";
  }
  if (m.includes("rate limit") || m.includes("too many requests") || m.includes("security purposes") || m.includes("after")) {
    return "Слишком много попыток, подождите немного";
  }
  if (m.includes("password") && (m.includes("at least") || m.includes("characters") || m.includes("weak"))) {
    return "Пароль должен быть не менее 6 символов";
  }
  if (m.includes("valid email") || m.includes("invalid email")) {
    return "Введите корректный email";
  }
  if (m.includes("network") || m.includes("failed to fetch") || m.includes("load failed")) {
    return "Ошибка соединения, проверьте интернет";
  }

  return "Ошибка. Попробуйте позже.";
}
