export const MENSAJE_CHECKIN_EXITO = "Check-in registrado correctamente";
export const MENSAJE_TICKET_INVALIDO = "El ticket no es válido";
export const MENSAJE_VUELO_CANCELADO = "El vuelo fue cancelado";
export const MENSAJE_YA_PRESENTADO = "El pasajero ya realizó el check-in";
export const MENSAJE_ERROR_CHECKIN =
  "No se pudo registrar el check-in. Por favor, reintentá más tarde.";

export function bloqueoCheckinPasaje(pasaje: {
  cancelado: boolean;
  presentado: boolean;
  estadoCompra: string;
  estadoViaje: string;
}): string | null {
  if (pasaje.estadoViaje === "cancelado") {
    return MENSAJE_VUELO_CANCELADO;
  }
  if (pasaje.presentado) {
    return MENSAJE_YA_PRESENTADO;
  }
  if (
    pasaje.cancelado ||
    pasaje.estadoCompra !== "pagado" ||
    pasaje.estadoViaje === "finalizado"
  ) {
    return MENSAJE_TICKET_INVALIDO;
  }
  return null;
}

