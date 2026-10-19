import type { EstadoViaje } from "@/lib/vuelos/tipos";

export const MENSAJE_SIN_VUELOS = "No hay vuelos para los filtros seleccionados";

/** Valores tal como los edita el formulario (todo texto). */
export type FiltrosVuelos = {
  fecha: string;
  origen: string;
  destino: string;
  numero: string;
};

export type Ocupacion = { ocupados: number; capacidad: number; porcentaje: number };

export type VueloEnEstado = {
  id: number;
  numero: string;
  origen: { codigo_iata: string; ciudad: string };
  destino: { codigo_iata: string; ciudad: string };
  partida: string;
  llegada: string;
  /** Estado actual: tiene en cuenta la hora (en curso / finalizado) además del registrado. */
  estado: EstadoViaje;
  /** Motivo registrado cuando el viaje está demorado o cancelado. */
  motivo: string | null;
  economy: Ocupacion;
  primera: Ocupacion;
};

export type ResultadoEstadoVuelos =
  | { ok: true; vuelos: VueloEnEstado[]; hayMas: boolean; consultadoEn: string }
  | { ok: false; mensaje: string; campo?: keyof FiltrosVuelos };
