import type { EstadoViaje } from "@/lib/vuelos/tipos";

/**
 * Estado que ve el empleado. Cancelado y finalizado se respetan tal como están
 * registrados; en los demás casos se tiene en cuenta la hora, porque nada
 * actualiza solo el estado guardado cuando el vuelo sale o aterriza.
 * Un vuelo demorado que todavía no salió sigue figurando como demorado.
 */
export function estadoActual(estado: EstadoViaje, partida: Date, llegada: Date, ahora = new Date()): EstadoViaje {
  if (estado === "cancelado" || estado === "finalizado") return estado;
  if (ahora >= llegada) return "finalizado";
  if (ahora >= partida) return "en_curso";
  return estado;
}

export function porcentajeOcupacion(ocupados: number, capacidad: number) {
  if (capacidad <= 0) return 0;
  return Math.min(100, Math.round((ocupados / capacidad) * 100));
}
