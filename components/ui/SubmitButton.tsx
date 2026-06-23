"use client";

import { type ReactNode } from "react";
import { ActionButton } from "@/components/ui/ActionButton";

type Props = Readonly<{
  children: ReactNode;
  className?: string;
  loadingLabel?: string;
  loading?: boolean;
}>;

export function SubmitButton({
  children,
  className = "btn--primary",
  loadingLabel,
  loading = false
}: Props) {
  return (
    <ActionButton
      type="submit"
      className={className}
      loading={loading}
      loadingLabel={loadingLabel ?? "Procesando…"}
    >
      {children}
    </ActionButton>
  );
}
