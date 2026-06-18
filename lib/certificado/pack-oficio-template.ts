import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import type { CertificadoTipo } from "@/lib/certificado/build-certificado-pdf";
import { OFICIO_TEMPLATE_FILES } from "@/lib/certificado/oficio-template-map";

const TEMPLATES_DIR = path.join(process.cwd(), "public", "templates");
const EXTRACTED_DIR = path.join(TEMPLATES_DIR, "oficio-extracted");
const LEGACY_DOCX = path.join(TEMPLATES_DIR, "oficio-plantilla.docx");

function addDirToZip(zip: PizZip, dir: string, base = "") {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const entry = base ? `${base}/${name}` : name;
    if (fs.statSync(full).isDirectory()) {
      addDirToZip(zip, full, entry);
    } else {
      zip.file(entry, fs.readFileSync(full));
    }
  }
}

/** Carga la plantilla Word institucional según el tipo de trámite. */
export function loadOficioTemplateZip(tipo: CertificadoTipo): PizZip {
  const fileName = OFICIO_TEMPLATE_FILES[tipo];
  const filePath = path.join(TEMPLATES_DIR, fileName);

  if (fs.existsSync(filePath)) {
    return new PizZip(fs.readFileSync(filePath, "binary"));
  }

  if (tipo === "enfermedad" && fs.existsSync(EXTRACTED_DIR)) {
    const zip = new PizZip();
    addDirToZip(zip, EXTRACTED_DIR);
    return zip;
  }

  if (fs.existsSync(LEGACY_DOCX)) {
    return new PizZip(fs.readFileSync(LEGACY_DOCX, "binary"));
  }

  throw new Error(`No se encontró la plantilla de oficio para ${tipo}.`);
}

export function oficioExtractedMediaDir() {
  const media = path.join(EXTRACTED_DIR, "word", "media");
  if (fs.existsSync(media)) return media;
  return path.join(TEMPLATES_DIR, "oficio-media");
}
