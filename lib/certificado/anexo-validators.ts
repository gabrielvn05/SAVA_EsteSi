const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg"]);
const PDF_TYPE = "application/pdf";

export function mimeAnexoFromFile(file: { type: string; name: string }): string {
  const t = file.type?.trim().toLowerCase();
  if (t) return t;
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf")) return PDF_TYPE;
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  return "";
}

export function validarAnexoObligatorio(
  tipo: string,
  file: { size: number; type: string; name: string } | null | undefined
): string | null {
  if (tipo !== "enfermedad") return null;
  if (!file || file.size === 0) {
    return "Para cita médica debes adjuntar el certificado o documento de respaldo (PDF, PNG o JPG).";
  }
  const mime = mimeAnexoFromFile(file);
  if (mime !== PDF_TYPE && !IMAGE_TYPES.has(mime)) {
    return "El anexo debe ser PDF, PNG o JPG.";
  }
  return null;
}

export function validarAnexoOpcional(file: { size: number; type: string; name: string } | null | undefined): string | null {
  if (!file || file.size === 0) return null;
  const mime = mimeAnexoFromFile(file);
  if (mime !== PDF_TYPE && !IMAGE_TYPES.has(mime)) {
    return "El archivo adjunto debe ser PDF, PNG o JPG.";
  }
  return null;
}

function validarListaAnexos(files: ReadonlyArray<{ size: number; type: string; name: string }>): string | null {
  for (const file of files) {
    const err = validarAnexoOpcional(file);
    if (err) return err;
  }
  return null;
}

export function validarAnexosObligatorio(
  tipo: string,
  files: ReadonlyArray<{ size: number; type: string; name: string }>
): string | null {
  if (tipo !== "enfermedad") return null;
  if (files.length === 0) {
    return "Para cita médica debes adjuntar el certificado o documento de respaldo (PDF, PNG o JPG).";
  }
  return validarListaAnexos(files);
}

export function validarAnexosOpcional(
  files: ReadonlyArray<{ size: number; type: string; name: string }>
): string | null {
  return validarListaAnexos(files);
}
