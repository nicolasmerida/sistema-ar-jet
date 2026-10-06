import type { ErroresAvion } from "./validacion";

export type AvionListado = {
  id: number;
  matricula: string;
  modelo: string;
  capacidadEconomy: number;
  capacidadPrimera: number;
  vuelosVigentes: number;
};

export type ResultadoAccionAvion =
  | { ok: true; mensaje: string }
  | { ok: false; mensaje: string; errores?: ErroresAvion };
