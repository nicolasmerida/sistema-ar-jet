import "server-only";

import { randomUUID } from "node:crypto";
import { db } from "@/src/prisma/db";
import { leerDatosDocumentacion } from "./tipos";
import { generarDocumentoPdf } from "./pdf";

const ARRIENDO_MS = 120_000;

export async function procesarSiguienteDocumento(codigo?: number): Promise<boolean> {
  const token = randomUUID();
  const tareas = await db.$queryRaw<{ cod_compra: number }[]>`
    WITH elegida AS (
      SELECT cod_compra FROM documentacion_compra
      WHERE estado <> 'completa' AND proximo_intento <= now()
        AND (bloqueo_hasta IS NULL OR bloqueo_hasta < now())
        AND (${codigo ?? null}::int IS NULL OR cod_compra = ${codigo ?? null}::int)
      ORDER BY proximo_intento, cod_compra FOR UPDATE SKIP LOCKED LIMIT 1
    ) UPDATE documentacion_compra d SET estado = 'procesando', intentos = intentos + 1,
      bloqueo_token = ${token}, bloqueo_hasta = now() + interval '2 minutes', actualizado = now()
      FROM elegida WHERE d.cod_compra = elegida.cod_compra RETURNING d.cod_compra`;
  const id = tareas[0]?.cod_compra;
  if (id === undefined) return false;
  try {
    const tarea = await db.documentacion_compra.findUniqueOrThrow({
      where: { cod_compra: id }, include: { documentos: { select: { id: true, tipo: true, numero: true, id_pasaje: true, emitido_en: true }, orderBy: { clave: "asc" } } },
    });
    const datos = leerDatosDocumentacion(tarea.datos);
    for (const documento of tarea.documentos) {
      if (documento.emitido_en) continue;
      const pdf = await generarDocumentoPdf(datos, documento);
      const guardado = await db.$transaction(async (tx) => {
        const propia = await tx.documentacion_compra.updateMany({
          where: { cod_compra: id, bloqueo_token: token, bloqueo_hasta: { gt: new Date() } },
          data: { bloqueo_hasta: new Date(Date.now() + ARRIENDO_MS) },
        });
        if (!propia.count) return false;
        await tx.documento.updateMany({ where: { id: documento.id, emitido_en: null }, data: { pdf: new Uint8Array(pdf), emitido_en: new Date() } });
        return true;
      });
      if (!guardado) return true;
    }
    await db.documentacion_compra.updateMany({
      where: { cod_compra: id, bloqueo_token: token, documentos: { every: { emitido_en: { not: null } } } },
      data: { estado: "completa", bloqueo_token: null, bloqueo_hasta: null },
    });
  } catch {
    // No persistir datos personales ni perder los PDFs que ya se emitieron.
    const tarea = await db.documentacion_compra.findUnique({ where: { cod_compra: id }, select: { intentos: true } });
    const espera = Math.min(300_000, 5000 * 2 ** Math.min(tarea?.intentos ?? 1, 6));
    await db.documentacion_compra.updateMany({
      where: { cod_compra: id, bloqueo_token: token },
      data: { estado: "pendiente", proximo_intento: new Date(Date.now() + espera), bloqueo_token: null, bloqueo_hasta: null },
    });
  }
  return true;
}
