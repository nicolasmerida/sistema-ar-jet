"use client";

import { useState, useTransition } from "react";
import type { ResultadoAccionVuelo, ViajeDetalle } from "@/lib/vuelos/tipos";
import { LARGO_MAXIMO_MOTIVO, validarMotivo } from "@/lib/vuelos/validacion";
import { Modal } from "../aviones/modal";
import { fechaDeInstante, horaDeInstante } from "./formato";

export function CancelarViajeModal({ numero, ruta, viaje, onCerrar, onConfirmar }: {
  numero: string;
  ruta: string;
  viaje: ViajeDetalle;
  onCerrar: () => void;
  onConfirmar: (motivo: string) => Promise<ResultadoAccionVuelo>;
}) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cancelando, startTransition] = useTransition();
  const bloqueado = viaje.bloqueoCancelacion !== null;
  const puedeConfirmar = !bloqueado && !validarMotivo(motivo) && !cancelando;

  function confirmar() {
    if (!puedeConfirmar) return;
    startTransition(async () => {
      setError(null);
      try {
        const resultado = await onConfirmar(motivo);
        if (!resultado.ok) setError(resultado.mensaje);
      } catch {
        setError("No se pudieron guardar los datos. Por favor, contactá al equipo técnico");
      }
    });
  }

  return (
    <Modal titulo={`Cancelar vuelo - ${numero}`} onCerrar={() => { if (!cancelando) onCerrar(); }}>
      <dl className="grid gap-1 rounded-xl border border-zinc-300 bg-tertiary px-4 py-3 text-sm">
        <div className="flex gap-1"><dt>Ruta:</dt><dd className="font-medium">{ruta}</dd></div>
        <div className="flex gap-1"><dt>Fecha:</dt><dd className="font-medium">{fechaDeInstante(viaje.partida)} {horaDeInstante(viaje.partida)}</dd></div>
        <div className="flex gap-1"><dt>Reservas afectadas:</dt><dd className="font-medium">{viaje.reservasActivas} activas</dd></div>
      </dl>
      {bloqueado ? (
        <p role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{viaje.bloqueoCancelacion}</p>
      ) : (
        <div className="mt-5 flex flex-col gap-1.5">
          <label htmlFor="motivo-cancelacion" className="text-sm font-medium">Motivo de la cancelación <span className="text-zinc-500">(obligatorio)</span></label>
          <textarea id="motivo-cancelacion" value={motivo} rows={4} maxLength={LARGO_MAXIMO_MOTIVO} disabled={cancelando}
            placeholder="Ej. Condiciones meteorológicas adversas en el aeropuerto de destino."
            onChange={(event) => { setMotivo(event.target.value); setError(null); }}
            className="w-full resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/30" />
          <p className="text-right text-xs text-zinc-500">{motivo.length} / {LARGO_MAXIMO_MOTIVO} caracteres</p>
          {/* TODO: habilitar cuando exista el envío de emails a pasajeros. */}
          <label className="flex items-center gap-2 text-sm text-zinc-400" title="Disponible cuando se implemente el envío de emails">
            <input type="checkbox" disabled className="size-4" />
            Notificar por email a todos los pasajeros afectados (próximamente)
          </label>
        </div>
      )}
      {error && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-7 flex justify-end gap-3">
        <button type="button" disabled={cancelando} onClick={onCerrar} className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-tertiary">{bloqueado ? "Cerrar" : "No, volver"}</button>
        {!bloqueado && (
          <button type="button" disabled={!puedeConfirmar} onClick={confirmar} className="rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
            {cancelando ? "Cancelando..." : "Confirmar cancelación"}
          </button>
        )}
      </div>
    </Modal>
  );
}
