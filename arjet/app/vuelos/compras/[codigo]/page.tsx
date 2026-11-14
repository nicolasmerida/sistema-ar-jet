import { notFound } from "next/navigation";
import { exigirPasajero } from "@/lib/pasajeros/sesion";
import { obtenerDocumentacionCompra } from "@/lib/documentos/data";
import { DetalleCompra } from "@/app/ui/pasajeros/compras/detalle-compra";

export default async function CompraPage({ params }: PageProps<"/vuelos/compras/[codigo]">) {
  const id = Number((await params).codigo);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const usuario = await exigirPasajero(`/vuelos/compras/${id}`);
  const compra = await obtenerDocumentacionCompra(id, usuario.id);
  if (!compra) notFound();
  return <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10"><DetalleCompra compra={compra} /></section>;
}
