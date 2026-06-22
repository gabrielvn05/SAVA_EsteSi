"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & Readonly<{
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
}>;

export function ActionButton({
  loading = false,
  loadingLabel,
  children,
  className = "",
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={`btn ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? (
        <span className="btn__content btn__content--loading">
          <span className="btn__spinner" aria-hidden />
          <span>{loadingLabel ?? children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
