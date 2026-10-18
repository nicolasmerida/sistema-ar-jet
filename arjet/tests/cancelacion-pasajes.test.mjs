import assert from "node:assert/strict";
import { test } from "node:test";
import { cargar } from "./modulos.mjs";

const reglas = cargar("lib/pasajeros/cancelacion-reglas.ts");
const ahora = new Date("2026-10-18T15:00:00Z");
const base = { cancelado: false, estadoCompra: "pagado", estadoViaje: "programado", partida: new Date("2026-10-19T15:00:00Z") };

function servicio(db = {}) {
  return cargar("lib/pasajeros/cancelacion.ts", {
    "server-only": {}, "@/src/prisma/db": { db },
    "@/lib/vuelos/cancelacion": { OPCIONES_TRANSACCION: { maxWait: 10000, timeout: 20000 } },
    "./cancelacion-reglas": reglas,
  });
}

function transaccion({ restantes = 1, pasajes, fallo = false } = {}) {
  const eventos = [];
  const futuro = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const filas = pasajes ?? [{ id_pasaje: 1, cancelado: false, pago: { estado_compra: "pagado" }, viaje: { fecha_partida: futuro, estado: "programado" } }];
  return {
    eventos,
    tx: {
      $queryRaw: async (sql) => { eventos.push(sql.join("?")); return []; },
      pasaje: {
        findMany: async ({ where, select }) => {
          assert.equal(where.compra, 42);
          assert.equal(where.pago.reserva.usuario.clerk_id, "propietario");
          if (select.id_viaje) return filas.map(() => ({ id_viaje: 9 }));
          return filas;
        },
        updateMany: async ({ where, data }) => {
          eventos.push("cancelar");
          assert.equal(where.cancelado, false);
          assert.equal(data.cancelado, true);
          assert.ok(data.fecha_cancelacion instanceof Date);
          if (fallo) throw new Error("sin conexión");
          return { count: filas.length };
        },
        count: async ({ where }) => { assert.equal(where.compra, 42); assert.equal(where.cancelado, false); return restantes; },
      },
      pago: { update: async ({ where, data }) => { assert.equal(where.cod_compra, 42); assert.equal(data.estado_compra, "cancelado"); eventos.push("cancelar compra"); } },
    },
  };
}

test("cancelación: permite exactamente 24 horas, rechaza un milisegundo menos", () => {
  assert.equal(reglas.bloqueoCancelacionPasaje(base, ahora), null);
  assert.equal(reglas.bloqueoCancelacionPasaje({ ...base, partida: new Date(base.partida.getTime() - 1) }, ahora), reglas.FUERA_DE_PLAZO);
  assert.equal(reglas.bloqueoCancelacionPasaje({ ...base, estadoCompra: "pendiente" }, ahora), null);
  assert.match(reglas.bloqueoCancelacionPasaje({ ...base, cancelado: true }, ahora), /ya está cancelado/);
  assert.match(reglas.bloqueoCancelacionPasaje({ ...base, estadoCompra: "cancelado" }, ahora), /ya está cancelado/);
  assert.match(reglas.bloqueoCancelacionPasaje({ ...base, estadoViaje: "cancelado" }, ahora), /vuelo no admite/);
});

test("cancelación parcial: bloquea viaje y compra, libera el pasaje y conserva los demás", async () => {
  const { tx, eventos } = transaccion();
  const mensaje = await servicio().cancelarEnTransaccion(tx, 42, "propietario", 1);
  assert.equal(mensaje, "Pasaje cancelado correctamente");
  assert.match(eventos[0], /FROM viaje.*FOR UPDATE/);
  assert.match(eventos[1], /FROM pago.*FOR UPDATE/);
  assert.equal(eventos[2], "cancelar");
  assert.equal(eventos.includes("cancelar compra"), false);
});

test("último pasaje: cancela también la compra, sin borrar el historial", async () => {
  const { tx, eventos } = transaccion({ restantes: 0 });
  assert.equal(await servicio().cancelarEnTransaccion(tx, 42, "propietario"), "Reserva cancelada correctamente");
  assert.equal(eventos.at(-1), "cancelar compra");
});

