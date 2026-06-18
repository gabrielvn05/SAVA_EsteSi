"use client";

import Link from "next/link";
import { useState } from "react";
import { solicitarCuenta } from "@/app/actions";
import { CARRERAS_OPCIONES } from "@/lib/carreras";
import { ROLES_SOLICITUD_CUENTA } from "@/lib/rol-labels";
import { isEmailConArroba, soloCelular, soloDigitos } from "@/lib/form-validators";

type Props = Readonly<{ mensajeError: string | null }>;

export function SolicitarCuentaForm({ mensajeError }: Props) {
  const [cedula, setCedula] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  function validarAntesEnviar(fd: FormData): boolean {
    const mail = String(fd.get("email") ?? "").trim();
    const ced = soloDigitos(String(fd.get("cedula") ?? ""));
    const cel = soloCelular(String(fd.get("celular") ?? ""));

    if (!mail || !isEmailConArroba(mail)) {
      setErrorLocal("El correo debe ser válido e incluir el símbolo @.");
      return false;
    }
    if (ced.length < 10 || ced.length > 13) {
      setErrorLocal("La cédula debe tener entre 10 y 13 dígitos (solo números).");
      return false;
    }
    if (cel.length < 9) {
      setErrorLocal("El celular debe tener al menos 9 dígitos (solo números).");
      return false;
    }
    setErrorLocal(null);
    return true;
  }

  return (
    <>
      {mensajeError ? (
        <div className="alert alert--error" role="alert">
          {mensajeError}
        </div>
      ) : null}
      {errorLocal ? (
        <div className="alert alert--error" role="alert">
          {errorLocal}
        </div>
      ) : null}

      <form
        action={solicitarCuenta}
        className="stack"
        onSubmit={(e) => {
          const fd = new FormData(e.currentTarget);
          if (!validarAntesEnviar(fd)) e.preventDefault();
        }}
      >
        <div className="form-grid form-grid--2">
          <div>
            <label htmlFor="nombres">Nombres completos *</label>
            <input id="nombres" name="nombres" required autoComplete="given-name" />
          </div>
          <div>
            <label htmlFor="apellidos">Apellidos completos *</label>
            <input id="apellidos" name="apellidos" required autoComplete="family-name" />
          </div>
        </div>
        <div className="form-grid form-grid--2">
          <div>
            <label htmlFor="cedula">Cédula de identidad *</label>
            <input
              id="cedula"
              name="cedula"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ej: 1234567890"
              required
              autoComplete="off"
              value={cedula}
              onChange={(e) => setCedula(soloDigitos(e.target.value))}
            />
            <p className="field-hint">Solo números (10 a 13 dígitos).</p>
          </div>
          <div>
            <label htmlFor="celular">Número celular *</label>
            <input
              id="celular"
              name="celular"
              type="tel"
              inputMode="numeric"
              placeholder="Ej: 0991234567"
              required
              autoComplete="tel"
              value={celular}
              onChange={(e) => setCelular(soloCelular(e.target.value))}
            />
            <p className="field-hint">Solo números.</p>
          </div>
        </div>
        <div className="form-grid form-grid--2">
          <div>
            <label htmlFor="email">Correo institucional *</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="correo@live.uleam.edu.ec"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="field-hint">Debe incluir @ (ej. usuario@uleam.edu.ec).</p>
          </div>
          <div>
            <label htmlFor="carrera">Carrera *</label>
            <select id="carrera" name="carrera" defaultValue="" required>
              <option value="" disabled>
                Seleccionar carrera
              </option>
              {CARRERAS_OPCIONES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="rol_solicitado">Rol solicitado *</label>
          <select id="rol_solicitado" name="rol_solicitado" defaultValue="docente" required>
            {ROLES_SOLICITUD_CUENTA.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn--primary" type="submit">
            Enviar solicitud
          </button>
          <Link href="/login" className="btn btn--secondary">
            Volver al login
          </Link>
        </div>
      </form>
    </>
  );
}
