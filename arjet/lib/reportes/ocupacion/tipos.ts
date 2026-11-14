import type { EstadoViaje } from "@/lib/vuelos/tipos";

export type FiltrosOcupacion = { vuelo: string; clase: string; desde: string; hasta: string };
export type ErroresFiltros = Partial<Record<keyof FiltrosOcupacion, string>>;
export type FiltrosValidos = { vuelo: number | null; clase: "ambas" | "economy" | "primera"; desde: string; hasta: string };
export type OpcionVuelo = { id: number; etiqueta: string };

export type ViajeOcupacion = {
  id_viaje: number;
  fecha_partida: Date;
  estado: EstadoViaje;
  numero: string;
  origen: string;
  destino: string;
  capacidad_economy: number;
  capacidad_primera: number;
  vendidos_economy: number;
  vendidos_primera: number;
};

export type FilaOcupacion = {
  viaje: number;
  fecha: string;
  vuelo: string;
  ruta: string;
  estado: EstadoViaje;
  clase: "economy" | "primera";
  capacidad: number;
  vendidos: number;
  libres: number;
  porcentaje: number | null;
};

export type ReporteOcupacion = {
  filas: FilaOcupacion[];
  resumen: { viajes: number; cancelados: number; capacidad: number; vendidos: number; libres: number; promedio: number | null };
};

export type ResultadoOcupacion =
  | { ok: true; reporte: ReporteOcupacion }
  | { ok: false; mensaje: string; errores?: ErroresFiltros };

export const SIN_PERMISOS = "No tiene permisos para acceder a esta sección";
export const ERROR_REPORTE = "No se pudo generar el reporte. Por favor, reintentá más tarde.";
