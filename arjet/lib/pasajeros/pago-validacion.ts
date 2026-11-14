import { hoyEnArgentina } from "@/lib/vuelos/fechas";

export type DatosPago = { titular: string; numero: string; vencimiento: string; seguridad: string };
export type ErroresPago = Partial<Record<keyof DatosPago, string>>;
export const MENSAJE_PAGO_RECHAZADO = "El pago fue rechazado. Verifique los datos o utilice otro medio de pago";
export const MENSAJE_SIN_ASIENTOS_PAGO = "Los asientos seleccionados ya no están disponibles";

export function leerDatosPago(entrada: unknown): DatosPago {
  const valor = entrada && typeof entrada === "object" ? entrada as Record<string, unknown> : {};
  const campo = (nombre: keyof DatosPago) => typeof valor[nombre] === "string" ? valor[nombre].slice(0, 120).trim() : "";
  return { titular: campo("titular"), numero: campo("numero").replace(/[ -]/g, ""), vencimiento: campo("vencimiento"), seguridad: campo("seguridad") };
}

function cumpleLuhn(numero: string) {
  let suma = 0;
  let duplicar = false;
  for (let i = numero.length - 1; i >= 0; i--) {
    let digito = Number(numero[i]);
    if (duplicar) { digito *= 2; if (digito > 9) digito -= 9; }
    suma += digito;
    duplicar = !duplicar;
  }
  return suma % 10 === 0;
}

export function validarPago(entrada: DatosPago, hoy = hoyEnArgentina()): ErroresPago {
  const datos = leerDatosPago(entrada);
  const errores: ErroresPago = {};
  if (datos.titular.length < 2 || datos.titular.length > 100 || !/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(datos.titular)) errores.titular = "Ingresá el nombre y apellido del titular";
  if (!/^\d{13,19}$/.test(datos.numero) || /^(\d)\1+$/.test(datos.numero) || !cumpleLuhn(datos.numero)) errores.numero = "Ingresá un número de tarjeta válido";
  const partes = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(datos.vencimiento);
  if (!partes) errores.vencimiento = "Ingresá el vencimiento en formato MM/AA";
  else if (`20${partes[2]}-${partes[1]}` < hoy.slice(0, 7)) errores.vencimiento = "La tarjeta está vencida";
  if (!/^\d{3,4}$/.test(datos.seguridad)) errores.seguridad = "Ingresá un código de seguridad de 3 o 4 dígitos";
  return errores;
}

/** Simulación determinista: esta tarjeta ficticia válida se configura para rechazar. */
export function autorizarTarjetaSimulada(datos: DatosPago) {
  return { autorizada: datos.numero !== "4000000000000002", ultimos4: datos.numero.slice(-4) };
}
