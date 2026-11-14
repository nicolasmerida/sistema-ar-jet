import assert from "node:assert/strict";
import { test } from "node:test";
import { cargar } from "./modulos.mjs";

const validacion = cargar("lib/pasajeros/reserva-validacion.ts");
const fechas = cargar("lib/vuelos/fechas.ts");
const rutas = cargar("lib/pasajeros/rutas.ts");
const datos = { viaje: 1, clase: "economy", pasajeros: [{ nombre: "María", apellido: "González", dni: "22.222.222" }] };
const vendidos = { cancelado: false, pago: { estado_compra: "pagado" } };

function servicio(db = {}) {
  return cargar("lib/pasajeros/reserva.ts", {
    "server-only": {}, "@/src/prisma/db": { db }, "@/lib/vuelos/data": { filtroPasajesVendidos: vendidos },
    "@/lib/vuelos/cancelacion": { OPCIONES_TRANSACCION: { maxWait: 10000, timeout: 20000 } },
    "@/lib/vuelos/fechas": fechas, "./reserva-validacion": validacion,
  });
}

function viaje() {
  const fecha = new Date("2099-10-18T12:00:00-03:00");
  const dia = fechas.columnaFecha(fechas.fechaLocal(fecha)).getUTCDay() || 7;
  return {
    estado: "programado", fecha_partida: fecha,
    avion: { estado: "activo", capacidad_economy: 1, capacidad_primera: 2 },
    vuelo: {
      precio_economy: "15000.50", precio_primera: "30000",
      inicio_disp: new Date("2099-01-01"), fin_disp: new Date("2099-12-31"), dias_operacion: [dia],
      aeropuerto_vuelo_origenToaeropuerto: { estado: "activo" }, aeropuerto_vuelo_destinoToaeropuerto: { estado: "activo" },
    },
  };
}

function cliente(cambios = {}) {
  return {
    $queryRaw: async () => [{ id_viaje: 1 }],
    viaje: { findUnique: async () => viaje() },
    usuario: { findUnique: async () => ({ dni: "12345678", cliente: {} }) },
    pasaje: { count: async () => 0, findFirst: async () => null, createMany: async () => {} },
    pasajero: { findUnique: async () => null, upsert: async () => {} },
    pago: { create: async () => ({ cod_compra: 42 }) },
    ...cambios,
  };
}

test("reserva: normaliza DNI, valida nombres y rechaza documentos duplicados", () => {
  const leido = validacion.leerReserva(datos);
  assert.equal(leido.pasajeros[0].dni, "22222222");
  assert.equal(Object.keys(validacion.validarPasajeros(leido.pasajeros)).length, 0);
  assert.ok(validacion.validarPasajeros([]).mensaje);
  assert.match(validacion.validarPasajeros([...leido.pasajeros, ...leido.pasajeros]).pasajeros[1].dni, /repetir/);
  const errores = validacion.validarPasajeros([{ nombre: "", apellido: "123", dni: "1" }]);
  assert.equal(Object.keys(errores.pasajeros[0]).length, 3);
  for (const entrada of [null, {}, { ...datos, clase: "otra" }, { ...datos, viaje: -1 }, { ...datos, pasajeros: [null] }]) {
    assert.equal(validacion.leerReserva(entrada), null);
  }
});

test("login: conserva viaje y clase sin habilitar una redirección externa", () => {
  assert.equal(rutas.retornoReserva("http://localhost:3000/vuelos/reservar?viaje=12&clase=primera"), "/vuelos/reservar?viaje=12&clase=primera");
  assert.equal(rutas.retornoReserva("https://externo.test/vuelos/reservar?viaje=12&clase=economy"), "/vuelos/reservar?viaje=12&clase=economy");
  for (const url of ["https://externo.test/", "/vuelos/reservar?viaje=-1&clase=primera", "/dashboard", ["/vuelos/reservar"]]) assert.equal(rutas.retornoReserva(url), undefined);
});

