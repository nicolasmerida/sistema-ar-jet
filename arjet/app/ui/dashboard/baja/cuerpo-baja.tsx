"use client";

import { CircleAlert, Loader2, TriangleAlert } from "lucide-react";
import type { ResumenBaja, ViajeBloqueante } from "@/lib/vuelos/tipos";
import { diaYMesDeInstante, horaDeInstante, mismoDia } from "../vuelos/formato";
import type { EstadoBaja } from "./use-baja";

export function tituloBaja(estado: EstadoBaja, sujeto: string) {
  return estado.paso === "bloqueada" ? "No se puede dar de baja" : `Dar de baja ${sujeto}`;
}

/** Contenido del modal de baja; el marco (Modal) lo pone cada módulo. */
export function CuerpoBaja({ estado, procesando, nombre, consecuencia, onConfirmar, onCerrar }: {
  estado: EstadoBaja;
  procesando: boolean;
  /** Ej. "el aeropuerto BHI - Comandante Espora". */
  nombre: React.ReactNode;
  /** Ej. "Dejará de ofrecerse como origen y destino." */
  consecuencia: string;
  onConfirmar: () => void;
  onCerrar: () => void;
}) {
  if (estado.paso === "cargando") {
    return (
      <p role="status" className="flex items-center gap-2 py-4 text-sm text-zinc-500">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Revisando los vuelos vigentes...
      </p>
    );
  }

  if (estado.paso === "error" || estado.paso === "bloqueada") {
    return (
      <div className="flex flex-col gap-6">
        <MensajeError mensaje={estado.mensaje} />
        {estado.paso === "bloqueada" && <ListaBloqueantes bloqueantes={estado.bloqueantes} />}
        <div className="flex justify-end">
          <button type="button" onClick={onCerrar} autoFocus
            className="rounded-md border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-tertiary">
            Entendido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-zinc-600">
        ¿Querés dar de baja {nombre}? {consecuencia} Su historial se conserva.
      </p>
      {estado.resumen.viajes > 0 && <AvisoCancelacion resumen={estado.resumen} />}
      {estado.error && <MensajeError mensaje={estado.error} />}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCerrar} disabled={procesando} autoFocus
          className="rounded-md border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-tertiary disabled:opacity-50">
          No
        </button>
        <button type="button" onClick={onConfirmar} disabled={procesando}
          className="rounded-md bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">
          {procesando ? "Dando de baja..." : "Sí, dar de baja"}
        </button>
      </div>
    </div>
  );
}

function plural(cantidad: number, singular: string, plural: string) {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

/** "Tiene 3 vuelos vigentes: se cancelarán 12 viajes y se verán afectadas 8 reservas." */
function AvisoCancelacion({ resumen }: { resumen: ResumenBaja }) {
  const reservas = resumen.reservas === 0
    ? " (no hay reservas afectadas)"
    : ` y se ${resumen.reservas === 1 ? "verá afectada" : "verán afectadas"} ${plural(resumen.reservas, "reserva", "reservas")}`;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>
        Tiene {plural(resumen.vuelos, "vuelo vigente", "vuelos vigentes")}: se{" "}
        {resumen.viajes === 1 ? "cancelará" : "cancelarán"} {plural(resumen.viajes, "viaje", "viajes")}{reservas}.
      </span>
    </p>
  );
}

/** "AN 520 · hoy 18:30 · sale en menos de 3 h" */
function ListaBloqueantes({ bloqueantes }: { bloqueantes: ViajeBloqueante[] }) {
  const ahora = new Date().toISOString();
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground">Viajes que no se pueden cancelar:</p>
      <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto text-sm text-zinc-600">
        {bloqueantes.map((viaje) => (
          <li key={`${viaje.numero}-${viaje.partida}`}>
            <span className="font-mono font-medium text-foreground">{viaje.numero}</span>
            {" · "}{mismoDia(viaje.partida, ahora) ? "hoy" : diaYMesDeInstante(viaje.partida)} {horaDeInstante(viaje.partida)}
            {" · "}{viaje.motivo}
          </li>
        ))}
      </ul>
      <p className="text-xs text-zinc-500">Podés volver a intentarlo cuando esos viajes hayan llegado a destino.</p>
    </div>
  );
}

function MensajeError({ mensaje }: { mensaje: string }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {mensaje}
    </p>
  );
}
