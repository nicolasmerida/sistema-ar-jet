import assert from "node:assert/strict";
import { test } from "node:test";
import { cargar } from "./modulos.mjs";

const fechas = cargar("lib/vuelos/fechas.ts");
const validacion = cargar("lib/pasajeros/validacion.ts", { "../vuelos/fechas": fechas });
const datos = { origen: "1", destino: "2", fecha: "2026-10-18" };

test("validación: campos obligatorios, ruta distinta y fechas reales no pasadas", () => {
  const validar = (entrada) => validacion.validarBusqueda(entrada, "2026-10-18");
  assert.equal(Object.keys(validar(datos)).length, 0);
  assert.equal(Object.keys(validar({ origen: "", destino: "", fecha: "" })).length, 3);
  assert.match(validar({ ...datos, destino: "1" }).destino, /deben ser distintos/);
  for (const fecha of ["2026-10-17", "2026-02-30", "2026-13-01", "inválida"]) {
    assert.ok(validar({ ...datos, fecha }).fecha, fecha);
  }
  for (const origen of ["0", "-1", "1.5", "Infinity", "9007199254740992"]) {
    assert.ok(validar({ ...datos, origen }).origen, origen);
  }
});

test("fecha actual y límites de día usan Argentina, incluso al cambiar el día UTC", () => {
  assert.equal(fechas.hoyEnArgentina(new Date("2026-10-19T01:30:00Z")), "2026-10-18");
  assert.equal(fechas.instanteLocal("2026-10-18", "00:00").toISOString(), "2026-10-18T03:00:00.000Z");
  assert.equal(fechas.sumarDias("2026-12-31", 1), "2027-01-01");
});

function servicio(findMany) {
  return cargar("lib/pasajeros/data.ts", {
    "server-only": {}, "@/src/prisma/db": { db: { viaje: { findMany } } },
    "@/lib/vuelos/data": { filtroPasajesActivos: { pago: { estado_compra: { in: ["pendiente", "pagado"] } } } },
    "@/lib/vuelos/fechas": fechas, "./validacion": validacion,
  });
}

test("consulta: ruta, día ISO, vigencia, activos y reservas que ocupan asientos", async () => {
  const ahora = new Date("2026-10-18T10:00:00Z");
  const data = servicio(async ({ where, select }) => {
    assert.equal(where.vuelo.origen, 1);
    assert.equal(where.vuelo.destino, 2);
    assert.equal(where.vuelo.dias_operacion.has, 7);
    assert.equal(where.vuelo.inicio_disp.lte.toISOString(), "2026-10-18T00:00:00.000Z");
    assert.equal(where.vuelo.fin_disp.gte.toISOString(), "2026-10-18T00:00:00.000Z");
    assert.equal(where.fecha_partida.gte.toISOString(), "2026-10-18T03:00:00.000Z");
    assert.equal(where.fecha_partida.lt.toISOString(), "2026-10-19T03:00:00.000Z");
    assert.equal(where.fecha_partida.gt, ahora);
    assert.equal(Array.from(where.estado.in).join(","), "programado,demorado");
    assert.equal(where.avion.estado, "activo");
    assert.equal(where.vuelo.aeropuerto_vuelo_origenToaeropuerto.estado, "activo");
    assert.equal(where.vuelo.aeropuerto_vuelo_destinoToaeropuerto.estado, "activo");
    assert.equal(select.pasaje.where.pago.estado_compra.in.join(","), "pendiente,pagado");
    return [];
  });
  assert.equal((await data.obtenerVuelosDisponibles(datos, ahora)).length, 0);
});

test("disponibilidad por clase: omite completos, conserva los que tienen una clase libre", async () => {
  const viaje = {
    id_viaje: 1, fecha_partida: new Date("2026-10-18T23:00:00Z"), fecha_llegada: new Date("2026-10-19T04:00:00Z"),
    estado: "demorado", avion: { capacidad_economy: 2, capacidad_primera: 1 },
    pasaje: [{ clase: "economy" }, { clase: "economy" }],
    vuelo: {
      numero: "AN 101", precio_economy: { toString: () => "15000.50" }, precio_primera: { toString: () => "30000" },
      aeropuerto_vuelo_origenToaeropuerto: { codigo_iata: "EZE", ciudad: "Buenos Aires" },
      aeropuerto_vuelo_destinoToaeropuerto: { codigo_iata: "COR", ciudad: "Córdoba" },
    },
  };
  const data = servicio(async () => [viaje, { ...viaje, id_viaje: 2, pasaje: [...viaje.pasaje, { clase: "primera" }] }]);
  const resultados = await data.obtenerVuelosDisponibles(datos);
  assert.equal(resultados.length, 1);
  assert.equal(resultados[0].economy.disponibles, 0);
  assert.equal(resultados[0].primera.disponibles, 1);
  assert.equal(resultados[0].economy.precio, "15000.50");
  assert.equal(resultados[0].demorado, true);
  assert.equal(validacion.asientosDisponibles(1, 2), 0);
});

test("server action: rechaza sesiones sin permiso y valida antes de consultar", async () => {
  let usuario = null;
  let consultas = 0;
  const actions = cargar("lib/pasajeros/actions.ts", {
    "@clerk/nextjs/server": { currentUser: async () => usuario },
    "@/lib/usuarios/tipos": { ROL_POR_DEFECTO: "cliente" },
    "./data": { obtenerVuelosDisponibles: async () => { consultas++; return []; } },
    "./validacion": validacion,
  });
  for (const caso of [null, { publicMetadata: { role: "administrador" } }, { banned: true, publicMetadata: {} }]) {
    usuario = caso;
    assert.equal((await actions.buscarVuelos(datos)).ok, false);
  }
  usuario = { publicMetadata: { role: "cliente" } };
  assert.equal((await actions.buscarVuelos(null)).ok, false);
  assert.equal(consultas, 0);
  const futuro = { ...datos, fecha: "2099-10-18" };
  assert.equal((await actions.buscarVuelos(futuro)).ok, true);
  assert.equal(consultas, 1);
});

test("server action: convierte errores de base de datos en un mensaje recuperable", async () => {
  const actions = cargar("lib/pasajeros/actions.ts", {
    "@clerk/nextjs/server": { currentUser: async () => ({ publicMetadata: {} }) },
    "@/lib/usuarios/tipos": { ROL_POR_DEFECTO: "cliente" },
    "./data": { obtenerVuelosDisponibles: async () => { throw new Error("desconectado"); } },
    "./validacion": validacion,
  });
  const resultado = await actions.buscarVuelos({ ...datos, fecha: "2099-10-18" });
  assert.equal(resultado.ok, false);
  assert.match(resultado.mensaje, /reintentá más tarde/);
});