test("reserva: usa la identidad autenticada, cuenta solo pagados y guarda el precio acordado", async () => {
  const tx = cliente();
  const orden = [];
  tx.$queryRaw = async (sql, id) => { assert.match(sql.join("?"), /FOR UPDATE/); assert.equal(id, 1); orden.push("lock"); return [{ id_viaje: 1 }]; };
  tx.pasaje.count = async ({ where }) => { assert.equal(where.clase, "economy"); assert.equal(where.pago.estado_compra, "pagado"); orden.push("count"); return 0; };
  tx.usuario.findUnique = async ({ where }) => { assert.equal(where.clerk_id, "clerk-test"); return { dni: "12345678", cliente: {} }; };
  tx.pago.create = async ({ data }) => { assert.equal(data.estado_compra, "pendiente"); assert.equal(data.tipo, undefined); assert.equal(data.reserva.create.dni_usuario, "12345678"); return { cod_compra: 42 }; };
  tx.pasaje.createMany = async ({ data }) => { assert.equal(data.length, 1); assert.equal(data[0].compra, 42); assert.equal(data[0].pasajero, "22222222"); assert.equal(data[0].clase, "economy"); assert.equal(data[0].precio_unitario, "15000.50"); };
  const db = { $transaction: async (fn, opciones) => { assert.equal(opciones.isolationLevel, "ReadCommitted"); return fn(tx); } };
  assert.equal(await servicio(db).registrarReserva(validacion.leerReserva(datos), "clerk-test"), 42);
  assert.equal(orden.join(","), "lock,count");
});

test("US-26: reservas pendientes simultáneas no descuentan el último asiento", async () => {
  let creados = 0;
  let cola = Promise.resolve();
  const core = servicio();
  async function reservar() {
    let liberar;
    const anterior = cola;
    cola = new Promise((resolve) => { liberar = resolve; });
    const tx = cliente();
    tx.$queryRaw = async () => { await anterior; return [{ id_viaje: 1 }]; };
    tx.pasaje.count = async () => 0;
    tx.pasaje.createMany = async ({ data }) => { creados += data.length; };
    try { return await core.registrarEnTransaccion(tx, validacion.leerReserva(datos), "clerk-test"); }
    finally { liberar(); }
  }
  const resultados = await Promise.allSettled([reservar(), reservar()]);
  assert.equal(resultados.filter((r) => r.status === "fulfilled").length, 2);
  assert.equal(creados, 2);
});

test("reserva: clase sin capacidad, vuelo cancelado, vencido y pasajero repetido no se guardan", async () => {
  const core = servicio();
  for (const modificar of [
    (v) => { v.avion.capacidad_economy = 0; },
    (v) => { v.estado = "cancelado"; },
    (v) => { v.fecha_partida = new Date("2000-01-01"); },
    (v) => { v.vuelo.fin_disp = new Date("2000-01-01"); },
    (v) => { v.vuelo.dias_operacion = []; },
    (v) => { v.avion.estado = "de_baja"; },
  ]) {
    const tx = cliente();
    const v = viaje(); modificar(v);
    tx.viaje.findUnique = async () => v;
    tx.pago.create = async () => assert.fail("No debe guardar");
    await assert.rejects(core.registrarEnTransaccion(tx, validacion.leerReserva(datos), "clerk-test"), (error) => error.agotado === true);
  }
  const tx = cliente();
  tx.pasaje.findFirst = async () => ({ id_pasaje: 1 });
  tx.pago.create = async () => assert.fail("No debe guardar");
  await assert.rejects(core.registrarEnTransaccion(tx, validacion.leerReserva(datos), "clerk-test"), /ya tiene un pasaje/);
});

test("resumen: consulta por código e identidad, sin exponer reservas de otro usuario", async () => {
  const data = cargar("lib/pasajeros/reserva-data.ts", {
    "server-only": {}, "@/src/prisma/db": { db: { reserva: { findFirst: async ({ where }) => {
      assert.equal(where.cod_compra, 42);
      assert.equal(where.usuario.clerk_id, "propietario");
      return null;
    } } } }, "@/lib/vuelos/fechas": fechas, "./data": {},
  });
  assert.equal(await data.obtenerResumenReserva(42, "propietario"), null);
});

const grupo = (cantidad) => ({ ...datos, pasajeros: Array.from({ length: cantidad }, (_, i) => ({ nombre: "Ana", apellido: "Pérez", dni: String(30000000 + i) })) });

