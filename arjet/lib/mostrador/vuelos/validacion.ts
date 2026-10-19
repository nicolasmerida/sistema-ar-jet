import type { FiltrosVuelos } from "./tipos";

export type FiltrosValidos = {
  /** Día a consultar (AAAA-MM-DD, hora de Argentina). */
  fecha: string;
  origen: number | null;
  destino: number | null;
  /** Número de vuelo ya normalizado (ej. "AN 824"), o null si no se filtra por número. */
  numero: string | null;
};

export type ResultadoValidacion =
  | { ok: true; filtros: FiltrosValidos }
  | { ok: false; campo: keyof FiltrosVuelos; mensaje: string };

const LARGO_MAXIMO_NUMERO = 12;

/** "an-824", "AN824" y "AN 824" se buscan igual que el formato guardado: "AN 824". */
export function normalizarNumeroBusqueda(texto: string) {
  const limpio = texto.toUpperCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return limpio.replace(/^([A-Z][A-Z0-9])(\d)/, "$1 $2");
}

function texto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}

function fechaValida(fecha: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const instante = new Date(`${fecha}T00:00:00Z`);
  return Number.isFinite(instante.getTime()) && instante.toISOString().slice(0, 10) === fecha;
}

function idOpcional(valor: string) {
  if (!valor) return null;
  const id = Number(valor);
  return /^[1-9]\d*$/.test(valor) && Number.isSafeInteger(id) ? id : undefined;
}

export function validarFiltros(entrada: unknown): ResultadoValidacion {
  const datos = typeof entrada === "object" && entrada !== null ? (entrada as Record<string, unknown>) : {};
  const fecha = texto(datos.fecha);
  const origen = texto(datos.origen);
  const destino = texto(datos.destino);
  const numero = texto(datos.numero);

  if (!fechaValida(fecha)) return { ok: false, campo: "fecha", mensaje: "Seleccioná una fecha válida" };

  const idOrigen = idOpcional(origen);
  if (idOrigen === undefined) return { ok: false, campo: "origen", mensaje: "Seleccioná un aeropuerto de origen válido" };
  const idDestino = idOpcional(destino);
  if (idDestino === undefined) return { ok: false, campo: "destino", mensaje: "Seleccioná un aeropuerto de destino válido" };
  if (idOrigen !== null && idOrigen === idDestino) {
    return { ok: false, campo: "destino", mensaje: "El origen y el destino deben ser distintos" };
  }

  if (numero && (numero.length > LARGO_MAXIMO_NUMERO || !/^[A-Za-z0-9 _-]+$/.test(numero))) {
    return { ok: false, campo: "numero", mensaje: "El número de vuelo solo admite letras, números y guiones (ej. AN-824)" };
  }

  return {
    ok: true,
    filtros: { fecha, origen: idOrigen, destino: idDestino, numero: numero ? normalizarNumeroBusqueda(numero) : null },
  };
}
