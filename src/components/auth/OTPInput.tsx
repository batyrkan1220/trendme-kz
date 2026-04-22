import { useEffect, useRef, useState, KeyboardEvent, ClipboardEvent, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  /** Длина кода (по умолчанию 6 — стандарт Supabase). */
  length?: number;
  value: string;
  onChange: (val: string) => void;
  /** Вызывается, когда пользователь ввёл все цифры. */
  onComplete?: (val: string) => void;
  disabled?: boolean;
  /** Триггер shake-анимации при неверном коде (увеличивайте число для re-trigger). */
  errorPulse?: number;
  autoFocus?: boolean;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  errorPulse = 0,
  autoFocus = true,
}: OTPInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [shake, setShake] = useState(0);

  // Re-trigger shake animation when errorPulse increases.
  useEffect(() => {
    if (errorPulse > 0) {
      setShake((s) => s + 1);
      // Clear value to let the user retry quickly.
      onChange("");
      requestAnimationFrame(() => inputs.current[0]?.focus());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorPulse]);

  useEffect(() => {
    if (autoFocus) inputs.current[0]?.focus();
  }, [autoFocus]);

  const digits = value.padEnd(length, " ").slice(0, length).split("");

  const setDigit = (index: number, digit: string) => {
    const arr = digits.map((d) => (d === " " ? "" : d));
    arr[index] = digit;
    const next = arr.join("").slice(0, length);
    onChange(next);
    if (next.length === length && !next.includes("")) onComplete?.(next);
  };

  const handleChange = (i: number, e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setDigit(i, "");
      return;
    }
    // Если пользователь ввёл несколько цифр (autocomplete) — распределим.
    if (raw.length > 1) {
      const arr = digits.map((d) => (d === " " ? "" : d));
      for (let k = 0; k < raw.length && i + k < length; k++) arr[i + k] = raw[k];
      const next = arr.join("").slice(0, length);
      onChange(next);
      const focusIdx = Math.min(i + raw.length, length - 1);
      inputs.current[focusIdx]?.focus();
      if (next.length === length && !next.includes("")) onComplete?.(next);
      return;
    }
    setDigit(i, raw);
    if (i < length - 1) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[i] && digits[i] !== " ") {
        setDigit(i, "");
      } else if (i > 0) {
        inputs.current[i - 1]?.focus();
        setDigit(i - 1, "");
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputs.current[i - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      inputs.current[i + 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, length - 1);
    inputs.current[focusIdx]?.focus();
    if (pasted.length === length) onComplete?.(pasted);
  };

  const half = Math.floor(length / 2);

  return (
    <div
      key={shake}
      className={cn(
        "flex items-center justify-center gap-2 sm:gap-3",
        shake > 0 && "animate-otp-shake",
      )}
    >
      {Array.from({ length }).map((_, i) => (
        <>
          {i === half && length % 2 === 0 && (
            <span
              key={`sep-${i}`}
              aria-hidden="true"
              className="select-none text-2xl sm:text-3xl font-bold text-muted-foreground/60 px-1"
            >
              —
            </span>
          )}
          <input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={length}
            value={digits[i] === " " ? "" : digits[i]}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              "w-11 h-14 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold",
              "rounded-xl border-2 bg-background text-foreground",
              "border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
              "outline-none transition-all duration-150",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              digits[i] && digits[i] !== " " && "border-primary/60 bg-primary-soft",
            )}
          />
        </>
      ))}
    </div>
  );
}
