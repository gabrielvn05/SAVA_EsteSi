import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import PizZip from "pizzip";
import type { BuildCertificadoInput } from "@/lib/certificado/build-certificado-pdf";
import { buildOficioReplacements } from "@/lib/certificado/oficio-placeholders";
import { applyOficioDocumentXml } from "@/lib/certificado/word-xml-replace";

function loadTemplateXml(fileName: string) {
  const filePath = path.join(process.cwd(), "public", "templates", fileName);
  const zip = new PizZip(fs.readFileSync(filePath, "binary"));
  return zip.file("word/document.xml")?.asText() ?? "";
}

function xmlToPlainText(xml: string) {
  return [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map((m) => m[1])
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

const destinatario = {
  titulo: "Dr.",
  nombres: "Carlos",
  apellidos: "Pérez López",
  facultad: "Facultad Ciencias de la Vida y Tecnologías"
} as const;

describe("applyOficioDocumentXml viaje", () => {
  it("rellena detalles del viaje y no duplica el nombre del decano", () => {
    const templateXml = loadTemplateXml("oficio-viaje.docx");
    const input: BuildCertificadoInput = {
      solicitante: {
        nombres: "Gabriel",
        apellidos: "Vélez",
        email: "test@uleam.edu.ec"
      },
      tipo: "viaje",
      fecha_inicio: "2026-06-18",
      fecha_fin: "2026-06-19",
      motivo: "Permiso por viaje: Congreso IA",
      detalle: {
        tipo_personal: "docente",
        cedula: "1315591303",
        carrera: "SOFTWARE",
        tipo_viaje_evento: "congreso_expositor",
        nombre_evento: "Congreso Internacional de IA",
        lugar_evento: "Quito, Ecuador",
        fecha_evento_desde: "2026-06-18",
        fecha_evento_hasta: "2026-06-19",
        rol_especifico: "Ponente principal"
      }
    };

    const r = buildOficioReplacements(input, destinatario);
    const out = applyOficioDocumentXml(templateXml, input, destinatario, r);
    const text = xmlToPlainText(out);

    expect(text).not.toContain("traer de selección");
    expect(text).toContain("Tipo de viaje:");
    expect(text).toContain("Congreso – Expositor");
    expect(text).toContain("Congreso Internacional de IA");
    expect(text).toContain("Quito, Ecuador");
    expect(text).toContain("Ponente principal");
    expect(text).toContain("Carlos Pérez López");
    expect(text).not.toMatch(/Carlos Pérez López\s+Carlos Pérez López/);
    expect(text).toContain("Decano de la Facultad de Ciencias de la Vida y la Tecnología");
  });
});
