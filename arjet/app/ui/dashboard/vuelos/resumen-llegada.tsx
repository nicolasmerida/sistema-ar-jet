import { DIAS_SEMANA, diaSiguiente } from "@/lib/vuelos/fechas";
import { type DatosVuelo, errorLlegada, esHora } from "@/lib/vuelos/validacion";

function nombreDia(valor: number) {
  return DIAS_SEMANA.find((dia) => dia.valor === valor)?.corto ?? "";
}

/** "Sale Mar 23:30 → llega Mié 02:00", por cada día de operación marcado. */
export function ResumenLlegada({ datos }: { datos: DatosVuelo }) {
  const { horaSalida, horaLlegada, llegaDiaSiguiente, dias } = datos;
  if (dias.length === 0 || !esHora(horaSalida) || errorLlegada(datos)) return null;

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500" aria-label="Días de salida y llegada">
      {dias.map((dia) => (
        <li key={dia}>
          Sale {nombreDia(dia)} {horaSalida} → llega{" "}
          <span className={llegaDiaSiguiente ? "font-medium text-foreground" : undefined}>
            {nombreDia(llegaDiaSiguiente ? diaSiguiente(dia) : dia)} {horaLlegada}
          </span>
        </li>
      ))}
    </ul>
  );
}
