export const ANTICIPACION_CANCELACION_PASAJE_MS = 24 * 60 * 60 * 1000;
export const FUERA_DE_PLAZO = "No es posible cancelar un pasaje con menos de un día de anticipación";

export function bloqueoCancelacionPasaje(pasaje: {
  cancelado: boolean; estadoCompra: string; estadoViaje: string; partida: Date;
}, ahora = new Date()): string | null {
  if (pasaje.cancelado || pasaje.estadoCompra === "cancelado" || pasaje.estadoCompra === "reembolsado") return "El pasaje ya está cancelado";
  if (!["pendiente", "pagado"].includes(pasaje.estadoCompra)) return "La compra no admite cancelación";
  if (pasaje.partida.getTime() - ahora.getTime() < ANTICIPACION_CANCELACION_PASAJE_MS) return FUERA_DE_PLAZO;
  if (!["programado", "demorado"].includes(pasaje.estadoViaje)) return "El vuelo no admite cancelación de pasajes";
  return null;
}
