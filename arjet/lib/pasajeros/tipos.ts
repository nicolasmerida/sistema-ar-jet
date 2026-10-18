import type { ErroresBusqueda } from "./validacion";

export type VueloDisponible = {
  id: number;
  numero: string;
  origen: string;
  destino: string;
  origenCiudad: string;
  destinoCiudad: string;
  partida: string;
  llegada: string;
  demorado: boolean;
  economy: { precio: string; disponibles: number };
  primera: { precio: string; disponibles: number };
};

export type ResultadoBusqueda =
  | { ok: true; vuelos: VueloDisponible[]; fecha: string }
  | { ok: false; mensaje: string; errores?: ErroresBusqueda };
