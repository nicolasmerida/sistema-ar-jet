"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, LoaderCircle } from "lucide-react";
import { pagarReserva } from "@/lib/pasajeros/tarjeta-actions";
import { validarPago, type DatosPago, type ErroresPago } from "@/lib/pasajeros/pago-validacion";
import { dinero } from "../reserva/formato";
import { CamposTarjeta } from "./campos-tarjeta";

export function PagoForm({ codigo, total }: { codigo: number; total: string }) {
  const router = useRouter();
  const [datos, setDatos] = useState<DatosPago>({ titular: "", numero: "", vencimiento: "", seguridad: "" });
  const [tocados, setTocados] = useState<Partial<Record<keyof DatosPago, boolean>>>({});
  const [erroresServidor, setErroresServidor] = useState<ErroresPago>({});
  const [mensaje, setMensaje] = useState("");
  const [exito, setExito] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const validacion = validarPago(datos);
  const errores: ErroresPago = { ...erroresServidor };
  for (const campo of ["titular", "numero", "vencimiento", "seguridad"] as const) if (tocados[campo] && validacion[campo]) errores[campo] = validacion[campo];
  const bloqueado = pendiente || exito;

  function cambiar(campo: keyof DatosPago, valor: string) {
    if (campo === "numero") valor = valor.replace(/[^0-9]/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
    if (campo === "vencimiento") { const digitos = valor.replace(/\D/g, "").slice(0, 4); valor = digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos; }
    if (campo === "seguridad") valor = valor.replace(/\D/g, "");
    setDatos({ ...datos, [campo]: valor }); setErroresServidor({}); setMensaje("");
  }

  function pagar() {
    setTocados({ titular: true, numero: true, vencimiento: true, seguridad: true });
    if (bloqueado || Object.keys(validacion).length) return;
    setMensaje("");
    iniciar(async () => {
      try {
        const resultado = await pagarReserva(codigo, datos);
        setDatos((actual) => ({ ...actual, seguridad: "" }));
        if (resultado.ok) {
          setDatos({ titular: "", numero: "", vencimiento: "", seguridad: "" }); setExito(true);
          router.replace(`/vuelos/reservas/${codigo}`); router.refresh(); return;
        }
        if (resultado.resultados) { router.replace(resultado.resultados); return; }
        setMensaje(resultado.mensaje); setErroresServidor(resultado.errores ?? {});
      } catch { setDatos((actual) => ({ ...actual, seguridad: "" })); setMensaje("No se pudo completar el pago. Por favor, reintentá más tarde."); }
    });
  }

  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); pagar(); }} aria-busy={pendiente} className="flex min-w-0 flex-col gap-6">
      <CamposTarjeta datos={datos} errores={errores} pendiente={bloqueado} cambiar={cambiar} tocar={(campo) => setTocados({ ...tocados, [campo]: true })} />
      <p className="text-xs text-zinc-500">Pago simulado. Usá únicamente tarjetas de prueba.</p>
      {mensaje && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{mensaje}</p>}
      {exito && <p role="status" className="text-sm text-green-700">Pago realizado correctamente</p>}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-200 pt-5">
        {!bloqueado && <Link href={`/vuelos/reservas/${codigo}`} className="rounded-md border border-zinc-300 px-4 py-3 text-sm font-medium hover:bg-tertiary">Cancelar</Link>}
        <button type="submit" disabled={bloqueado || Object.keys(validacion).length > 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
          {pendiente ? <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden="true" /> : <CreditCard className="size-4 shrink-0" aria-hidden="true" />}{pendiente ? "Procesando..." : `Pagar ${dinero(total)}`}
        </button>
      </div>
    </form>
  );
}
