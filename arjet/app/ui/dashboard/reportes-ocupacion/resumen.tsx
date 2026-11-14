import type { ReporteOcupacion } from "@/lib/reportes/ocupacion/tipos";
import { formatoPorcentaje } from "./tabla";

export function ResumenOcupacion({ resumen }: { resumen: ReporteOcupacion["resumen"] }) {
  const tarjetas = [
    { titulo: "Ocupación del período", valor: formatoPorcentaje(resumen.promedio), destacado: true },
    { titulo: "Capacidad total", valor: resumen.capacidad.toLocaleString("es-AR") },
    { titulo: "Pasajes vendidos", valor: resumen.vendidos.toLocaleString("es-AR") },
    { titulo: "Asientos libres", valor: resumen.libres.toLocaleString("es-AR") },
  ];
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tarjetas.map(tarjeta => <div key={tarjeta.titulo} className={`rounded-2xl border p-5 shadow-sm ${tarjeta.destacado ? "border-primary/30 bg-primary/10" : "border-zinc-200 bg-background"}`}>
          <p className="text-sm text-zinc-600">{tarjeta.titulo}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-secondary">{tarjeta.valor}</p>
        </div>)}
      </div>
      <p className="mt-3 text-xs leading-5 text-zinc-500">
        {resumen.viajes} viajes incluidos · {resumen.cancelados} cancelados excluidos del resumen.
        {" "}Ocupación = pasajes vendidos ÷ capacidad total de las clases seleccionadas. Sólo cuentan pasajes pagados y no cancelados.
        {resumen.promedio === null && " No hay capacidad disponible para calcular el promedio."}
      </p>
    </div>
  );
}
