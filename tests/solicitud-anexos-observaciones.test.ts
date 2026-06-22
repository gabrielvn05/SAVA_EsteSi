import { describe, expect, it } from "vitest";
import { anexosDesdeDetalle } from "@/lib/solicitud-anexos";
import { observacionRechazoVisible } from "@/lib/solicitud-observaciones";

describe("anexosDesdeDetalle", () => {
  it("lee lista de anexos", () => {
    const res = anexosDesdeDetalle(
      {
        anexos: [
          { path: "u/1.pdf", nombre: "cert.pdf" },
          { path: "u/2.png", nombre: "foto.png" }
        ]
      },
      "https://example.supabase.co"
    );
    expect(res).toHaveLength(2);
    expect(res[1]?.nombre).toBe("foto.png");
  });

  it("soporta formato legado anexo_path", () => {
    const res = anexosDesdeDetalle({ anexo_path: "u/1.pdf", anexo_nombre: "cert.pdf" }, "https://x.co");
    expect(res).toHaveLength(1);
  });
});

describe("observacionRechazoVisible", () => {
  it("muestra solo secretaría si rechazó ella", () => {
    const res = observacionRechazoVisible({
      estado: "rechazada",
      observaciones_secretaria: "Falta documentación",
      observaciones_decano: null,
      firmado_por: null
    });
    expect(res?.label).toBe("Rechazada por Secretaría");
  });

  it("muestra decano si firmó el rechazo", () => {
    const res = observacionRechazoVisible({
      estado: "rechazada",
      observaciones_secretaria: "Aprobado en revisión",
      observaciones_decano: "No corresponde",
      firmado_por: "decano-id"
    });
    expect(res?.label).toBe("Rechazada por Decano");
    expect(res?.texto).toBe("No corresponde");
  });
});
