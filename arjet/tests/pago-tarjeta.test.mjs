import assert from "node:assert/strict";
import { test } from "node:test";
import { Decimal } from "@prisma/client/runtime/client";
import { cargar } from "./modulos.mjs";

const fechas = cargar("lib/vuelos/fechas.ts");
const cantidad = cargar("lib/pasajeros/reserva-validacion.ts");
const validacion = cargar("lib/pasajeros/pago-validacion.ts", { "@/lib/vuelos/fechas": fechas });
const tarjeta = { titular: "María González", numero: "4111111111111111", vencimiento: "12/99", seguridad: "123" };

function servicio(db = {}) {
  return cargar("lib/pasajeros/procesar-pago.ts", {
    "server-only": {}, "node:crypto": { randomUUID: () => "referencia-de-prueba" },
    "@/src/prisma/db": { db }, "@/lib/vuelos/data": { filtroPasajesVendidos: { cancelado: false, pago: { estado_compra: "pagado" } } },
    "@/lib/vuelos/cancelacion": { OPCIONES_TRANSACCION: { maxWait: 10000, timeout: 20000 } },
    "@/lib/vuelos/fechas": fechas, "./reserva-validacion": cantidad, "./pago-validacion": validacion,
  });
}

function fixture({ vendidos = 0, estado = "pendiente", autorizada = true } = {}) {
  const viaje = {
    fecha_partida: new Date("2099-11-11T15:00:00Z"), estado: "programado",
    avion: { estado: "activo", capacidad_economy: 1, capacidad_primera: 1 },
    vuelo: { origen: 1, destino: 2, inicio_disp: new Date("2099-01-01"), fin_disp: new Date("2099-12-31"), dias_operacion: [1, 2, 3, 4, 5, 6, 7],
      aeropuerto_vuelo_origenToaeropuerto: { estado: "activo" }, aeropuerto_vuelo_destinoToaeropuerto: { estado: "activo" } },
  };
  const reserva = { pago: { estado_compra: estado, referencia: estado === "pagado" ? "SIM-anterior" : null,
    pasaje: [{ id_viaje: 9, clase: "economy", precio_unitario: new Decimal("15000.50"), cancelado: false, viaje }] } };
  const escrituras = [];
  const tx = {
    $queryRaw: async () => [],
    reserva: { findFirst: async ({ where }) => { assert.equal(where.usuario.clerk_id, "propietario"); return reserva; }, update: async (valor) => escrituras.push({ reserva: valor }) },
    pasaje: { count: async ({ where }) => { assert.equal(where.pago.estado_compra, "pagado"); assert.equal(where.cancelado, false); return vendidos; } },
    pago: { update: async (valor) => escrituras.push({ pago: valor }) },
  };
  return { tx, reserva, viaje, escrituras, autorizacion: { autorizada, ultimos4: "1111" } };
}

test("tarjeta: valida campos, Luhn y vencimiento inclusive en el mes actual", () => {
  assert.equal(Object.keys(validacion.validarPago(tarjeta, "2026-11-11")).length, 0);
  const vacios = validacion.leerDatosPago(null);
  assert.equal(Object.keys(validacion.validarPago(vacios)).length, 4);
  for (const numero of ["0000000000000000", "4111111111111112", "abc", "4111"]) assert.ok(validacion.validarPago({ ...tarjeta, numero }).numero);
  assert.equal(validacion.validarPago({ ...tarjeta, vencimiento: "11/26" }, "2026-11-30").vencimiento, undefined);
  assert.match(validacion.validarPago({ ...tarjeta, vencimiento: "10/26" }, "2026-11-01").vencimiento, /vencida/);
  for (const vencimiento of ["00/29", "13/29", "1/29", "11/2029"]) assert.ok(validacion.validarPago({ ...tarjeta, vencimiento }).vencimiento);
  const normalizada = validacion.leerDatosPago({ ...tarjeta, numero: "4111 1111-1111 1111", importe: "0" });
  assert.equal(normalizada.numero, tarjeta.numero);
  assert.equal(normalizada.importe, undefined);
});

test("autorización simulada: aprobación y rechazo reproducibles con tarjetas válidas", () => {
  assert.equal(validacion.autorizarTarjetaSimulada(tarjeta).autorizada, true);
  const rechazo = { ...tarjeta, numero: "4000000000000002" };
  assert.equal(Object.keys(validacion.validarPago(rechazo)).length, 0);
  assert.equal(validacion.autorizarTarjetaSimulada(rechazo).autorizada, false);
});

test("pago exitoso: importe decimal desde la reserva, sin PAN, CVV ni titular persistidos", async () => {
  const f = fixture();
  f.viaje.vuelo.precio_economy = new Decimal("99999");
  await servicio().pagarEnTransaccion(f.tx, 42, "propietario", f.autorizacion);
  const data = f.escrituras[0].pago.data;
  assert.equal(data.estado_compra, "pagado");
  assert.equal(data.importe.toString(), "15000.5");
  assert.equal(data.moneda, "ARS");
  assert.equal(data.tarjeta_ultimos4, "1111");
  assert.ok(data.fecha_pago instanceof Date);
  assert.match(data.referencia, /^SIM-/);
  assert.equal(f.escrituras[1].reserva.data.modalidad, "tarjeta");
  const texto = JSON.stringify(f.escrituras);
  assert.equal(texto.includes(tarjeta.numero), false);
  assert.equal(texto.includes("seguridad"), false);
  assert.equal(texto.includes("titular"), false);
});

