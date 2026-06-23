"use client";

import { useCallback, useId, type ChangeEvent } from "react";

export const HORA_MINIMA_JORNADA = "00:00";
export const HORA_MAXIMA_JORNADA = "23:59";

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

type TimeInputProps = Readonly<{
  id?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  name?: string;
}>;

function parseTime(value: string | undefined) {
  const [h = "", m = ""] = (value ?? "").split(":");
  return { h: HORAS.includes(h) ? h : "", m: MINUTOS.includes(m) ? m : "" };
}

export function TimeInput({ id, value, onChange, required, disabled, className, name }: TimeInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const { h, m } = parseTime(value);

  const emit = useCallback(
    (nextH: string, nextM: string) => {
      if (!onChange) return;
      const nextValue = nextH && nextM ? `${nextH}:${nextM}` : nextH ? `${nextH}:` : nextM ? `:${nextM}` : "";
      onChange({ target: { value: nextValue, name: name ?? "" } } as ChangeEvent<HTMLSelectElement>);
    },
    [name, onChange]
  );

  return (
    <div className={`time-input-custom ${className ?? ""}`.trim()} id={inputId}>
      <select
        aria-label="Hora"
        className="time-input-custom__part"
        value={h}
        required={required}
        disabled={disabled}
        onChange={(e) => emit(e.target.value, m)}
      >
        <option value="">--</option>
        {HORAS.map((hora) => (
          <option key={hora} value={hora}>
            {hora}
          </option>
        ))}
      </select>
      <span className="time-input-custom__sep" aria-hidden>
        :
      </span>
      <select
        aria-label="Minutos"
        className="time-input-custom__part"
        value={m}
        required={required}
        disabled={disabled}
        onChange={(e) => emit(h, e.target.value)}
      >
        <option value="">--</option>
        {MINUTOS.map((minuto) => (
          <option key={minuto} value={minuto}>
            {minuto}
          </option>
        ))}
      </select>
    </div>
  );
}
