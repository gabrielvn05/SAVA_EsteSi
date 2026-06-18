"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    console.error("[SAVA error]", error);
  }, [error]);

  return (
    <div className="card stack" style={{ maxWidth: 520, margin: "3rem auto", padding: "1.5rem" }}>
      <h2 style={{ margin: 0 }}>Ocurrió un error</h2>
      <p className="field-hint">No se pudo completar la operación. Puede intentar de nuevo.</p>
      <button type="button" className="btn btn--primary" onClick={reset}>
        Reintentar
      </button>
    </div>
  );
}
