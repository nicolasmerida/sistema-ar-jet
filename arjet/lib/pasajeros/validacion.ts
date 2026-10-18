import { hoyEnArgentina } from "../vuelos/fechas";

export type DatosBusqueda = { origen: string; destino: string; fecha: string };
export type ErroresBusqueda = Partial<Record<keyof DatosBusqueda, string>>;

export function validarBusqueda(datos: DatosBusqueda, hoy = hoyEnArgentina()): ErroresBusqueda {
  const errores: ErroresBusqueda = {};
  for (const campo of ["origen", "destino"] as const) {
    if (!/^[1-9]\d*$/.test(datos[campo]) || !Number.isSafeInteger(Number(datos[campo]))) {
      errores[campo] = `Seleccioná el aeropuerto de ${campo}`;
    }
  }
  if (datos.origen && datos.origen === datos.destino) errores.destino = "El origen y el destino deben ser distintos";
  const fecha = new Date(`${datos.fecha}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha) || !Number.isFinite(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== datos.fecha) {
    errores.fecha = "Seleccioná una fecha válida";
  } else if (datos.fecha < hoy) errores.fecha = "La fecha no puede ser anterior a la actual";
  return errores;
}

export function asientosDisponibles(capacidad: number, ocupados: number) {
  return Math.max(0, capacidad - ocupados);
}
