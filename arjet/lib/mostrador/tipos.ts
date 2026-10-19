export const CRITERIOS = ["dni", "nombre", "codigo"] as const;
export type Criterio = (typeof CRITERIOS)[number];

export const ETIQUETA_CRITERIO: Record<Criterio, string> = {
  dni: "DNI",
  nombre: "Nombre y apellido",
  codigo: "Código de reserva",
};

export const FILTROS_ESTADO = ["pendientes", "todas"] as const;
export type FiltroEstado = (typeof FILTROS_ESTADO)[number];

export type EntradaBusqueda = {
  criterio: Criterio;
  valor: string;
  filtro: FiltroEstado;
};

export type PasajeEncontrado = {
  id: number;
  cancelado: boolean;
  clase: string;
  pasajero: { dni: string; nombre: string; apellido: string };
  numero: string;
  partida: string;
  llegada: string;
  origen: { codigo_iata: string; ciudad: string };
  destino: { codigo_iata: string; ciudad: string };
  estadoViaje: string;
};

export type ReservaEncontrada = {
  codigo: number;
  modalidad: string | null;
  estado: string;
  titular: { dni: string; nombre: string; apellido: string };
  pasajes: PasajeEncontrado[];
};

export type ResultadoBusqueda =
  | { ok: true; reservas: ReservaEncontrada[]; hayMas: boolean }
  | { ok: false; mensaje: string; campo?: "criterio" | "valor" };
