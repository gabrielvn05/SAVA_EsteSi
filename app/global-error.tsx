"use client";

export default function GlobalError({
  reset
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <html lang="es">
      <body>
        <div style={{ fontFamily: "Segoe UI, system-ui, sans-serif", padding: "2rem", maxWidth: 520, margin: "0 auto" }}>
          <h2>Error crítico</h2>
          <p>El sistema encontró un fallo inesperado.</p>
          <button type="button" onClick={reset} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
