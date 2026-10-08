import type { DatosVuelo, ErroresVuelo } from "./validacion";

export type EstadoVuelo = "programado" | "cancelado" | "finalizado";
export type EstadoViaje = "programado" | "en_curso" | "demorado" | "cancelado" | "finalizado";

export type VueloListado = {
  id: number;
  numero: string;
  origen: string;
  destino: string;
  origenCiudad: string;
  destinoCiudad: string;
  horaSalida: string;
  horaLlegada: string;
  dias: number[];
  inicio: string;
  fin: string;
  estado: EstadoVuelo;
};

export type OpcionAeropuerto = { id: number; codigo: string; nombre: string; ciudad: string };

export type OpcionAvion = {
  id: number;
  matricula: string;
  modelo: string;
  capacidadEconomy: number;
  capacidadPrimera: number;
};

export type VueloEditable = { id: number; numero: string; datos: DatosVuelo };

export type ViajeDetalle = {
  id: number;
  partida: string;
  llegada: string;
  estado: EstadoViaje;
  avion: string;
  reservasActivas: number;
  /** Se calcula en el servidor para no depender del reloj del navegador. */
  yaSalio: boolean;
  motivoCancelacion: string | null;
  fechaCancelacion: string | null;
  /** Motivo por el que no se puede cancelar; null si se puede. */
  bloqueoCancelacion: string | null;
};

export type DetalleVuelo = VueloListado & {
  precioEconomy: string;
  precioPrimera: string;
  viajes: ViajeDetalle[];
};

export type ResultadoAccionVuelo =
  | { ok: true; mensaje: string }
  | { ok: false; mensaje: string; errores?: ErroresVuelo };
