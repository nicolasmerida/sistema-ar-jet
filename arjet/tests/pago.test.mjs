import assert from "node:assert/strict";
import { test } from "node:test";
import { cargar } from "./modulos.mjs";

function servicio(reserva) {
  return cargar("lib/pasajeros/pago.ts", { "server-only": {}, "@/src/prisma/db": { db: { reserva } } });
}

test("tarjeta y mostrador confirman la misma reserva, sin crear pasajes ni marcar un cobro", async () => {
  for (const modalidad of ["tarjeta", "mostrador"]) {
    const core = servicio({ updateMany: async ({ where, data }) => {
      assert.equal(where.cod_compra, 42);
      assert.equal(where.usuario.clerk_id, "propietario");
      assert.equal(where.modalidad, null);
      assert.equal(where.pago.estado_compra, "pendiente");
      assert.equal(where.pago.pasaje.some.cancelado, false);
      assert.equal(where.pago.pasaje.every.OR[0].cancelado, true);
      assert.equal(where.pago.pasaje.every.OR[1].viaje.estado.in.join(","), "programado,demorado");
      assert.ok(where.pago.pasaje.every.OR[1].viaje.fecha_partida.gt instanceof Date);
      assert.equal(Object.keys(data).join(","), "modalidad");
      assert.equal(data.modalidad, modalidad);
      return { count: 1 };
    } });
    assert.equal((await core.guardarModalidad(42, "propietario", modalidad)).ok, true);
  }
});

test("confirmación repetida es idempotente y no cambia una modalidad ya confirmada", async () => {
  const core = servicio({
    updateMany: async () => ({ count: 0 }),
    findFirst: async ({ where }) => {
      assert.equal(where.cod_compra, 42);
      assert.equal(where.usuario.clerk_id, "propietario");
      return { modalidad: "mostrador" };
    },
  });
  assert.equal((await core.guardarModalidad(42, "propietario", "mostrador")).ok, true);
  assert.equal((await core.guardarModalidad(42, "propietario", "tarjeta")).ok, false);
});

test("no confirma reservas ajenas, canceladas o con vuelos no disponibles", async () => {
  for (const existente of [null, { modalidad: null }]) {
    const core = servicio({ updateMany: async () => ({ count: 0 }), findFirst: async () => existente });
    assert.equal((await core.guardarModalidad(42, "otro-usuario", "mostrador")).ok, false);
  }
});

test("acción de pago: valida sesión y modalidad; permite reintentar después de un error", async () => {
  let usuario = null;
  let consultas = 0;
  let error = false;
  const acciones = cargar("lib/pasajeros/pago-actions.ts", {
    "@clerk/nextjs/server": { currentUser: async () => usuario },
    "next/cache": { revalidatePath() {} },
    "@/lib/usuarios/tipos": { ROL_POR_DEFECTO: "cliente" },
    "./pago": { guardarModalidad: async (codigo, clerkId, modalidad) => {
      consultas++;
      assert.equal(codigo, 42);
      assert.equal(clerkId, "propietario");
      assert.equal(modalidad, "tarjeta");
      if (error) throw new Error("sin conexión");
      return { ok: true };
    } },
  });
  assert.equal((await acciones.confirmarReserva(42, "tarjeta")).ok, false);
  usuario = { id: "propietario", publicMetadata: { role: "empleado" } };
  assert.equal((await acciones.confirmarReserva(42, "tarjeta")).ok, false);
  usuario = { id: "propietario", publicMetadata: { role: "cliente" } };
  for (const modalidad of [null, "efectivo", "otro"]) assert.equal((await acciones.confirmarReserva(42, modalidad)).ok, false);
  for (const codigo of [-1, "42", 1.5]) assert.equal((await acciones.confirmarReserva(codigo, "tarjeta")).ok, false);
  assert.equal(consultas, 0);
  assert.equal((await acciones.confirmarReserva(42, "tarjeta")).ok, true);
  error = true;
  assert.match((await acciones.confirmarReserva(42, "tarjeta")).mensaje, /reintentá/);
  error = false;
  assert.equal((await acciones.confirmarReserva(42, "tarjeta")).ok, true);
});
