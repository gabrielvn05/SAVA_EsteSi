"use client";

import type { ChangeEvent } from "react";
import { CARRERAS_OPCIONES } from "@/lib/carreras";

type Props = Readonly<{
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  includeAllOption?: boolean;
  allOptionLabel?: string;
}>;

export function CarreraSelect({
  id,
  name,
  value,
  defaultValue,
  onChange,
  required,
  includeAllOption,
  allOptionLabel = "Todas las carreras"
}: Props) {
  const controlled = value !== undefined;
  return (
    <select
      id={id}
      name={name}
      {...(controlled ? { value } : { defaultValue: defaultValue ?? "" })}
      onChange={onChange}
      required={required}
    >
      {includeAllOption ? <option value="">{allOptionLabel}</option> : <option value="">Seleccionar carrera</option>}
      {CARRERAS_OPCIONES.map((c) => (
        <option key={c.value} value={c.value}>
          {c.label}
        </option>
      ))}
    </select>
  );
}
