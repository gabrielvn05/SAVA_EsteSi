import { PDFDocument } from "pdf-lib";
import { mimeAnexoFromFile } from "@/lib/certificado/anexo-validators";

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg"]);
const PDF_TYPE = "application/pdf";

async function anexoComoPaginasPdf(anexo: Buffer, mime: string): Promise<PDFDocument> {
  if (mime === PDF_TYPE) {
    return PDFDocument.load(anexo);
  }

  if (!IMAGE_TYPES.has(mime)) {
    throw new Error("Formato no soportado. Use PDF, PNG o JPG.");
  }

  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const bytes = new Uint8Array(anexo);
  const image =
    mime === "image/png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
  const maxW = page.getWidth() - 80;
  const maxH = page.getHeight() - 120;
  const scale = Math.min(maxW / image.width, maxH / image.height, 1);
  const w = image.width * scale;
  const h = image.height * scale;
  page.drawImage(image, {
    x: (page.getWidth() - w) / 2,
    y: page.getHeight() - h - 60,
    width: w,
    height: h
  });
  page.drawText("Anexo", { x: 40, y: page.getHeight() - 40, size: 12 });
  return doc;
}

/** Añade las páginas del anexo al final del certificado PDF. */
export async function mergeCertificadoConAnexo(
  certificadoPdf: Buffer,
  anexo: Buffer,
  mime: string
): Promise<Buffer> {
  const principal = await PDFDocument.load(certificadoPdf);
  const anexoDoc = await anexoComoPaginasPdf(anexo, mime);
  const paginas = await principal.copyPages(anexoDoc, anexoDoc.getPageIndices());
  for (const p of paginas) principal.addPage(p);
  return Buffer.from(await principal.save());
}

export {
  mimeAnexoFromFile,
  validarAnexoObligatorio,
  validarAnexoOpcional,
  validarAnexosObligatorio,
  validarAnexosOpcional
} from "@/lib/certificado/anexo-validators";
