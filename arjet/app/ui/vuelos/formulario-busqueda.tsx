import { LoaderCircle, Search } from "lucide-react";
import type { OpcionAeropuerto } from "@/lib/vuelos/tipos";
import type { DatosBusqueda, ErroresBusqueda } from "@/lib/pasajeros/validacion";
import { Campo, claseControl } from "@/app/ui/dashboard/vuelos/campo";

export function FormularioBusqueda({ datos, errores, aeropuertos, hoy, pendiente, bloqueado, cambiar, tocar, buscar }: {
  datos: DatosBusqueda; errores: ErroresBusqueda; aeropuertos: OpcionAeropuerto[];
  hoy: string; pendiente: boolean; bloqueado: boolean;
  cambiar: (campo: keyof DatosBusqueda, valor: string) => void;
  tocar: (campo: keyof DatosBusqueda) => void;
  buscar: () => void;
}) {
  return (
    <form noValidate onSubmit={(event) => { event.preventDefault(); buscar(); }} className="grid items-start gap-4 border-b border-zinc-200 pb-8 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_auto]">
      {(["origen", "destino"] as const).map((campo) => (
        <Campo key={campo} id={`buscar-${campo}`} etiqueta={campo === "origen" ? "Origen" : "Destino"} error={errores[campo]}>
          <select id={`buscar-${campo}`} required value={datos[campo]} disabled={pendiente || bloqueado}
            aria-invalid={Boolean(errores[campo])} aria-describedby={errores[campo] ? `buscar-${campo}-error` : undefined}
            className={`${claseControl(errores[campo])} min-w-0`} onChange={(e) => cambiar(campo, e.target.value)} onBlur={() => tocar(campo)}>
            <option value="">Seleccioná un aeropuerto</option>
            {aeropuertos.map((a) => <option key={a.id} value={a.id}>{a.ciudad} - {a.nombre} ({a.codigo})</option>)}
          </select>
        </Campo>
      ))}
      <Campo id="buscar-fecha" etiqueta="Fecha de salida" error={errores.fecha}>
        <input id="buscar-fecha" type="date" required min={hoy} value={datos.fecha} disabled={pendiente || bloqueado}
          aria-invalid={Boolean(errores.fecha)} aria-describedby={errores.fecha ? "buscar-fecha-error" : undefined}
          className={`${claseControl(errores.fecha)} min-w-0`} onChange={(e) => cambiar("fecha", e.target.value)} onBlur={() => tocar("fecha")} />
      </Campo>
      <button type="submit" disabled={pendiente || bloqueado || !datos.origen || !datos.destino || !datos.fecha || Object.values(errores).some(Boolean)}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-6">
        {pendiente ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
        {pendiente ? "Buscando..." : "Buscar"}
      </button>
    </form>
  );
}
