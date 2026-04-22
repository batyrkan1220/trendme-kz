import { useCallback, useEffect, useState } from "react";

/**
 * Управляет таймером «Отправить код повторно» на OTP экранах.
 * Возвращает количество секунд до возможности повторной отправки и функцию start().
 */
export function useResendCountdown(initialSeconds = 60) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const start = useCallback((sec = initialSeconds) => setSecondsLeft(sec), [initialSeconds]);
  const reset = useCallback(() => setSecondsLeft(0), []);

  return { secondsLeft, canResend: secondsLeft <= 0, start, reset };
}
