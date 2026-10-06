"use client";

import { useState, useTransition } from "react";
import { eliminarAeropuerto } from "@/lib/aeropuertos/actions";
import type { AeropuertoListado } from "@/lib/aeropuertos/data";
import { MensajeError } from "./aviso";
import { Modal } from "./modal";

type EliminarAeropuertoModalProps = {
  aeropuerto: AeropuertoListado;
  onCerrar: () => void;
  onEliminado: (mensaje: string) => void;
};

export function EliminarAeropuertoModal({
  aeropuerto,
  onCerrar,
  onEliminado,
}: EliminarAeropuertoModalProps) {
  const [error, setError] = useState<string | null>(
    aeropuerto.vuelosVigentes > 0
      ? "No se puede eliminar un aeropuerto asociado a vuelos vigentes"
      : null,
  );
  const [eliminando, startTransition] = useTransition();

  function cerrar() {
    if (!eliminando) onCerrar();
  }

  function confirmar() {
    startTransition(async () => {
      const resultado = await eliminarAeropuerto(aeropuerto.id);
      if (resultado.ok) {
        onEliminado(resultado.mensaje);
      } else {
        setError(resultado.mensaje);
      }
    });
  }

  const nombreCompleto = `${aeropuerto.codigo} - ${aeropuerto.nombre}`;

  if (error) {
    return (
      <Modal titulo="No se puede eliminar" onCerrar={cerrar}>
        <div className="flex flex-col gap-6">
          <MensajeError mensaje={error} />
          <p className="text-sm text-zinc-600">
            Aeropuerto: <strong>{nombreCompleto}</strong>
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={cerrar}
              autoFocus
              className="rounded-md border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-tertiary"
            >
              Entendido
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      titulo="Eliminar aeropuerto"
      deshabilitarCerrar={eliminando}
      onCerrar={cerrar}
    >
      <div className="flex flex-col gap-6">
        <p className="text-sm text-zinc-600">
          ¿Querés eliminar el aeropuerto <strong>{nombreCompleto}</strong> (
          {aeropuerto.ciudad})? Va a dejar de estar disponible como origen y
          destino de vuelos. Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={cerrar}
            disabled={eliminando}
            autoFocus
            className="rounded-md border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-tertiary disabled:opacity-50"
          >
            No
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={eliminando}
            className="rounded-md bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {eliminando ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
