import { DIAS_SEMANA, ZONA_HORARIA } from "@/lib/vuelos/fechas";
import type { EstadoViaje, EstadoVuelo } from "@/lib/vuelos/tipos";

export const ETIQUETAS_ESTADO: Record<EstadoVuelo | EstadoViaje, string> = {
  programado: "Programado",
  en_curso: "En curso",
  demorado: "Demorado",
  cancelado: "Cancelado",
  finalizado: "Finalizado",
};

/** "2026-10-01" -> "01/10/2026" */
export function fechaCorta(fecha: string) {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

export function diasDeOperacion(dias: number[]) {
  if (dias.length === 7) return "Todos los días";
  return DIAS_SEMANA.filter((dia) => dias.includes(dia.valor))
    .map((dia) => dia.corto)
    .join(" · ");
}

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA_HORARIA,
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const formatoHora = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA_HORARIA,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Fecha local de un instante ISO, ej. "mié, 25/11/2026". */
export function fechaDeInstante(instante: string) {
  return formatoFecha.format(new Date(instante));
}

export function horaDeInstante(instante: string) {
  return formatoHora.format(new Date(instante));
}

const formatoPrecio = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export function precio(valor: string) {
  return formatoPrecio.format(Number(valor));
}
