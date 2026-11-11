import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type { DocumentacionVista } from "@/lib/documentos/data";
import { dinero, fechaHora } from "@/app/ui/vuelos/reserva/formato";
import { DocumentosCompra } from "./documentos-compra";

export function DetalleCompra({ compra }: { compra: DocumentacionVista }) {
  const datos = compra.datos;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Compra RES-{compra.codigo}</h1>
      <p className={`flex items-start gap-2 border-l-4 p-4 text-sm ${compra.estadoCompra === "pagado" ? "border-green-600 bg-green-50 text-green-800" : "border-zinc-400 bg-tertiary text-zinc-600"}`}>
        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />{compra.estadoCompra === "pagado" ? "Compra realizada correctamente" : `Estado de la compra: ${compra.estadoCompra}`}
      </p>
      <dl className="grid gap-5 sm:grid-cols-2">
        <div><dt className="text-sm text-zinc-500">Fecha de compra</dt><dd className="mt-1 text-sm font-medium">{fechaHora(datos.fecha)}</dd></div>
        <div><dt className="text-sm text-zinc-500">Total abonado</dt><dd className="mt-1 text-xl font-semibold text-secondary">{dinero(datos.importe)}</dd></div>
        <div><dt className="text-sm text-zinc-500">Comprador</dt><dd className="mt-1 break-words text-sm">{datos.comprador.nombre} {datos.comprador.apellido}</dd></div>
        <div><dt className="text-sm text-zinc-500">Documento</dt><dd className="mt-1 text-sm">{datos.comprador.dni}</dd></div>
      </dl>
      <DocumentosCompra compra={compra} />
      <Link href="/vuelos/compras" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-secondary"><ArrowLeft className="size-4" aria-hidden="true" />Volver a mis compras</Link>
    </div>
  );
}
