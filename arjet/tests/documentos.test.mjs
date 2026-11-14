import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as pdfLib from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { cargar } from "./modulos.mjs";

const tipos = cargar("lib/documentos/tipos.ts");
const preparar = cargar("lib/documentos/preparar.ts");
const fechas = cargar("lib/vuelos/fechas.ts");
const persona = { dni: "22222222", nombre: "María", apellido: "González" };
const compra = {
  codigo: 42, fecha: "2026-11-11T15:00:00Z", importe: "30001.00", moneda: "ARS", comprador: persona,
  pasajes: [1, 2].map((id) => ({ idPasaje: id, ...persona, vuelo: "AN 824", origen: "Córdoba (COR)", destino: "Buenos Aires (AEP)", partida: "2099-11-25T19:15:00Z", llegada: "2099-11-25T20:45:00Z", clase: "economy", precio: "15000.50" })),
};

test("emisión: una factura, un ticket por pasaje e identidades estables en reintentos", () => {
  const a = preparar.prepararEmision(compra);
  const b = preparar.prepararEmision(compra);
  assert.equal(a.documentos.create.filter((d) => d.tipo === "factura").length, 1);
  assert.equal(a.documentos.create.filter((d) => d.tipo === "ticket").length, 2);
  assert.equal(a.datos.numeroFactura, b.datos.numeroFactura);
  assert.equal(JSON.stringify(a.documentos), JSON.stringify(b.documentos));
  const copia = structuredClone(compra);
  const snapshot = preparar.prepararEmision(copia);
  copia.comprador.nombre = "Otro nombre";
  copia.pasajes[0].precio = "999999";
  assert.equal(snapshot.datos.comprador.nombre, "María");
  assert.equal(snapshot.datos.pasajes[0].precio, "15000.50");
  assert.throws(() => tipos.leerDatosDocumentacion({}), /incompleta/);
});

test("PDFs reales: factura y ticket válidos con fuente Unicode y varias páginas", async () => {
  const pdf = cargar("lib/documentos/pdf.ts", {
    "server-only": {}, "node:fs/promises": { readFile }, "node:path": { join }, "pdf-lib": pdfLib,
    "@pdf-lib/fontkit": { default: fontkit }, "@/lib/vuelos/fechas": fechas,
  });
  const datos = preparar.prepararEmision(compra);
  const factura = await pdf.generarDocumentoPdf(datos.datos, { tipo: "factura", numero: datos.datos.numeroFactura, id_pasaje: null });
  const ticket = await pdf.generarDocumentoPdf(datos.datos, { tipo: "ticket", numero: "TKT-42-1", id_pasaje: 1 });
  for (const archivo of [factura, ticket]) {
    assert.equal(Buffer.from(archivo).subarray(0, 5).toString(), "%PDF-");
    assert.equal((await pdfLib.PDFDocument.load(archivo)).getPageCount(), 1);
  }
  const extensa = { ...datos.datos, pasajes: Array.from({ length: 9 }, (_, i) => ({ ...compra.pasajes[0], idPasaje: i + 1, nombre: "María Alejandra ".repeat(6), origen: "San Miguel de Tucumán (TUC)" })) };
  const multipagina = await pdf.generarDocumentoPdf(extensa, { tipo: "factura", numero: "FAC-2026-00000042", id_pasaje: null });
  assert.ok((await pdfLib.PDFDocument.load(multipagina)).getPageCount() > 1);
  await assert.rejects(pdf.generarDocumentoPdf(datos.datos, { tipo: "ticket", numero: "TKT-42-99", id_pasaje: 99 }), /no pertenece/);
  await mkdir(".next/documentos-prueba", { recursive: true });
  await writeFile(".next/documentos-prueba/factura.pdf", factura);
  await writeFile(".next/documentos-prueba/ticket.pdf", ticket);
  await writeFile(".next/documentos-prueba/factura-extensa.pdf", multipagina);
});