test("pago rechazado: conserva reserva pendiente y no registra venta", async () => {
  const f = fixture({ autorizada: false });
  await assert.rejects(servicio().pagarEnTransaccion(f.tx, 42, "propietario", f.autorizacion), (e) => e.message === validacion.MENSAJE_PAGO_RECHAZADO);
  assert.equal(f.escrituras.length, 0);
  assert.equal(f.reserva.pago.estado_compra, "pendiente");
});

test("último asiento vendido: no registra pago y vuelve a los resultados de esa ruta", async () => {
  const f = fixture({ vendidos: 1 });
  await assert.rejects(servicio().pagarEnTransaccion(f.tx, 42, "propietario", f.autorizacion), (e) => {
    assert.equal(e.message, validacion.MENSAJE_SIN_ASIENTOS_PAGO);
    assert.match(e.resultados, /^\/vuelos\?origen=1&destino=2&fecha=2099-11-11&aviso=sin-asientos-pago$/);
    return true;
  });
  assert.equal(f.escrituras.length, 0);
});

test("repetir un pago exitoso devuelve su referencia sin descontar otra vez", async () => {
  const f = fixture({ estado: "pagado", vendidos: 1 });
  const resultado = await servicio().pagarEnTransaccion(f.tx, 42, "propietario", f.autorizacion);
  assert.equal(resultado.referencia, "SIM-anterior");
  assert.equal(f.escrituras.length, 0);
});

test("reservas ajenas, canceladas, fuera de vigencia y más de nueve no admiten pago", async () => {
  for (const modificar of [
    (f) => { f.tx.reserva.findFirst = async () => null; },
    (f) => { f.reserva.pago.estado_compra = "cancelado"; },
    (f) => { f.viaje.estado = "cancelado"; },
    (f) => { f.viaje.fecha_partida = new Date("2000-01-01"); },
    (f) => { f.viaje.avion.estado = "de_baja"; },
    (f) => { f.viaje.vuelo.dias_operacion = []; },
    (f) => { f.reserva.pago.pasaje = Array.from({ length: 10 }, () => f.reserva.pago.pasaje[0]); },
  ]) {
    const f = fixture(); modificar(f);
    await assert.rejects(servicio().pagarEnTransaccion(f.tx, 42, "propietario", f.autorizacion));
    assert.equal(f.escrituras.length, 0);
  }
});

test("acción de tarjeta: verifica rol y valida antes de procesar; error permite reintentar", async () => {
  let usuario = null;
  let llamadas = 0;
  let fallar = false;
  const core = servicio();
  const acciones = cargar("lib/pasajeros/tarjeta-actions.ts", {
    "@clerk/nextjs/server": { currentUser: async () => usuario }, "next/cache": { revalidatePath() {} },
    "@/lib/usuarios/tipos": { ROL_POR_DEFECTO: "cliente" }, "./pago-validacion": validacion,
    "./procesar-pago": { PagoRechazado: core.PagoRechazado, procesarPago: async (codigo, propietario, autorizacion) => {
      llamadas++; assert.equal(codigo, 42); assert.equal(propietario, "propietario");
      assert.equal(Object.keys(autorizacion).sort().join(","), "autorizada,ultimos4");
      if (fallar) throw new Error("sin conexión");
    } },
  });
  assert.equal((await acciones.pagarReserva(42, tarjeta)).ok, false);
  usuario = { id: "propietario", publicMetadata: { role: "empleado" } };
  assert.equal((await acciones.pagarReserva(42, tarjeta)).ok, false);
  usuario = { id: "propietario", publicMetadata: { role: "cliente" } };
  assert.equal((await acciones.pagarReserva(42, {})).ok, false);
  assert.equal(llamadas, 0);
  assert.equal((await acciones.pagarReserva(42, tarjeta)).ok, true);
  fallar = true;
  assert.match((await acciones.pagarReserva(42, tarjeta)).mensaje, /reintentá más tarde/);
  fallar = false;
  assert.equal((await acciones.pagarReserva(42, tarjeta)).ok, true);
});

test("conteo: solo pagos exitosos venden asientos; pendientes siguen siendo reservas activas", () => {
  const data = cargar("lib/vuelos/data.ts", { "server-only": {}, "@/src/prisma/db": { db: {} }, "./fechas": fechas });
  assert.equal(data.filtroPasajesVendidos.cancelado, false);
  assert.equal(data.filtroPasajesVendidos.pago.estado_compra, "pagado");
  assert.equal(data.filtroPasajesActivos.pago.estado_compra.in.join(","), "pendiente,pagado");
});
