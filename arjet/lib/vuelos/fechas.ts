// Fechas y horarios de vuelos. Los horarios se cargan en hora local de
// Argentina, que no tiene horario de verano (UTC-3 todo el año).

export const ZONA_HORARIA = "America/Argentina/Buenos_Aires";
const DESFASE_ARGENTINA = "-03:00";

/** Días de operación con numeración ISO: 1 = lunes ... 7 = domingo. */
export const DIAS_SEMANA = [
  { valor: 1, corto: "Lun", largo: "Lunes" },
  { valor: 2, corto: "Mar", largo: "Martes" },
  { valor: 3, corto: "Mié", largo: "Miércoles" },
  { valor: 4, corto: "Jue", largo: "Jueves" },
  { valor: 5, corto: "Vie", largo: "Viernes" },
  { valor: 6, corto: "Sáb", largo: "Sábado" },
  { valor: 7, corto: "Dom", largo: "Domingo" },
] as const;

/** Fecha de hoy en Argentina, en formato AAAA-MM-DD. */
export function hoyEnArgentina(ahora = new Date()) {
  return fechaLocal(ahora);
}

/** Fecha local (AAAA-MM-DD) de un instante, vista desde Argentina. */
export function fechaLocal(instante: Date) {
  return instante.toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA });
}

/** Instante de una fecha local (AAAA-MM-DD) a una hora local (HH:MM). */
export function instanteLocal(fecha: string, hora: string) {
  return new Date(`${fecha}T${hora}:00${DESFASE_ARGENTINA}`);
}

/** Recorre el período [inicio, fin] y devuelve las fechas que caen en los días indicados. */
export function fechasDeOperacion(inicio: string, fin: string, dias: number[]) {
  const fechas: string[] = [];
  const hasta = new Date(`${fin}T00:00:00Z`);
  for (let dia = new Date(`${inicio}T00:00:00Z`); dia <= hasta; dia.setUTCDate(dia.getUTCDate() + 1)) {
    const diaIso = dia.getUTCDay() === 0 ? 7 : dia.getUTCDay();
    if (dias.includes(diaIso)) fechas.push(dia.toISOString().slice(0, 10));
  }
  return fechas;
}

export function diasEntre(inicio: string, fin: string) {
  return Math.round((Date.parse(`${fin}T00:00:00Z`) - Date.parse(`${inicio}T00:00:00Z`)) / 86_400_000);
}

// Prisma representa las columnas DATE y TIME como Date en UTC.
export function fechaDeColumna(valor: Date) {
  return valor.toISOString().slice(0, 10);
}

export function horaDeColumna(valor: Date) {
  return valor.toISOString().slice(11, 16);
}

export function columnaFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00Z`);
}

export function columnaHora(hora: string) {
  return new Date(`1970-01-01T${hora}:00Z`);
}
