"use client";

import { BarChart3, LoaderCircle } from "lucide-react";
import type { ErroresFiltros, FiltrosOcupacion, OpcionVuelo } from "@/lib/reportes/ocupacion/tipos";

export function FiltrosReporte({ filtros, vuelos, errores, pendiente, valido, onCambiar, onTocar, onGenerar }: {
  filtros: FiltrosOcupacion;
  vuelos: OpcionVuelo[];
  errores: ErroresFiltros;
  pendiente: boolean;
  valido: boolean;
  onCambiar: (campo: keyof FiltrosOcupacion, valor: string) => void;
  onTocar: (campo: keyof FiltrosOcupacion) => void;
  onGenerar: () => void;
}) {
  const estilo = (campo: keyof FiltrosOcupacion) => `mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 ${errores[campo] ? "border-red-500 focus:ring-red-200" : "border-zinc-300 focus:border-primary focus:ring-primary/25"}`;
  function error(campo: keyof FiltrosOcupacion) {
    return errores[campo] ? <p id={`error-${campo}`} className="mt-1 text-xs text-red-600">{errores[campo]}</p> : null;
  }
  return (
    <form noValidate onSubmit={e => { e.preventDefault(); onGenerar(); }} className="rounded-2xl border border-zinc-200 bg-background p-5 shadow-sm">
      <fieldset disabled={pendiente}>
        <legend className="text-sm font-semibold text-secondary">Filtros del reporte</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <label htmlFor="reporte-vuelo" className="text-sm font-medium">Vuelo</label>
            <select id="reporte-vuelo" value={filtros.vuelo} onChange={e => onCambiar("vuelo", e.target.value)} className={estilo("vuelo")} aria-invalid={Boolean(errores.vuelo)} aria-describedby={errores.vuelo ? "error-vuelo" : undefined}>
              <option value="">Todos</option>
              {vuelos.map(vuelo => <option key={vuelo.id} value={vuelo.id}>{vuelo.etiqueta}</option>)}
            </select>
            {error("vuelo")}
          </div>
          <div>
            <label htmlFor="reporte-clase" className="text-sm font-medium">Clase</label>
            <select id="reporte-clase" value={filtros.clase} onChange={e => onCambiar("clase", e.target.value)} className={estilo("clase")} aria-invalid={Boolean(errores.clase)} aria-describedby={errores.clase ? "error-clase" : undefined}>
              <option value="ambas">Ambas clases</option><option value="economy">Economy</option><option value="primera">Primera</option>
            </select>
            {error("clase")}
          </div>
          {(["desde", "hasta"] as const).map(campo => (
            <div key={campo}>
              <label htmlFor={`reporte-${campo}`} className="text-sm font-medium">{campo === "desde" ? "Desde" : "Hasta"}</label>
              <input id={`reporte-${campo}`} type="date" required value={filtros[campo]} onBlur={() => onTocar(campo)} onChange={e => onCambiar(campo, e.target.value)} className={estilo(campo)} aria-invalid={Boolean(errores[campo])} aria-describedby={errores[campo] ? `error-${campo}` : "ayuda-fechas"} />
              {error(campo)}
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p id="ayuda-fechas" className="text-xs text-zinc-500">Fechas de salida en hora de Argentina. Se incluyen ambos días.</p>
          <button type="submit" disabled={!valido || pendiente} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-50">
            {pendiente ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <BarChart3 className="size-4" aria-hidden="true" />}
            {pendiente ? "Generando…" : "Generar reporte"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
