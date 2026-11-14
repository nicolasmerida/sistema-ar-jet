import type { ErroresFiltros, FiltrosValidos } from "./tipos";

function texto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}

function fechaValida(fecha: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha < "0001-01-01") return false;
  const instante = new Date(`${fecha}T00:00:00Z`);
  return Number.isFinite(instante.getTime()) && instante.toISOString().slice(0, 10) === fecha;
}

export function validarFiltrosOcupacion(entrada: unknown):
  | { ok: true; filtros: FiltrosValidos }
  | { ok: false; errores: ErroresFiltros } {
  const datos = typeof entrada === "object" && entrada !== null ? entrada as Record<string, unknown> : {};
  const desde = texto(datos.desde);
  const hasta = texto(datos.hasta);
  const vuelo = texto(datos.vuelo);
  const clase = texto(datos.clase);
  const errores: ErroresFiltros = {};
  if (!fechaValida(desde)) errores.desde = "Seleccioná una fecha desde válida";
  if (!fechaValida(hasta)) errores.hasta = "Seleccioná una fecha hasta válida";
  if (!errores.desde && !errores.hasta && desde > hasta) {
    errores.desde = "Desde no puede ser posterior a hasta";
    errores.hasta = "Hasta no puede ser anterior a desde";
  }
  const id = vuelo === "" ? null : Number(vuelo);
  if (id !== null && (!/^[1-9]\d*$/.test(vuelo) || !Number.isSafeInteger(id) || id > 2147483647)) {
    errores.vuelo = "Seleccioná un vuelo válido";
  }
  if (clase !== "ambas" && clase !== "economy" && clase !== "primera") errores.clase = "Seleccioná una clase válida";
  if (Object.keys(errores).length) return { ok: false, errores };
  return { ok: true, filtros: { desde, hasta, vuelo: id, clase: clase as FiltrosValidos["clase"] } };
}
