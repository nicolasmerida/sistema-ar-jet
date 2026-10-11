import type { EstadoRegistro, EstadoViaje } from "@/lib/vuelos/tipos";
import type { ErroresAvion } from "./validacion";

export type AvionListado = {
  id: number;
  matricula: string;
  modelo: string;
  capacidadEconomy: number;
  capacidadPrimera: number;
  estado: EstadoRegistro;
  fechaBaja: string | null;
  /** Viajes pendientes (por salir y sin cancelar) asignados al avión. */
  vuelosVigentes: number;
};

export type ViajeDeAvion = {
  id: number;
  idVuelo: number;
  numero: string;
  origen: string;
  destino: string;
  partida: string;
  llegada: string;
  estado: EstadoViaje;
  motivoCancelacion: string | null;
};

export type DetalleAvion = Omit<AvionListado, "vuelosVigentes"> & {
  /** Todos los viajes que tuvo asignados, del más reciente al más antiguo. */
  viajes: ViajeDeAvion[];
};

export type ResultadoAccionAvion =
  | { ok: true; mensaje: string }
  | { ok: false; mensaje: string; errores?: ErroresAvion };
