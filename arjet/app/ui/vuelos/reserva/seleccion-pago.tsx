"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Landmark, LoaderCircle } from "lucide-react";
import { confirmarReserva } from "@/lib/pasajeros/pago-actions";
import type { ModalidadReserva } from "@/lib/pasajeros/pago";
import { dinero, fechaHora } from "./formato";

export function SeleccionPago({ codigo, total, partida, modalidadGuardada, puedeConfirmar, estado }: {
  codigo: number; total: string; partida: string; modalidadGuardada: string | null; puedeConfirmar: boolean; estado: string;
}) {
  const router = useRouter();
  const [modalidad, setModalidad] = useState<ModalidadReserva>(modalidadGuardada === "tarjeta" ? "tarjeta" : "mostrador");
  const [confirmada, setConfirmada] = useState(Boolean(modalidadGuardada));
  const [mensaje, setMensaje] = useState("");
  const [pendiente, iniciar] = useTransition();
  const codigoVisible = `RES-${codigo}`;

  function confirmar() {
    if (pendiente || confirmada || !puedeConfirmar) return;
    setMensaje("");
    iniciar(async () => {
      try {
        const resultado = await confirmarReserva(codigo, modalidad);
        if (!resultado.ok) { setMensaje(resultado.mensaje); return; }
        setConfirmada(true);
        router.refresh();
      } catch { setMensaje("No se pudo confirmar la reserva. Por favor, reintentá más tarde."); }
    });
  }

  if (estado === "cancelado" || estado === "reembolsado") return (
    <section aria-labelledby="seleccion-pago-titulo" className="min-w-0">
      <h2 id="seleccion-pago-titulo" className="mb-5 text-lg font-semibold">Estado de la reserva</h2>
      <p role="status" className="rounded-md border border-zinc-200 bg-tertiary p-5 text-sm">Reserva {codigoVisible}: {estado === "cancelado" ? "cancelada" : "reembolsada"}.</p>
    </section>
  );

  return (
    <section aria-labelledby="seleccion-pago-titulo" className="min-w-0">
      <h2 id="seleccion-pago-titulo" className="mb-5 text-lg font-semibold">Selección de pago</h2>
      <fieldset disabled={pendiente || confirmada || !puedeConfirmar} className="grid grid-cols-2 border-b border-zinc-200">
        <legend className="sr-only">Modalidad de reserva</legend>
        {(["tarjeta", "mostrador"] as const).map((opcion) => {
          const Icon = opcion === "tarjeta" ? CreditCard : Landmark;
          return (
            <label key={opcion} className={`flex min-h-16 cursor-pointer items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition has-disabled:cursor-default ${modalidad === opcion ? "border-primary bg-primary/5 text-secondary" : "border-transparent text-zinc-500 hover:bg-tertiary"}`}>
              <input type="radio" name="modalidad-pago" checked={modalidad === opcion} value={opcion} onChange={() => { setModalidad(opcion); setMensaje(""); }} className="size-4 shrink-0 accent-primary" />
              <Icon className="hidden size-4 shrink-0 sm:block" aria-hidden="true" />
              <span>{opcion === "tarjeta" ? "Pagar con tarjeta" : "Reservar en mostrador"}</span>
            </label>
          );
        })}
      </fieldset>
      <div className="flex flex-col gap-5 py-6" aria-live="polite" aria-busy={pendiente}>
        <div className="rounded-md border border-primary/40 bg-primary/5 p-5">
          <p className="text-sm text-zinc-600">Código de reserva</p>
          <p className="mt-1 break-all text-xl font-semibold text-secondary">{codigoVisible}</p>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            {modalidad === "mostrador" ? "Presentá este código en el mostrador del aeropuerto para abonar en efectivo o con tarjeta." : "Tu vuelo quedará reservado con pago pendiente mediante tarjeta. No se realizará ningún cobro en este paso."}
          </p>
          <p className="mt-3 text-xs text-zinc-500">Salida del vuelo: {fechaHora(partida)}</p>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm"><span className="text-zinc-500">{estado === "pagado" ? "Total de pasajes activos" : "Total pendiente"}</span><span className="text-xl font-semibold text-secondary">{dinero(total)}</span></div>
        {confirmada ? (
          <div role="status" className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>Reserva confirmada: {codigoVisible}. {estado === "pendiente" ? "Pago pendiente." : `Estado del pago: ${estado}.`}</span>
          </div>
        ) : !puedeConfirmar ? <p role="alert" className="text-sm text-red-700">Esta reserva no admite confirmación. El vuelo ya no está disponible o cambió el estado de la compra.</p> : (
          <button type="button" disabled={pendiente} onClick={confirmar} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
            {pendiente ? <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />}
            {pendiente ? "Confirmando..." : `Confirmar reserva ${codigoVisible}`}
          </button>
        )}
        {mensaje && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{mensaje}</p>}
      </div>
    </section>
  );
}
