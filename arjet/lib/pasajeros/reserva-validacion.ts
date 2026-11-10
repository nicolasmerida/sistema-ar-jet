export type ClaseReserva = "economy" | "primera";
export type DatosPasajero = { nombre: string; apellido: string; dni: string };
export type DatosReserva = { viaje: number; clase: ClaseReserva; pasajeros: DatosPasajero[] };
export type ErrorPasajero = Partial<Record<keyof DatosPasajero, string>>;
export type ErroresReserva = { clase?: string; pasajeros?: ErrorPasajero[]; mensaje?: string };

export const MAX_PASAJES_POR_TRANSACCION = 9;
export const MENSAJE_LIMITE_PASAJES = `No es posible comprar más de ${MAX_PASAJES_POR_TRANSACCION} pasajes por transacción`;

export function mensajeAsientosDisponibles(libres: number) {
  return libres === 1 ? "Solo queda 1 asiento disponible en esta clase" : `Solo quedan ${libres} asientos disponibles en esta clase`;
}

// US-25: la misma regla se aplica en la interfaz, en la server action y dentro de la transacción.
export function validarCantidadPasajes(cantidad: number, disponibles?: number): string | undefined {
  if (!Number.isInteger(cantidad) || cantidad < 1) return `Seleccioná una cantidad de pasajes entre 1 y ${MAX_PASAJES_POR_TRANSACCION}`;
  if (cantidad > MAX_PASAJES_POR_TRANSACCION) return MENSAJE_LIMITE_PASAJES;
  if (disponibles !== undefined && cantidad > disponibles) return mensajeAsientosDisponibles(disponibles);
}

export function normalizarPasajero(datos: DatosPasajero): DatosPasajero {
  return { nombre: datos.nombre.trim(), apellido: datos.apellido.trim(), dni: datos.dni.replace(/[.\s-]/g, "").toUpperCase() };
}

export function leerReserva(entrada: unknown): DatosReserva | null {
  if (!entrada || typeof entrada !== "object") return null;
  const datos = entrada as Record<string, unknown>;
  if (!Number.isSafeInteger(datos.viaje) || Number(datos.viaje) <= 0 ||
    (datos.clase !== "economy" && datos.clase !== "primera") || !Array.isArray(datos.pasajeros)) return null;
  const pasajeros: DatosPasajero[] = [];
  for (const pasajero of datos.pasajeros) {
    if (!pasajero || typeof pasajero !== "object" ||
      typeof pasajero.nombre !== "string" || typeof pasajero.apellido !== "string" || typeof pasajero.dni !== "string") return null;
    pasajeros.push(normalizarPasajero(pasajero));
  }
  return { viaje: Number(datos.viaje), clase: datos.clase, pasajeros };
}

export function validarPasajeros(pasajeros: DatosPasajero[]): ErroresReserva {
  if (!pasajeros.length) return { mensaje: "Agregá al menos un pasajero" };
  const documentos = new Set<string>();
  const errores = pasajeros.map((entrada) => {
    const pasajero = normalizarPasajero(entrada);
    const error: ErrorPasajero = {};
    for (const campo of ["nombre", "apellido"] as const) {
      if (!pasajero[campo]) error[campo] = "Este campo es obligatorio";
      else if (pasajero[campo].length > 100 || !/^[\p{L}\p{M}][\p{L}\p{M} '\u2019-]*$/u.test(pasajero[campo])) error[campo] = "Ingresá un nombre válido (hasta 100 caracteres)";
    }
    if (!/^[A-Z0-9]{6,20}$/.test(pasajero.dni)) error.dni = "El documento debe tener entre 6 y 20 caracteres alfanuméricos";
    else if (documentos.has(pasajero.dni)) error.dni = "No se puede repetir un pasajero en la misma reserva";
    documentos.add(pasajero.dni);
    return error;
  });
  return errores.some((error) => Object.keys(error).length) ? { pasajeros: errores } : {};
}
