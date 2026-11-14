import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/src/prisma/db";
import { leerDatosDocumentacion } from "./tipos";

const seleccion = {
  cod_compra: true, estado: true, datos: true,
  pago: { select: { estado_compra: true } },
  documentos: { orderBy: { clave: "asc" }, select: {
    id: true, numero: true, tipo: true, id_pasaje: true, emitido_en: true,
    pasaje: { select: { cancelado: true, presentado: true, viaje: { select: { estado: true } } } },
  } },
} satisfies Prisma.documentacion_compraSelect;

function aVista(compra: Prisma.documentacion_compraGetPayload<{ select: typeof seleccion }>) {
  const datos = leerDatosDocumentacion(compra.datos);
  return {
    codigo: compra.cod_compra, estado: compra.estado, estadoCompra: compra.pago.estado_compra, datos,
    documentos: compra.documentos.map((d) => ({
      id: d.id, numero: d.numero, tipo: d.tipo, listo: Boolean(d.emitido_en),
      pasajero: datos.pasajes.find((p) => p.idPasaje === d.id_pasaje),
      estado: d.tipo === "ticket" && (d.pasaje?.cancelado || d.pasaje?.viaje.estado === "cancelado" || ["cancelado", "reembolsado"].includes(compra.pago.estado_compra)) ? "Cancelado" :
        d.pasaje?.presentado ? "Presentado" : d.emitido_en ? d.tipo === "factura" ? "Emitida" : "Emitido" : "Pendiente",
    })),
  };
}

export async function obtenerMisCompras(clerkId: string) {
  const compras = await db.documentacion_compra.findMany({
    where: { pago: { reserva: { usuario: { clerk_id: clerkId } } } }, orderBy: { pago: { fecha_pago: "desc" } }, select: seleccion,
  });
  return compras.map(aVista);
}

export async function obtenerDocumentacionCompra(codigo: number, clerkId: string) {
  const compra = await db.documentacion_compra.findFirst({
    where: { cod_compra: codigo, pago: { reserva: { usuario: { clerk_id: clerkId } } } }, select: seleccion,
  });
  return compra ? aVista(compra) : null;
}

export function obtenerArchivoPrivado(id: string, clerkId: string) {
  return db.documento.findFirst({
    where: { id, compra: { pago: { reserva: { usuario: { clerk_id: clerkId } } } } },
    select: { numero: true, tipo: true, pdf: true, emitido_en: true },
  });
}

export type DocumentacionVista = NonNullable<Awaited<ReturnType<typeof obtenerDocumentacionCompra>>>;
