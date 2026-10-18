"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { LoaderCircle, XCircle } from "lucide-react";
import { cancelarPasaje } from "@/lib/pasajeros/cancelacion-actions";
import type { SeleccionCancelacion } from "./reserva-item";

export function CancelarModal({ seleccion, cerrar, completado }: {
  seleccion: SeleccionCancelacion; cerrar: () => void; completado: (mensaje: string) => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState("");
  useEffect(() => { const nodo = dialogo.current; nodo?.showModal(); return () => nodo?.close(); }, []);
  function confirmar() {
    if (pendiente) return;
    setError("");
    iniciar(async () => {
      try {
        const resultado = await cancelarPasaje(seleccion.codigo, seleccion.idPasaje);
        if (resultado.ok) completado(resultado.mensaje);
        else setError(resultado.mensaje);
      } catch { setError("No se pudo completar la cancelación. Por favor, contactá al equipo técnico."); }
    });
  }
  return (
    <dialog ref={dialogo} aria-labelledby="cancelar-pasaje-titulo" onCancel={(e) => { e.preventDefault(); if (!pendiente) cerrar(); }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-md border border-zinc-200 bg-white p-6 text-foreground shadow-xl backdrop:bg-black/40">
      <h2 id="cancelar-pasaje-titulo" className="text-xl font-semibold text-red-600">¿Desea cancelar esta compra?</h2>
      <p className="mt-3 text-sm font-medium">{seleccion.descripcion}</p>
      <p className="mt-3 text-sm leading-6 text-zinc-600">La cancelación está sujeta a las políticas de la tarifa. Los asientos serán liberados inmediatamente. Recibirá una notificación por correo electrónico con el detalle del reembolso y cualquier cargo aplicable. Esta acción no se puede deshacer.</p>
      {error && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" autoFocus disabled={pendiente} onClick={cerrar} className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-tertiary disabled:opacity-50">No, volver</button>
        <button type="button" disabled={pendiente} onClick={confirmar} className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
          {pendiente ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <XCircle className="size-4" aria-hidden="true" />}{pendiente ? "Cancelando..." : "Confirmar cancelación"}
        </button>
      </div>
    </dialog>
  );
}
