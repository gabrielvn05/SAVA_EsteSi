"use client";

import { useFormStatus } from "react-dom";
import { ActionButton } from "@/components/ui/ActionButton";

type Props = Readonly<{
  children: React.ReactNode;
  className?: string;
  loadingLabel?: string;
}>;

export function SubmitButton({ children, className = "btn--primary", loadingLabel }: Props) {
  const { pending } = useFormStatus();

  return (
    <ActionButton type="submit" className={className} loading={pending} loadingLabel={loadingLabel ?? "Procesando…"}>
      {children}
    </ActionButton>
  );
}