test("reservas ajenas o inexistentes no bloquean ni modifican registros", async () => {
  const { tx, eventos } = transaccion({ pasajes: [] });
  await assert.rejects(servicio().cancelarEnTransaccion(tx, 42, "propietario", 1), /No se encontró/);
  assert.equal(eventos.length, 0);
});

test("revalida plazo y estado después del lock, sin cancelar parcialmente un grupo inválido", async () => {
  const futuro = new Date(Date.now() + 48 * 60 * 60 * 1000);
  for (const invalido of [
    { cancelado: true, pago: { estado_compra: "pagado" }, viaje: { fecha_partida: futuro, estado: "programado" } },
    { cancelado: false, pago: { estado_compra: "pagado" }, viaje: { fecha_partida: new Date(Date.now() + 1000), estado: "programado" } },
    { cancelado: false, pago: { estado_compra: "cancelado" }, viaje: { fecha_partida: futuro, estado: "programado" } },
  ]) {
    const { tx, eventos } = transaccion({ pasajes: [invalido] });
    await assert.rejects(servicio().cancelarEnTransaccion(tx, 42, "propietario", 1));
    assert.equal(eventos.includes("cancelar"), false);
  }
});

test("fallos de escritura propagan el error fuera de la transacción para revertirla", async () => {
  const { tx, eventos } = transaccion({ fallo: true });
  let revertida = false;
  const core = servicio({ $transaction: async (fn, opciones) => {
    assert.equal(opciones.isolationLevel, "ReadCommitted");
    try { return await fn(tx); } catch (error) { revertida = true; throw error; }
  } });
  await assert.rejects(core.cancelarReservaCliente(42, "propietario", 1), /sin conexión/);
  assert.equal(revertida, true);
  assert.equal(eventos.includes("cancelar compra"), false);
});

test("conteo compartido de asientos excluye pasajes cancelados y pagos anulados", () => {
  const fechas = cargar("lib/vuelos/fechas.ts");
  const data = cargar("lib/vuelos/data.ts", { "server-only": {}, "@/src/prisma/db": { db: {} }, "./fechas": fechas });
  assert.equal(data.filtroPasajesActivos.cancelado, false);
  assert.equal(data.filtroPasajesActivos.pago.estado_compra.in.join(","), "pendiente,pagado");
});

test("acción de cancelar: verifica sesión, rol, IDs y devuelve error recuperable", async () => {
  let usuario = null;
  let consultas = 0;
  let error = false;
  const core = servicio();
  const action = cargar("lib/pasajeros/cancelacion-actions.ts", {
    "@clerk/nextjs/server": { currentUser: async () => usuario }, "next/cache": { revalidatePath() {} },
    "@/lib/usuarios/tipos": { ROL_POR_DEFECTO: "cliente" },
    "./cancelacion": { CancelacionRechazada: core.CancelacionRechazada, cancelarReservaCliente: async (codigo, id, pasaje) => {
      consultas++;
      assert.equal(codigo, 42); assert.equal(id, "propietario"); assert.equal(pasaje, 1);
      if (error) throw new Error("desconectado");
      return "Pasaje cancelado correctamente";
    } },
  });
  assert.equal((await action.cancelarPasaje(42, 1)).ok, false);
  usuario = { id: "propietario", publicMetadata: { role: "administrador" } };
  assert.equal((await action.cancelarPasaje(42, 1)).ok, false);
  usuario = { id: "propietario", publicMetadata: { role: "cliente" } };
  for (const id of [0, -1, "1", 1.5]) assert.equal((await action.cancelarPasaje(42, id)).ok, false);
  assert.equal(consultas, 0);
  assert.equal((await action.cancelarPasaje(42, 1)).ok, true);
  error = true;
  assert.match((await action.cancelarPasaje(42, 1)).mensaje, /equipo técnico/);
});
