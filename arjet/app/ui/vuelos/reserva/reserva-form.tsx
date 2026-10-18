"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import type { VueloDisponible } from "@/lib/pasajeros/tipos";
import type { DatosBusqueda } from "@/lib/pasajeros/validacion";
import { reservarVuelo } from "@/lib/pasajeros/reserva-actions";
import { normalizarPasajero, validarPasajeros, type ClaseReserva, type DatosPasajero, type ErroresReserva } from "@/lib/pasajeros/reserva-validacion";
import { rutaReserva } from "@/lib/pasajeros/rutas";
import { dinero, fechaHora } from "./formato";
import { PasosReserva } from "./pasos-reserva";
import { SeleccionClase } from "./seleccion-clase";
import { PasajerosForm } from "./pasajeros-form";

const pasajeroVacio = (): DatosPasajero => ({ nombre: "", apellido: "", dni: "" });

export function ReservaForm({ vuelo, busqueda, claseInicial }: { vuelo: VueloDisponible; busqueda: DatosBusqueda; claseInicial: ClaseReserva }) {
  const router = useRouter();
  const [clase, setClase] = useState<ClaseReserva>(vuelo[claseInicial].disponibles ? claseInicial : vuelo.economy.disponibles ? "economy" : "primera");
  const [pasajeros, setPasajeros] = useState<DatosPasajero[]>([pasajeroVacio()]);
  const [intentado, setIntentado] = useState(false);
  const [erroresServidor, setErroresServidor] = useState<ErroresReserva>({});
  const [mensaje, setMensaje] = useState("");
  const [pendiente, iniciar] = useTransition();
  const tarifa = vuelo[clase];
  const insuficientes = pasajeros.length > tarifa.disponibles;
  const errores = intentado ? validarPasajeros(pasajeros) : erroresServidor;
  const volver = `/vuelos?${new URLSearchParams(busqueda)}`;

  function confirmar() {
    setIntentado(true);
    if (pendiente || insuficientes || Object.keys(validarPasajeros(pasajeros)).length) return;
    setMensaje("");
    iniciar(async () => {
      try {
        const resultado = await reservarVuelo({ viaje: vuelo.id, clase, pasajeros: pasajeros.map(normalizarPasajero) });
        if (resultado.ok) { router.push(`/vuelos/reservas/${resultado.codigo}`); return; }
        if (resultado.login) { router.push(`/login?redirect_url=${encodeURIComponent(rutaReserva(vuelo.id, clase))}`); return; }
        if (resultado.agotado) { router.push(`${volver}&aviso=agotado`); return; }
        setMensaje(resultado.mensaje);
        setErroresServidor(resultado.errores ?? {});
      } catch { setMensaje("No se pudo registrar la reserva. Por favor, reintentá más tarde."); }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PasosReserva />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Pasajeros y clase</h1>
        <Link href={volver} className="inline-flex items-center gap-2 text-sm font-semibold text-secondary"><ArrowLeft className="size-4" aria-hidden="true" />Volver a resultados</Link>
      </div>
      <section aria-label="Vuelo seleccionado" className="border-y border-zinc-200 bg-tertiary px-4 py-5">
        <p className="text-sm font-semibold text-secondary">Vuelo {vuelo.numero}</p>
        <p className="mt-1 font-medium">{vuelo.origenCiudad} ({vuelo.origen}) → {vuelo.destinoCiudad} ({vuelo.destino})</p>
        <p className="mt-2 text-sm text-zinc-600">Salida: {fechaHora(vuelo.partida)} · Llegada: {fechaHora(vuelo.llegada)}</p>
      </section>
      <form noValidate onSubmit={(e) => { e.preventDefault(); confirmar(); }} className="flex flex-col gap-8" aria-busy={pendiente}>
        <SeleccionClase vuelo={vuelo} clase={clase} cambiar={(valor) => { setClase(valor); setMensaje(""); }} pendiente={pendiente} />
        <PasajerosForm pasajeros={pasajeros} errores={errores.pasajeros} disponibles={tarifa.disponibles} pendiente={pendiente}
          cantidad={(valor) => { setPasajeros((actual) => Array.from({ length: valor }, (_, i) => actual[i] ?? pasajeroVacio())); setMensaje(""); }}
          cambiar={(indice, campo, valor) => { setPasajeros((actual) => actual.map((p, i) => i === indice ? { ...p, [campo]: valor } : p)); setErroresServidor({}); setMensaje(""); }} />
        {insuficientes && <p role="alert" className="text-sm text-red-600">No hay suficientes asientos en esta clase para la cantidad de pasajeros seleccionada.</p>}
        {mensaje && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{mensaje}</p>}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 pt-6">
          <div><p className="text-sm text-zinc-500">Total · {pasajeros.length} {pasajeros.length === 1 ? "pasajero" : "pasajeros"}</p><p className="text-2xl font-semibold text-secondary">{dinero(Math.round(Number(tarifa.precio) * 100) * pasajeros.length / 100)}</p></div>
          <button type="submit" disabled={pendiente || insuficientes} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
            {pendiente ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}{pendiente ? "Reservando..." : "Continuar al pago"}
          </button>
        </div>
      </form>
    </div>
  );
}