test("cola: un fallo parcial mantiene lo emitido y el reintento solo genera lo faltante", async () => {
  const metadata = preparar.prepararEmision(compra);
  const documentos = metadata.documentos.create.map((d, i) => ({ ...d, id: String(i), id_pasaje: d.id_pasaje ?? null, emitido_en: null }));
  const tarea = { datos: metadata.datos, intentos: 0, documentos, estado: "pendiente" };
  const llamados = [];
  let fallar = true;
  let token;
  const tabla = {
    findUniqueOrThrow: async () => tarea, findUnique: async () => tarea,
    updateMany: async ({ where, data }) => {
      if (where.bloqueo_token !== token) return { count: 0 };
      if (data.estado) tarea.estado = data.estado;
      return { count: 1 };
    },
  };
  const db = {
    $queryRaw: async (sql, ...valores) => { assert.match(sql.join("?"), /FOR UPDATE SKIP LOCKED/); if (tarea.estado === "completa") return []; token = valores.find((v) => typeof v === "string"); tarea.intentos++; return [{ cod_compra: 42 }]; },
    documentacion_compra: tabla,
    $transaction: async (fn) => fn({ documentacion_compra: tabla, documento: { updateMany: async ({ where, data }) => { const d = documentos.find((d) => d.id === where.id); Object.assign(d, data); return { count: 1 }; } } }),
  };
  const cola = cargar("lib/documentos/cola.ts", {
    "server-only": {}, "node:crypto": { randomUUID: () => "token" }, "@/src/prisma/db": { db }, "./tipos": tipos,
    "./pdf": { generarDocumentoPdf: async (_datos, documento) => { llamados.push(documento.clave); if (fallar && documento.tipo === "ticket") throw new Error("fallo simulado"); return new Uint8Array([37, 80, 68, 70]); } },
  });
  assert.equal(await cola.procesarSiguienteDocumento(42), true);
  assert.equal(tarea.estado, "pendiente");
  assert.ok(documentos[0].emitido_en);
  assert.equal(documentos[1].emitido_en, null);
  fallar = false;
  await cola.procesarSiguienteDocumento(42);
  assert.equal(tarea.estado, "completa");
  assert.equal(llamados.filter((clave) => clave === "factura:42").length, 1);
  assert.equal(await cola.procesarSiguienteDocumento(42), false);
});

test("descarga: exige propietario, devuelve PDF privado y no expone documentos ajenos", async () => {
  let usuario = null;
  let archivo = null;
  const ruta = cargar("app/vuelos/compras/documentos/[id]/route.ts", {
    "@clerk/nextjs/server": { currentUser: async () => usuario }, "@/lib/usuarios/tipos": { ROL_POR_DEFECTO: "cliente" },
    "@/lib/documentos/data": { obtenerArchivoPrivado: async (_id, clerkId) => { assert.equal(clerkId, "propietario"); return archivo; } },
  });
  const params = { params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }) };
  assert.equal((await ruta.GET({}, params)).status, 403);
  usuario = { id: "propietario", publicMetadata: { role: "cliente" } };
  assert.equal((await ruta.GET({}, params)).status, 403);
  archivo = { numero: "FAC-42", tipo: "factura", pdf: null, emitido_en: null };
  assert.equal((await ruta.GET({}, params)).status, 409);
  archivo = { ...archivo, pdf: Buffer.from("%PDF-prueba"), emitido_en: new Date() };
  const respuesta = await ruta.GET({}, params);
  assert.equal(respuesta.status, 200);
  assert.equal(respuesta.headers.get("Content-Type"), "application/pdf");
  assert.equal(respuesta.headers.get("Cache-Control"), "private, no-store");
  assert.match(respuesta.headers.get("Content-Disposition"), /attachment/);
});

test("datos de descarga: el filtro de propiedad se aplica en la consulta a la base", async () => {
  const data = cargar("lib/documentos/data.ts", {
    "server-only": {}, "@/src/prisma/db": { db: { documento: { findFirst: async ({ where }) => {
      assert.equal(where.compra.pago.reserva.usuario.clerk_id, "propietario");
      return null;
    } } } }, "./tipos": tipos,
  });
  assert.equal(await data.obtenerArchivoPrivado("id", "propietario"), null);
});
