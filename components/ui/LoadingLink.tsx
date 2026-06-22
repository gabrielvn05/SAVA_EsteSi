"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type AnchorHTMLAttributes, type ReactNode, useTransition } from "react";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> &
  Readonly<{
    href: string;
    children: ReactNode;
    loadingLabel?: string;
  }>;

/** Enlace con indicador de carga al navegar (evita sensación de “no pasó nada”). */
export function LoadingLink({ href, className, children, loadingLabel = "Cargando…", ...rest }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <>
      {isPending ? <LoadingOverlay label={loadingLabel} /> : null}
      <Link
        href={href}
        className={className}
        {...rest}
        onClick={(e) => {
          rest.onClick?.(e);
          if (e.defaultPrevented) return;
          e.preventDefault();
          startTransition(() => {
            router.push(href);
          });
        }}
      >
        {children}
      </Link>
    </>
  );
}
