"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { registrarCheckinAction } from "@/lib/mostrador/actions";
import { MENSAJE_ERROR_CHECKIN } from "@/lib/mostrador/checkin-reglas";
import type { PasajeEncontrado, ReservaEncontrada } from "@/lib/mostrador/tipos";
import { EstadoReserva } from "@/app/ui/pasajeros/reservas/estado-reserva";
import { fechaHora } from "@/app/ui/vuelos/reserva/formato";

const COLUMNAS = ["Pasajero", "Vuelo y ruta", "Salida", "Clase", "Estado de check-in", "Acciones"];

function estadoVisualPasaje(pasaje: PasajeEncontrado) {
  if (pasaje.cancelado || pasaje.estadoViaje === "cancelado") return "cancelado";
  if (pasaje.presentado) return "presentado";
  return "sin_checkin";
}

export function ReservaItem({ reserva }: { reserva: ReservaEncontrada }) {
  const { titular } = reserva;
  const [pasajes, setPasajes] = useState<PasajeEncontrado[]>(reserva.pasajes);
  const [aviso, setAviso] = useState<{ ok: boolean; mensaje: string } | null>(null);
  const [idEnCurso, setIdEnCurso] = useState<number | null>(null);
  const [procesando, iniciarCheckin] = useTransition();

  function registrarCheckin(pasaje: PasajeEncontrado) {
    setAviso(null);
    setIdEnCurso(pasaje.id);
    iniciarCheckin(async () => {
      try {
        const resultado = await registrarCheckinAction({
          idPasaje: pasaje.id,
          dniPasajero: pasaje.pasajero.dni,
        });
        setAviso({ ok: resultado.ok, mensaje: resultado.mensaje });
        if (resultado.ok) {
          setPasajes((previos) =>
            previos.map((item) =>
              item.id === pasaje.id
                ? { ...item, presentado: true, fechaCheckin: resultado.fechaCheckin }
                : item,
            ),
          );
        }
      } catch {
        setAviso({ ok: false, mensaje: MENSAJE_ERROR_CHECKIN });
      } finally {
        setIdEnCurso(null);
      }
    });
  }

  return (
    <article className="rounded-md border border-zinc-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-t-md bg-tertiary px-4 py-4 text-sm">
        <div className="min-w-0">
          <p className="font-semibold text-secondary">Reserva RES-{reserva.codigo}</p>
          <p className="mt-1 text-xs text-zinc-600">
            Titular: {titular.nombre} {titular.apellido} · Documento: {titular.dni}
          </p>
        </div>
        <EstadoReserva estado={reserva.estado} />
      </header>

      {aviso && (
        <div
          role={aviso.ok ? "status" : "alert"}
          className={`mx-4 mt-4 flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm ${
            aviso.ok
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <p>{aviso.mensaje}</p>
          <button
            type="button"
            onClick={() => setAviso(null)}
            aria-label="Cerrar mensaje"
            className="rounded p-0.5 opacity-70 transition hover:opacity-100"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="overflow-x-auto p-4">
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">Pasajes de la reserva RES-{reserva.codigo}</caption>
          <thead className="border-b border-zinc-200 text-xs text-zinc-500">
            <tr>
              {COLUMNAS.map((titulo) => (
                <th
                  key={titulo}
                  scope="col"
                  className={`px-3 py-3 font-medium ${titulo === "Acciones" ? "text-right" : ""}`}
                >
                  {titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {pasajes.map((pasaje) => {
              const registrandoEste = procesando && idEnCurso === pasaje.id;
              return (
                <tr key={pasaje.id} className={pasaje.cancelado ? "text-zinc-400" : "text-zinc-700"}>
                  <td className="px-3 py-4">
                    <p className="font-medium">{pasaje.pasajero.nombre} {pasaje.pasajero.apellido}</p>
                    <p className="mt-1 text-xs text-zinc-500">Documento: {pasaje.pasajero.dni}</p>
                  </td>
                  <td className="px-3 py-4">
                    <p className="font-medium">{pasaje.numero} · {pasaje.origen.codigo_iata} → {pasaje.destino.codigo_iata}</p>
                    <p className="mt-1 text-xs text-zinc-500">{pasaje.origen.ciudad} → {pasaje.destino.ciudad}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4">{fechaHora(pasaje.partida)}</td>
                  <td className="px-3 py-4">{pasaje.clase === "economy" ? "Economy" : "Primera"}</td>
                  <td className="px-3 py-4">
                    <EstadoReserva estado={estadoVisualPasaje(pasaje)} />
                  </td>
                  <td className="px-3 py-4 text-right">
                    <button
                      type="button"
                      disabled={procesando}
                      onClick={() => registrarCheckin(pasaje)}
                      aria-label={`Registrar check-in de ${pasaje.pasajero.nombre} ${pasaje.pasajero.apellido}`}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {registrandoEste ? "Registrando..." : "Registrar check-in"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
