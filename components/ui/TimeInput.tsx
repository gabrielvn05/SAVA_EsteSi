"use client";

import { useCallback, useId, useRef, type ComponentProps } from "react";

export const HORA_MINIMA_JORNADA = "07:00";
export const HORA_MAXIMA_JORNADA = "22:00";

type TimeInputProps = Omit<ComponentProps<"input">, "type" | "min" | "max"> & {
  id?: string;
  min?: string;
  max?: string;
};

export function TimeInput({
  id,
  className,
  onClick,
  min = HORA_MINIMA_JORNADA,
  max = HORA_MAXIMA_JORNADA,
  ...props
}: TimeInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const ref = useRef<HTMLInputElement>(null);

  const openPicker = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
      } catch {
        // Algunos navegadores bloquean showPicker fuera de gesto directo del usuario.
      }
    }
  }, []);

  return (
    <div className="date-input-wrap time-input-wrap">
      <input
        {...props}
        ref={ref}
        id={inputId}
        type="time"
        min={min}
        max={max}
        step={60}
        className={["date-input-wrap__input", className].filter(Boolean).join(" ")}
        onClick={(e) => {
          onClick?.(e);
          openPicker();
        }}
      />
    </div>
  );
}
