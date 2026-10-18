export function rutaReserva(viaje: number, clase: string) {
  return `/vuelos/reservar?viaje=${viaje}&clase=${clase === "primera" ? "primera" : "economy"}`;
}

/** Solo permite continuar una selección de reserva; nunca redirige a un dominio externo. */
export function retornoReserva(entrada: unknown): string | undefined {
  if (typeof entrada !== "string") return;
  try {
    const url = new URL(entrada, "http://localhost");
    const viaje = Number(url.searchParams.get("viaje"));
    const clase = url.searchParams.get("clase");
    if (url.pathname !== "/vuelos/reservar" || !Number.isSafeInteger(viaje) || viaje <= 0 || (clase !== "economy" && clase !== "primera")) return;
    return rutaReserva(viaje, clase);
  } catch { return; }
}
