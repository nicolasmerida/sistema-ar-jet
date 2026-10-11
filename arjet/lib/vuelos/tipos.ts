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
  llegaDiaSiguiente: boolean;
  dias: number[];
  inicio: string;
  fin: string;
  estado: EstadoVuelo;
  origenDeBaja: boolean;
  destinoDeBaja: boolean;
  /** Motivo del último viaje cuando el vuelo quedó cancelado (por ejemplo, por una baja). */
  motivoCancelacion: string | null;
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
  avionDeBaja: boolean;
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

// Baja lógica de aeropuertos y aviones (cancela sus viajes pendientes).

export type EstadoRegistro = "activo" | "de_baja";

/** Viaje en pie que no se puede cancelar y por eso impide la baja. */
export type ViajeBloqueante = { numero: string; partida: string; motivo: string };

export type ResumenBaja = { vuelos: number; viajes: number; reservas: number; bloqueantes: ViajeBloqueante[] };

export type ResultadoResumenBaja = { ok: true; resumen: ResumenBaja } | { ok: false; mensaje: string };

export type ResultadoBaja =
  | { ok: true; mensaje: string }
  | { ok: false; mensaje: string; bloqueantes?: ViajeBloqueante[] };
