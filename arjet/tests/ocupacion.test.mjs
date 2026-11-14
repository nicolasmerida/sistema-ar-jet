import assert from "node:assert/strict";
import { test } from "node:test";
import { cargar } from "./modulos.mjs";

const tipos = cargar("lib/reportes/ocupacion/tipos.ts");
const { validarFiltrosOcupacion: validar } = cargar("lib/reportes/ocupacion/validacion.ts");
const { calcularReporte } = cargar("lib/reportes/ocupacion/calculos.ts");
const fechas = cargar("lib/vuelos/fechas.ts");
const filtros = { vuelo: "", clase: "ambas", desde: "2026-11-01", hasta: "2026-11-30" };
function viaje(cambios = {}) {
  return { id_viaje: 1, fecha_partida: new Date("2026-11-14T03:00:00Z"), estado: "programado", numero: "AR 101", origen: "AEP", destino: "COR", capacidad_economy: 100, capacidad_primera: 20, vendidos_economy: 50, vendidos_primera: 5, ...cambios };
}

test("fechas obligatorias, reales e inclusivas; admite un solo día y años bisiestos", () => {
  for (const entrada of [null, {}, { ...filtros, desde: "" }, { ...filtros, hasta: "" }, { ...filtros, desde: "2026-02-30" }, { ...filtros, hasta: "2026-02-29" }]) assert.equal(validar(entrada).ok, false);
  const invertido = validar({ ...filtros, desde: "2026-12-01" });
  assert.ok(invertido.errores.desde && invertido.errores.hasta);
  assert.equal(validar({ ...filtros, desde: "2028-02-29", hasta: "2028-02-29" }).ok, true);
  assert.equal(validar({ ...filtros, hasta: filtros.desde }).ok, true);
});

test("valida las tres clases y el ID de vuelo; Todos se representa con null", () => {
  for (const clase of ["ambas", "economy", "primera"]) assert.equal(validar({ ...filtros, clase }).ok, true);
  assert.equal(validar({ ...filtros, clase: "business" }).ok, false);
  assert.equal(validar(filtros).filtros.vuelo, null);
  assert.equal(validar({ ...filtros, vuelo: "42" }).filtros.vuelo, 42);
  for (const vuelo of ["0", "-1", "1.5", "1 OR 1=1", "2147483648"]) assert.equal(validar({ ...filtros, vuelo }).ok, false);
});

test("capacidad y ventas se separan por clase y conservan los viajes sin ventas", () => {
  const reporte = calcularReporte([viaje(), viaje({ id_viaje: 2, vendidos_economy: 0, vendidos_primera: 0 })], "ambas");
  assert.equal(reporte.filas.length, 4);
  assert.equal(reporte.filas[0].libres, 50);
  assert.equal(reporte.filas[0].porcentaje, 50);
  assert.equal(reporte.filas[1].libres, 15);
  assert.equal(reporte.filas[1].porcentaje, 25);
  assert.equal(reporte.filas[2].porcentaje, 0);
  for (const clase of ["economy", "primera"]) assert.ok(calcularReporte([viaje()], clase).filas.every(f => f.clase === clase));
});

test("el promedio pondera la capacidad, excluye cancelados y respeta la clase", () => {
  const viajes = [viaje({ capacidad_economy: 100, vendidos_economy: 100 }), viaje({ id_viaje: 2, capacidad_economy: 300, vendidos_economy: 0 }), viaje({ id_viaje: 3, estado: "cancelado", capacidad_economy: 1000, vendidos_economy: 999 })];
  const r = calcularReporte(viajes, "economy");
  assert.equal(r.filas.length, 3);
  assert.equal(r.filas[2].estado, "cancelado");
  assert.equal(r.resumen.promedio, 25);
  assert.equal(r.resumen.capacidad, 400);
  assert.equal(r.resumen.vendidos, 100);
  assert.equal(r.resumen.viajes, 2);
  assert.equal(r.resumen.cancelados, 1);
  assert.equal(calcularReporte(viajes, "primera").resumen.promedio, 25);
});

test("sin viajes, sólo cancelados o capacidad cero no producen NaN ni un promedio ficticio", () => {
  assert.equal(calcularReporte([], "ambas").resumen.promedio, null);
  assert.equal(calcularReporte([viaje({ estado: "cancelado" })], "ambas").resumen.promedio, null);
  const r = calcularReporte([viaje({ capacidad_primera: 0, vendidos_primera: 0 })], "primera");
  assert.equal(r.filas[0].porcentaje, null);
  assert.equal(r.filas[0].libres, 0);
  assert.equal(r.resumen.promedio, null);
  // No ocultar inconsistencias de datos recortando porcentajes a 100.
  assert.equal(calcularReporte([viaje({ vendidos_economy: 101 })], "economy").filas[0].porcentaje, 101);
});

test("la consulta incluye el último día completo de Argentina y parametriza el vuelo", async () => {
  const sql = (strings, ...values) => ({ strings, values });
  let consulta;
  const db = { $queryRaw: async q => { consulta = q; return []; } };
  const datos = cargar("lib/reportes/ocupacion/data.ts", {
    "server-only": {}, "@/src/generated/prisma/client": { Prisma: { sql, empty: {} } },
    "@/src/prisma/db": { db }, "@/lib/vuelos/fechas": fechas, "./calculos": { calcularReporte },
  });
  await datos.consultarOcupacion({ ...filtros, vuelo: 42 });
  assert.equal(consulta.values[0].toISOString(), "2026-11-01T03:00:00.000Z");
  assert.equal(consulta.values[1].toISOString(), "2026-12-01T03:00:00.000Z");
  assert.equal(consulta.values[2].values[0], 42);
});

test("la sesión rechaza clientes, empleados, usuarios baneados y visitantes", async () => {
  for (const usuario of [null, { publicMetadata: {} }, { publicMetadata: { role: "cliente" } }, { publicMetadata: { role: "empleado" } }, { banned: true, publicMetadata: { role: "administrador" } }]) {
    const sesion = cargar("lib/reportes/ocupacion/sesion.ts", { "server-only": {}, "@clerk/nextjs/server": { currentUser: async () => usuario } });
    assert.equal(await sesion.administradorActual(), null);
  }
});

test("la acción comprueba permisos y filtros antes de consultar, y oculta errores internos", async () => {
  let admin = null;
  let consultas = 0;
  let falla = false;
  const actions = cargar("lib/reportes/ocupacion/actions.ts", {
    "./sesion": { administradorActual: async () => admin },
    "./validacion": { validarFiltrosOcupacion: validar }, "./tipos": tipos,
    "./data": { consultarOcupacion: async () => { consultas++; if (falla) throw new Error("credencial interna"); return calcularReporte([], "ambas"); } },
  });
  assert.equal((await actions.generarReporteOcupacion(filtros)).mensaje, tipos.SIN_PERMISOS);
  assert.equal(consultas, 0);
  admin = { publicMetadata: { role: "administrador" } };
  assert.equal((await actions.generarReporteOcupacion({ ...filtros, desde: "" })).ok, false);
  assert.equal(consultas, 0);
  assert.equal((await actions.generarReporteOcupacion(filtros)).ok, true);
  falla = true;
  const error = await actions.generarReporteOcupacion(filtros);
  assert.equal(error.mensaje, tipos.ERROR_REPORTE);
  assert.equal(JSON.stringify(error).includes("credencial"), false);
});
