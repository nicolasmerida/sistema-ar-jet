import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import * as pdfLib from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { cargar } from "./modulos.mjs";

export async function verificarDocumentos(db, schema, codigo, propietario) {
  assert.match(schema, /^us26_test_[a-f0-9]{32}$/);
  const tipos = cargar("lib/documentos/tipos.ts");
  const pdf = cargar("lib/documentos/pdf.ts", {
    "server-only": {}, "node:fs/promises": { readFile }, "node:path": { join }, "pdf-lib": pdfLib,
    "@pdf-lib/fontkit": { default: fontkit }, "@/lib/vuelos/fechas": cargar("lib/vuelos/fechas.ts"),
  });
  // Tanto las consultas Prisma como los locks SQL se limitan al esquema ficticio.
  const aislada = {
    documentacion_compra: db.documentacion_compra,
    $queryRaw: (...args) => db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}", public`);
      return tx.$queryRaw(...args);
    }),
    $transaction: (fn) => db.$transaction(fn, { timeout: 20000 }),
  };
  let fallar = true;
  const cola = cargar("lib/documentos/cola.ts", {
    "server-only": {}, "node:crypto": { randomUUID }, "@/src/prisma/db": { db: aislada }, "./tipos": tipos,
    "./pdf": { generarDocumentoPdf: async (datos, documento) => {
      if (fallar && documento.tipo === "ticket") throw new Error("Fallo de prueba al emitir ticket");
      return pdf.generarDocumentoPdf(datos, documento);
    } },
  });
  const antes = await db.documentacion_compra.findUniqueOrThrow({ where: { cod_compra: codigo } });
  await db.usuario.update({ where: { clerk_id: propietario }, data: { nombre: "Modificado después de pagar" } });
  await db.vuelo.update({ where: { id_vuelo: 1 }, data: { numero: "AN 999", precio_economy: "99999" } });
  assert.equal(await cola.procesarSiguienteDocumento(codigo), true);
  assert.equal((await db.pago.findUnique({ where: { cod_compra: codigo } })).estado_compra, "pagado");
  assert.equal((await db.documentacion_compra.findUnique({ where: { cod_compra: codigo } })).estado, "pendiente");
  assert.equal(await db.documento.count({ where: { emitido_en: { not: null } } }), 1);
  const factura = await db.documento.findFirstOrThrow({ where: { tipo: "factura" } });
  assert.equal(await cola.procesarSiguienteDocumento(codigo), false);
  fallar = false;
  await db.documentacion_compra.update({ where: { cod_compra: codigo }, data: {
    estado: "procesando", bloqueo_token: "worker-interrumpido", bloqueo_hasta: new Date(Date.now() - 1000), proximo_intento: new Date(Date.now() - 1000),
  } });
  const paralelas = await Promise.all([cola.procesarSiguienteDocumento(codigo), cola.procesarSiguienteDocumento(codigo)]);
  assert.equal(paralelas.filter(Boolean).length, 1);
  const completa = await db.documentacion_compra.findUniqueOrThrow({ where: { cod_compra: codigo } });
  assert.equal(completa.estado, "completa");
  assert.deepEqual(completa.datos, antes.datos);
  assert.equal(await db.documento.count(), 2);
  assert.equal(await db.documento.count({ where: { emitido_en: { not: null } } }), 2);
  const mismaFactura = await db.documento.findUniqueOrThrow({ where: { id: factura.id } });
  assert.deepEqual(Buffer.from(mismaFactura.pdf), Buffer.from(factura.pdf));
  for (const d of await db.documento.findMany()) assert.equal((await pdfLib.PDFDocument.load(d.pdf)).getPageCount(), 1);
  assert.equal(await cola.procesarSiguienteDocumento(codigo), false);
  const data = cargar("lib/documentos/data.ts", { "server-only": {}, "@/src/prisma/db": { db }, "./tipos": tipos });
  assert.equal(await data.obtenerArchivoPrivado(factura.id, "otro-usuario"), null);
  assert.ok((await data.obtenerArchivoPrivado(factura.id, propietario)).pdf);
  await db.pasaje.updateMany({ where: { compra: codigo }, data: { cancelado: true } });
  await db.pago.update({ where: { cod_compra: codigo }, data: { estado_compra: "cancelado" } });
  const cancelada = await data.obtenerDocumentacionCompra(codigo, propietario);
  assert.equal(cancelada.documentos.find((d) => d.tipo === "ticket").estado, "Cancelado");
  assert.ok((await data.obtenerArchivoPrivado(factura.id, propietario)).pdf);
  console.log("US-27 PostgreSQL: emisión parcial, recuperación de worker, exclusión concurrente, PDFs reales, snapshot inmutable, privacidad e historial tras cancelación verificados.");
}