test("US-25: la cantidad de pasajes va de 1 a 9 y respeta los asientos libres", () => {
  assert.equal(validacion.validarCantidadPasajes(1), undefined);
  assert.equal(validacion.validarCantidadPasajes(9), undefined);
  assert.equal(validacion.validarCantidadPasajes(10), "No es posible comprar más de 9 pasajes por transacción");
  for (const invalida of [0, -1, 2.5, NaN]) assert.match(validacion.validarCantidadPasajes(invalida), /entre 1 y 9/);
  assert.equal(validacion.validarCantidadPasajes(4, 3), "Solo quedan 3 asientos disponibles en esta clase");
  assert.equal(validacion.validarCantidadPasajes(3, 3), undefined);
});

test("US-25: el backend acepta 9 pasajes y rechaza 10 sin registrar la reserva", async () => {
  const v = viaje();
  v.avion.capacidad_economy = 20;
  const tx = cliente();
  tx.viaje.findUnique = async () => v;
  let guardados = 0;
  tx.pasaje.createMany = async ({ data }) => { guardados = data.length; };
  await servicio().registrarEnTransaccion(tx, grupo(9), "clerk-test");
  assert.equal(guardados, 9);
  const rechazo = cliente();
  rechazo.$queryRaw = async () => assert.fail("No debe tomar el lock");
  rechazo.pago.create = async () => assert.fail("No debe guardar");
  await assert.rejects(servicio().registrarEnTransaccion(rechazo, grupo(10), "clerk-test"),
    (error) => error.message === "No es posible comprar más de 9 pasajes por transacción" && !error.agotado);
});

test("US-25: si la cantidad supera los asientos libres informa cuántos quedan", async () => {
  const v = viaje();
  v.avion.capacidad_economy = 5;
  const tx = cliente();
  tx.viaje.findUnique = async () => v;
  tx.pasaje.count = async () => 2;
  tx.pago.create = async () => assert.fail("No debe guardar");
  await assert.rejects(servicio().registrarEnTransaccion(tx, grupo(4), "clerk-test"),
    (error) => error.message === "Solo quedan 3 asientos disponibles en esta clase" && !error.agotado);
});

test("reserva: permite volver a reservar después de cancelar, sin reactivar el pasaje anterior", async () => {
  const tx = cliente();
  tx.pasaje.findFirst = async ({ where }) => {
    assert.equal(where.cancelado, false);
    assert.equal(where.pasajero.in[0], "22222222");
    return null;
  };
  let nuevos = 0;
  tx.pasaje.createMany = async ({ data }) => { nuevos = data.length; };
  await servicio().registrarEnTransaccion(tx, validacion.leerReserva(datos), "clerk-test");
  assert.equal(nuevos, 1);
});

test("server action de reserva: exige sesión, valida y devuelve errores recuperables", async () => {
  let usuario = null;
  let consultas = 0;
  let fallar = false;
  const core = servicio();
  const action = cargar("lib/pasajeros/reserva-actions.ts", {
    "@clerk/nextjs/server": { currentUser: async () => usuario },
    "next/cache": { revalidatePath() {} },
    "@/lib/usuarios/tipos": { ROL_POR_DEFECTO: "cliente" },
    "./reserva-validacion": validacion,
    "./reserva": {
      ReservaRechazada: core.ReservaRechazada,
      registrarReserva: async () => { consultas++; if (fallar) throw new core.ReservaRechazada("El asiento ya no está disponible", true); return 42; },
    },
  });
  assert.equal((await action.reservarVuelo(datos)).login, true);
  usuario = { id: "clerk-test", publicMetadata: { role: "empleado" } };
  assert.equal((await action.reservarVuelo(datos)).ok, false);
  assert.equal(consultas, 0);
  usuario = { id: "clerk-test", publicMetadata: { role: "cliente" } };
  assert.equal((await action.reservarVuelo({ ...datos, pasajeros: [] })).ok, false);
  assert.equal(consultas, 0);
  const limite = await action.reservarVuelo(grupo(10));
  assert.equal(limite.mensaje, "No es posible comprar más de 9 pasajes por transacción");
  assert.equal(consultas, 0);
  assert.equal((await action.reservarVuelo(datos)).codigo, 42);
  fallar = true;
  assert.equal((await action.reservarVuelo(datos)).agotado, true);
});
