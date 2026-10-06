"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export function Modal({ titulo, descripcion, onCerrar, children }: {
  titulo: string; descripcion?: string; onCerrar: () => void; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    const anterior = document.activeElement;
    dialog?.showModal();
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflowAnterior;
      if (anterior instanceof HTMLElement) anterior.focus();
    };
  }, []);
  return (
    <dialog ref={ref} aria-labelledby={`${id}-titulo`} aria-describedby={descripcion ? `${id}-descripcion` : undefined}
      onCancel={(event) => { event.preventDefault(); onCerrar(); }}
      onClick={(event) => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onCerrar(); } }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-background p-6 text-foreground shadow-xl backdrop:bg-black/40 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <h2 id={`${id}-titulo`} className="text-xl font-semibold">{titulo}</h2>
        <button type="button" onClick={onCerrar} aria-label="Cerrar ventana" className="rounded-md p-1 text-zinc-500 hover:bg-tertiary"><X className="size-5" aria-hidden="true" /></button>
      </div>
      {descripcion && <p id={`${id}-descripcion`} className="mt-2 text-sm text-zinc-500">{descripcion}</p>}
      <div className="mt-7">{children}</div>
    </dialog>
  );
}
