import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { Client } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import ts from "typescript";
import { cargar } from "./modulos.mjs";

// El generador usa imports TS sin extensión; este loader solo afecta al proceso de prueba.
registerHooks({
  resolve(specifier, context, next) {
    try { return next(specifier, context); }
    catch (error) { if (specifier.startsWith(".") && context.parentURL?.includes("/src/generated/prisma/")) return next(`${specifier}.ts`, context); throw error; }
  },
  load(url, context, next) {
    if (url.includes("/src/generated/prisma/") && url.endsWith(".ts")) return { format: "module", shortCircuit: true,
      source: ts.transpileModule(readFileSync(new URL(url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText };
    return next(url, context);
  },
});

const { PrismaClient } = await import("../src/generated/prisma/client.ts");
const schema = `us26_test_${randomUUID().replaceAll("-", "")}`;
assert.match(schema, /^us26_test_[a-f0-9]{32}$/);
const administrador = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }, { schema }) });
const fechas = cargar("lib/vuelos/fechas.ts");
const validacion = cargar("lib/pasajeros/pago-validacion.ts", { "@/lib/vuelos/fechas": fechas });
const core = cargar("lib/pasajeros/procesar-pago.ts", {
  "server-only": {}, "node:crypto": { randomUUID }, "@/src/prisma/db": { db: {} },
  "@/lib/vuelos/data": { filtroPasajesVendidos: { cancelado: false, pago: { estado_compra: "pagado" } } },
  "@/lib/vuelos/cancelacion": {}, "@/lib/vuelos/fechas": fechas,
  "./reserva-validacion": cargar("lib/pasajeros/reserva-validacion.ts"), "./pago-validacion": validacion,
});
let creado = false;
const autorizar = { autorizada: true, ultimos4: "1111" };
async function pagar(codigo, propietario, autorizacion = autorizar, forzarFallo = false) {
  return db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}", public`);
    const resultado = await core.pagarEnTransaccion(tx, codigo, propietario, autorizacion);
    if (forzarFallo) throw new Error("fallo de prueba antes de commit");
    return resultado;
  }, { isolationLevel: "ReadCommitted", maxWait: 10000, timeout: 20000 });
}
try {
  await administrador.connect();
  await administrador.query(`CREATE SCHEMA "${schema}"`);
  creado = true;
  for (const tipo of ["estado_registro_t", "estado_compra_t", "estado_viaje_t", "clase_t", "tipo_pago_t"]) {
    const definicion = await administrador.query("SELECT format('CREATE TYPE %I.%I AS ENUM (%s)', $1::text, $2::text, string_agg(quote_literal(e.enumlabel), ',' ORDER BY e.enumsortorder)) AS sql FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname=$2", [schema, tipo]);
    await administrador.query(definicion.rows[0].sql);
  }
  for (const tabla of ["aeropuerto", "avion", "vuelo", "viaje", "usuario", "cliente", "pasajero", "pago", "reserva", "pasaje"]) {
    await administrador.query(`CREATE TABLE "${schema}"."${tabla}" (LIKE public."${tabla}" INCLUDING DEFAULTS INCLUDING IDENTITY INCLUDING GENERATED)`);
  }
  for (const [tabla, columna, tipo, defecto] of [
    ["aeropuerto", "estado", "estado_registro_t", "activo"], ["avion", "estado", "estado_registro_t", "activo"],
    ["viaje", "estado", "estado_viaje_t", "programado"], ["pago", "estado_compra", "estado_compra_t", "pendiente"],
    ["pago", "tipo", "tipo_pago_t", null], ["pasaje", "clase", "clase_t", null],
  ]) {
    await administrador.query(`ALTER TABLE "${schema}"."${tabla}" ALTER COLUMN "${columna}" DROP DEFAULT`);
    await administrador.query(`ALTER TABLE "${schema}"."${tabla}" ALTER COLUMN "${columna}" TYPE "${schema}"."${tipo}" USING "${columna}"::text::"${schema}"."${tipo}"`);
    if (defecto) await administrador.query(`ALTER TABLE "${schema}"."${tabla}" ALTER COLUMN "${columna}" SET DEFAULT '${defecto}'::"${schema}"."${tipo}"`);
  }
  await administrador.query(`SET search_path TO "${schema}", public`);
  await administrador.query(`
    INSERT INTO aeropuerto (id_aeropuerto,ciudad,codigo_iata,nombre) OVERRIDING SYSTEM VALUE VALUES (1,'Origen prueba','TSA','Prueba A'),(2,'Destino prueba','TSB','Prueba B');
    INSERT INTO avion (id_avion,capacidad_economy,capacidad_primera,matricula,modelo) OVERRIDING SYSTEM VALUE VALUES (1,1,1,'US26-TEST','Prueba');
    INSERT INTO vuelo (id_vuelo,origen,destino,inicio_disp,fin_disp,precio_economy,precio_primera,numero,hora_salida,hora_llegada,dias_operacion)
      OVERRIDING SYSTEM VALUE VALUES (1,1,2,'2099-01-01','2099-12-31',1500.50,3000,'AN 26','10:00','12:00',ARRAY[1,2,3,4,5,6,7]);
    INSERT INTO viaje (id_viaje,id_vuelo,id_avion,fecha_partida,fecha_llegada) OVERRIDING SYSTEM VALUE VALUES (1,1,1,'2099-11-11T13:00:00Z','2099-11-11T15:00:00Z');
    INSERT INTO usuario (dni,clerk_id,nombre,apellido) VALUES ('11111111','us26-a','Ana','Prueba'),('22222222','us26-b','Juan','Prueba');
    INSERT INTO pasajero (dni,nombre,apellido) VALUES ('11111111','Ana','Prueba'),('22222222','Juan','Prueba');
    INSERT INTO pago (cod_compra) OVERRIDING SYSTEM VALUE VALUES (1),(2);
    INSERT INTO reserva (cod_compra,dni_usuario,modalidad) VALUES (1,'11111111','tarjeta'),(2,'22222222','tarjeta');
    INSERT INTO pasaje (id_pasaje,id_viaje,compra,pasajero,clase,precio_unitario) OVERRIDING SYSTEM VALUE VALUES (1,1,1,'11111111','economy',1500.50),(2,1,2,'22222222','economy',1500.50);
  `);
  await assert.rejects(pagar(1, "us26-b"), /permisos/);
  await assert.rejects(pagar(1, "us26-a", { autorizada: false, ultimos4: "0002" }), /rechazado/);
  assert.equal(await db.pago.count({ where: { estado_compra: "pagado" } }), 0);
  await assert.rejects(pagar(1, "us26-a", autorizar, true), /fallo de prueba/);
  assert.equal(await db.pago.count({ where: { estado_compra: "pagado" } }), 0);
  assert.equal((await db.pago.findUnique({ where: { cod_compra: 1 } })).referencia, null);
  const simultaneos = await Promise.allSettled([pagar(1, "us26-a"), pagar(2, "us26-b")]);
  assert.equal(simultaneos.filter((r) => r.status === "fulfilled").length, 1);
  assert.match(simultaneos.find((r) => r.status === "rejected").reason.message, /asientos seleccionados ya no están disponibles/);
  const ganador = await db.pago.findFirst({ where: { estado_compra: "pagado" } });
  assert.equal(ganador.importe.toString(), "1500.5");
  assert.equal(ganador.tarjeta_ultimos4, "1111");
  const reintento = await pagar(ganador.cod_compra, ganador.cod_compra === 1 ? "us26-a" : "us26-b");
  assert.equal(reintento.referencia, ganador.referencia);
  assert.equal(await db.pago.count({ where: { estado_compra: "pagado" } }), 1);
  console.log("PostgreSQL: rechazo, propiedad, rollback real, último asiento concurrente e idempotencia verificados en esquema aislado.");
} finally {
  await db.$disconnect();
  if (creado) await administrador.query(`DROP SCHEMA "${schema}" CASCADE`);
  await administrador.end();
}
