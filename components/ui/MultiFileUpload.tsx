"use client";

import { useRef } from "react";

type Props = Readonly<{
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  hint?: string;
  addLabel?: string;
}>;

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function MultiFileUpload({
  files,
  onChange,
  accept = ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg",
  hint,
  addLabel = "Agregar archivos"
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function appendFiles(list: FileList | null) {
    if (!list?.length) return;
    const merged = new Map(files.map((f) => [fileKey(f), f]));
    for (const file of Array.from(list)) {
      merged.set(fileKey(file), file);
    }
    onChange(Array.from(merged.values()));
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="multi-file-upload stack">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="multi-file-upload__input"
        onChange={(e) => appendFiles(e.target.files)}
      />
      <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => inputRef.current?.click()}>
          {addLabel}
        </button>
        {files.length > 0 ? (
          <span className="field-hint" style={{ margin: 0 }}>
            {files.length} archivo{files.length === 1 ? "" : "s"} seleccionado{files.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
      {files.length > 0 ? (
        <ul className="multi-file-upload__list">
          {files.map((file, index) => (
            <li key={fileKey(file)} className="multi-file-upload__item">
              <span className="multi-file-upload__name">{file.name}</span>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => removeAt(index)}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
