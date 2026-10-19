import { CRITERIOS, FILTROS_ESTADO } from "./tipos";
import type { Criterio, FiltroEstado } from "./tipos";

export const LARGO_MAXIMO_VALOR = 100;
const MAXIMO_PALABRAS_NOMBRE = 4;

export type BusquedaValida =
  | { criterio: "dni"; dni: string; filtro: FiltroEstado }
  | { criterio: "nombre"; palabras: string[]; filtro: FiltroEstado }
  | { criterio: "codigo"; codigo: number; filtro: FiltroEstado };

export type ResultadoValidacion =
  | { ok: true; busqueda: BusquedaValida }
  | { ok: false; mensaje: string; campo: "criterio" | "valor" };

// Mismo criterio que el alta de pasajeros: se ignoran puntos, espacios y guiones.
export function normalizarDni(valor: string) {
  return valor.replace(/[.\s-]/g, "").toUpperCase();
}

export function validarBusqueda(criterio: unknown, valor: unknown, filtro: unknown): ResultadoValidacion {
  if (typeof criterio !== "string" || !(CRITERIOS as readonly string[]).includes(criterio)) {
    return { ok: false, campo: "criterio", mensaje: "Seleccioná un criterio de búsqueda válido" };
  }
  if (typeof filtro !== "string" || !(FILTROS_ESTADO as readonly string[]).includes(filtro)) {
    return { ok: false, campo: "criterio", mensaje: "Seleccioná un filtro de estado válido" };
  }
  const texto = typeof valor === "string" ? valor.trim() : "";
  if (!texto) return { ok: false, campo: "valor", mensaje: "Ingresá un valor para buscar" };
  if (texto.length > LARGO_MAXIMO_VALOR) {
    return { ok: false, campo: "valor", mensaje: `El valor no puede superar los ${LARGO_MAXIMO_VALOR} caracteres` };
  }

  const tipo = criterio as Criterio;
  const estado = filtro as FiltroEstado;

  if (tipo === "dni") {
    const dni = normalizarDni(texto);
    if (!/^[A-Z0-9]{6,20}$/.test(dni)) {
      return { ok: false, campo: "valor", mensaje: "El DNI debe tener entre 6 y 20 caracteres alfanuméricos" };
    }
    return { ok: true, busqueda: { criterio: "dni", dni, filtro: estado } };
  }

  if (tipo === "codigo") {
    const coincidencia = /^(?:RES-?)?(\d{1,10})$/i.exec(texto);
    const codigo = coincidencia ? Number(coincidencia[1]) : NaN;
    if (!Number.isSafeInteger(codigo) || codigo <= 0) {
      return { ok: false, campo: "valor", mensaje: "El código de reserva debe ser un número (por ejemplo 1024 o RES-1024)" };
    }
    return { ok: true, busqueda: { criterio: "codigo", codigo, filtro: estado } };
  }

  const palabras = texto.split(/\s+/).filter(Boolean);
  if (palabras.length > MAXIMO_PALABRAS_NOMBRE) {
    return { ok: false, campo: "valor", mensaje: "Ingresá como máximo nombre y apellido" };
  }
  return { ok: true, busqueda: { criterio: "nombre", palabras, filtro: estado } };
}
