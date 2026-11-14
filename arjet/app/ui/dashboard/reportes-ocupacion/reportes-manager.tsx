"use client";

import { useState, useTransition } from "react";
import { generarReporteOcupacion } from "@/lib/reportes/ocupacion/actions";
import { validarFiltrosOcupacion } from "@/lib/reportes/ocupacion/validacion";
import { ERROR_REPORTE, type ErroresFiltros, type FiltrosOcupacion, type OpcionVuelo, type ResultadoOcupacion } from "@/lib/reportes/ocupacion/tipos";
import { FiltrosReporte } from "./filtros";
import { TablaOcupacion } from "./tabla";
import { ResumenOcupacion } from "./resumen";

export function ReportesOcupacion({ vuelos }: { vuelos: OpcionVuelo[] }) {
  const [filtros, setFiltros] = useState<FiltrosOcupacion>({ vuelo: "", clase: "ambas", desde: "", hasta: "" });
  const [tocados, setTocados] = useState<Partial<Record<keyof FiltrosOcupacion, boolean>>>({});
  const [resultado, setResultado] = useState<ResultadoOcupacion | null>(null);
  const [pendiente, iniciar] = useTransition();
  const validacion = validarFiltrosOcupacion(filtros);
  const errores: ErroresFiltros = resultado && !resultado.ok ? { ...resultado.errores } : {};
  if (!validacion.ok) for (const campo of Object.keys(validacion.errores) as (keyof FiltrosOcupacion)[]) {
    if (tocados[campo]) errores[campo] = validacion.errores[campo];
  }

  function cambiar(campo: keyof FiltrosOcupacion, valor: string) {
    setFiltros(actual => ({ ...actual, [campo]: valor }));
    setTocados(actual => ({ ...actual, [campo]: true }));
    setResultado(null);
  }

  function generar() {
    setTocados({ vuelo: true, clase: true, desde: true, hasta: true });
    if (!validacion.ok || pendiente) return;
    setResultado(null);
    iniciar(async () => {
      try { setResultado(await generarReporteOcupacion(filtros)); }
      catch { setResultado({ ok: false, mensaje: ERROR_REPORTE }); }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-2xl font-semibold">Reportes de ocupación</h1><p className="mt-1 text-sm text-zinc-500">Consultá la capacidad y los pasajes vendidos de cada viaje por vuelo, clase y período.</p></div>
      <FiltrosReporte filtros={filtros} vuelos={vuelos} errores={errores} pendiente={pendiente} valido={validacion.ok} onCambiar={cambiar} onTocar={campo => setTocados(actual => ({ ...actual, [campo]: true }))} onGenerar={generar} />
      <div aria-live="polite" aria-busy={pendiente} className="flex flex-col gap-6">
        {pendiente && <p role="status" className="text-sm text-zinc-500">Consultando la ocupación…</p>}
        {resultado && !resultado.ok && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{resultado.mensaje}</p>}
        {resultado?.ok && <><ResumenOcupacion resumen={resultado.reporte.resumen} /><TablaOcupacion filas={resultado.reporte.filas} /></>}
        {!resultado && !pendiente && <div className="rounded-2xl border border-zinc-200 bg-tertiary/50 px-6 py-12 text-center text-sm text-zinc-500">Seleccioná el vuelo, la clase y el rango de fechas y presioná “Generar reporte”.</div>}
      </div>
    </div>
  );
}
