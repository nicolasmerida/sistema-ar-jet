import { ZONA_HORARIA } from "@/lib/vuelos/fechas";

const moneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
export const dinero = (valor: string | number) => moneda.format(Number(valor));
export const fechaHora = (valor: string) => new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short", timeStyle: "short", timeZone: ZONA_HORARIA,
}).format(new Date(valor));
