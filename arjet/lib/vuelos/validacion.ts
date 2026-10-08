// Validación compartida entre el formulario (cliente) y las server actions.
import { diasEntre } from "./fechas";

export type DatosVuelo = {
  numero: string;
  horaSalida: string;
  horaLlegada: string;
  origen: string;
  destino: string;
  dias: number[];
  inicio: string;
  fin: string;
  avion: string;
  precioEconomy: string;
  precioPrimera: string;
};

export type ErroresVuelo = Partial<Record<keyof DatosVuelo, string>>;

/** En la edición la ruta, los días y la vigencia quedan fijos: definen los viajes ya generados. */
export type ModoFormulario = "crear" | "editar";

export const LARGO_MAXIMO_MOTIVO = 500;
const VIGENCIA_MAXIMA_DIAS = 366;
const PRECIO_MAXIMO = 99_999_999.99;

export function normalizarNumeroVuelo(numero: string) {
  // "an520" y "AN  520" se guardan como "AN 520".
  const compacto = numero.toUpperCase().replace(/\s+/g, "");
  const partes = /^([A-Z0-9]{2})(\d{1,4})$/.exec(compacto);
  return partes ? `${partes[1]} ${partes[2]}` : numero.trim().toUpperCase();
}

export function validarVuelo(datos: DatosVuelo, modo: ModoFormulario, hoy: string): ErroresVuelo {
  const errores: ErroresVuelo = {};

  validarHorarios(datos, errores);
  if (!datos.avion) errores.avion = "Seleccioná el avión asignado";
  validarPrecio(datos.precioEconomy, "precioEconomy", errores);
  validarPrecio(datos.precioPrimera, "precioPrimera", errores);
  if (modo === "editar") return errores;

  if (!datos.numero.trim()) errores.numero = "El número de vuelo es obligatorio";
  else if (!/^[A-Z0-9]{2} \d{1,4}$/.test(normalizarNumeroVuelo(datos.numero)))
    errores.numero = "Usá el formato de 2 letras y hasta 4 números (ej. AN 520)";

  if (!datos.origen) errores.origen = "Seleccioná el aeropuerto de origen";
  if (!datos.destino) errores.destino = "Seleccioná el aeropuerto de destino";
  else if (datos.origen && datos.origen === datos.destino)
    errores.destino = "El aeropuerto de origen y el de destino deben ser distintos";

  if (datos.dias.length === 0) errores.dias = "Debe seleccionar al menos un día de operación";

  if (!esFecha(datos.inicio)) errores.inicio = "La fecha de inicio es obligatoria";
  else if (datos.inicio < hoy) errores.inicio = "La fecha de inicio no puede ser pasada";
  if (!esFecha(datos.fin)) errores.fin = "La fecha de fin es obligatoria";
  else if (esFecha(datos.inicio) && datos.fin < datos.inicio)
    errores.fin = "La fecha de fin no puede ser anterior a la de inicio";
  else if (esFecha(datos.inicio) && diasEntre(datos.inicio, datos.fin) > VIGENCIA_MAXIMA_DIAS)
    errores.fin = "La vigencia no puede superar un año";

  return errores;
}

export function validarMotivo(motivo: string) {
  const limpio = motivo.trim();
  if (!limpio) return "El motivo de la cancelación es obligatorio";
  if (limpio.length > LARGO_MAXIMO_MOTIVO) return `Máximo ${LARGO_MAXIMO_MOTIVO} caracteres`;
  return undefined;
}

export function tieneErrores(errores: ErroresVuelo) {
  return Object.keys(errores).length > 0;
}

function validarHorarios(datos: DatosVuelo, errores: ErroresVuelo) {
  if (!esHora(datos.horaSalida)) errores.horaSalida = "La hora de salida es obligatoria";
  if (!esHora(datos.horaLlegada)) errores.horaLlegada = "La hora de llegada es obligatoria";
  else if (esHora(datos.horaSalida) && datos.horaLlegada <= datos.horaSalida)
    errores.horaLlegada = "La hora de llegada debe ser posterior a la de salida";
}

function validarPrecio(valor: string, campo: "precioEconomy" | "precioPrimera", errores: ErroresVuelo) {
  const limpio = valor.trim();
  if (!limpio) errores[campo] = "El precio es obligatorio";
  else if (!/^\d+(\.\d{1,2})?$/.test(limpio) || Number(limpio) > PRECIO_MAXIMO)
    errores[campo] = "Ingresá un precio válido, sin negativos y con hasta 2 decimales";
}

function esFecha(valor: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(Date.parse(`${valor}T00:00:00Z`));
}

function esHora(valor: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);
}
