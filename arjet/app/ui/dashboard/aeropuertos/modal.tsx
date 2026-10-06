"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type ModalProps = {
  titulo: string;
  descripcion?: string;
  deshabilitarCerrar?: boolean;
  onCerrar: () => void;
  children: React.ReactNode;
};

export function Modal({
  titulo,
  descripcion,
  deshabilitarCerrar = false,
  onCerrar,
  children,
}: ModalProps) {
  useEffect(() => {
    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !deshabilitarCerrar) onCerrar();
    }

    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [deshabilitarCerrar, onCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deshabilitarCerrar) onCerrar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="modal-titulo" className="text-xl font-semibold text-foreground">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            disabled={deshabilitarCerrar}
            aria-label="Cerrar ventana"
            className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        {descripcion && (
          <p className="mt-1 text-sm text-zinc-500">{descripcion}</p>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

