"use client";

import { type ReactNode } from "react";
import { ActionButton } from "@/components/ui/ActionButton";

export type EmergentAlertVariant = "error" | "warning" | "success" | "info";

type EmergentAlertModalProps = Readonly<{
  open: boolean;
  title: string;
  message: string;
  variant?: EmergentAlertVariant;
  confirmLabel?: string;
  onClose: () => void;
}>;

const TITLES: Record<EmergentAlertVariant, string> = {
  error: "Revise los datos",
  warning: "Atención",
  success: "Listo",
  info: "Información"
};

export function EmergentAlertModal({
  open,
  title,
  message,
  variant = "error",
  confirmLabel = "Entendido",
  onClose
}: EmergentAlertModalProps) {
  if (!open) return null;

  return (
    <div className="logout-modal" role="alertdialog" aria-modal="true" aria-labelledby="emergent-alert-title">
      <button type="button" className="logout-modal__backdrop" aria-label="Cerrar" onClick={onClose} />
      <div className={`logout-modal__panel emergent-alert emergent-alert--${variant}`}>
        <h2 id="emergent-alert-title" className="logout-modal__title">
          {title || TITLES[variant]}
        </h2>
        <p className="logout-modal__text">{message}</p>
        <div className="logout-modal__actions">
          <button type="button" className="btn btn--primary" onClick={onClose}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type EmergentPromptModalProps = Readonly<{
  open: boolean;
  title: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}>;

/** Modal con campo de texto (p. ej. motivo de rechazo). */
export function EmergentPromptModal({
  open,
  title,
  description,
  value,
  onChange,
  placeholder,
  required = false,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  onConfirm,
  onCancel,
  children
}: EmergentPromptModalProps) {
  if (!open) return null;

  return (
    <div className="logout-modal" role="dialog" aria-modal="true" aria-labelledby="emergent-prompt-title">
      <button
        type="button"
        className="logout-modal__backdrop"
        aria-label="Cerrar"
        onClick={onCancel}
        disabled={loading}
      />
      <div className="logout-modal__panel emergent-prompt">
        <h2 id="emergent-prompt-title" className="logout-modal__title">
          {title}
        </h2>
        {description ? <p className="logout-modal__text">{description}</p> : null}
        {children ?? (
          <textarea
            rows={4}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            autoFocus
            style={{ width: "100%", marginBottom: "1rem", resize: "vertical" }}
          />
        )}
        <div className="logout-modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <ActionButton type="button" className="btn--danger" loading={loading} loadingLabel="Procesando…" onClick={onConfirm}>
            {confirmLabel}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
