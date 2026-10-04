"use client";

import { useEffect } from "react";

type ModalProps = {
  titulo: string;
  descripcion?: string;
  onCerrar: () => void;
  children: React.ReactNode;
};

export function Modal({ titulo, descripcion, onCerrar, children }: ModalProps) {
  useEffect(() => {
    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onCerrar();
    }

    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCerrar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl"
      >
        <h2 id="modal-titulo" className="text-xl font-semibold text-foreground">
          {titulo}
        </h2>
        {descripcion && (
          <p className="mt-1 text-sm text-zinc-500">{descripcion}</p>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
