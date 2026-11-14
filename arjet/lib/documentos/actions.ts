"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/src/prisma/db";
import { ROL_POR_DEFECTO } from "@/lib/usuarios/tipos";
import { procesarSiguienteDocumento } from "./cola";

export async function reintentarDocumentacion(codigo: unknown) {
  try {
    const usuario = await currentUser();
    if (!usuario || usuario.banned || (usuario.publicMetadata.role ?? ROL_POR_DEFECTO) !== ROL_POR_DEFECTO) return { ok: false, mensaje: "No tiene permisos para acceder a esta sección" };
    if (typeof codigo !== "number" || !Number.isSafeInteger(codigo) || codigo <= 0) return { ok: false, mensaje: "La compra no es válida" };
    const propia = await db.documentacion_compra.findFirst({ where: { cod_compra: codigo, pago: { reserva: { usuario: { clerk_id: usuario.id } } } }, select: { estado: true } });
    if (!propia) return { ok: false, mensaje: "No tiene permisos para acceder a esta sección" };
    if (propia.estado !== "completa") {
      await db.documentacion_compra.updateMany({
        where: { cod_compra: codigo, estado: { not: "completa" }, OR: [{ bloqueo_hasta: null }, { bloqueo_hasta: { lt: new Date() } }] },
        data: { proximo_intento: new Date() },
      });
      await procesarSiguienteDocumento(codigo);
    }
    revalidatePath("/vuelos/compras"); revalidatePath(`/vuelos/reservas/${codigo}`);
    return { ok: true, mensaje: "Se reintentó la generación de la documentación" };
  } catch { return { ok: false, mensaje: "No se pudo registrar la documentación. Por favor, contactá al equipo técnico." }; }
}
