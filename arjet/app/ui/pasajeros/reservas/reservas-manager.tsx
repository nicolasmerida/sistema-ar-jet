"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Tickets, CheckCircle2 } from "lucide-react";
import type { ReservaCliente } from "@/lib/pasajeros/mis-reservas-data";
import { ReservaItem, type SeleccionCancelacion } from "./reserva-item";
import { CancelarModal } from "./cancelar-modal";
import type { DocumentacionVista } from "@/lib/documentos/data";
import { DocumentosCompra } from "../compras/documentos-compra";

export function ReservasManager({ reservas, compras }: { reservas: ReservaCliente[]; compras?: DocumentacionVista[] }) {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<SeleccionCancelacion | null>(null);
  const [mensaje, setMensaje] = useState("");
  return (
    <div className="flex flex-col gap-5">
      {mensaje && <p role="status" className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800"><CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />{mensaje}</p>}
      {!reservas.length ? <div className="flex flex-col items-center gap-4 bg-tertiary px-4 py-12 text-center"><Tickets className="size-8 text-zinc-400" aria-hidden="true" /><p className="text-sm text-zinc-600">{compras ? "Todavía no tenés compras." : "Todavía no tenés reservas."}</p><Link href="/vuelos" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold">Buscar vuelos</Link></div> : reservas.map((reserva) => {
        const documentacion = compras?.find((c) => c.codigo === reserva.codigo);
        return <ReservaItem key={reserva.codigo} reserva={reserva} compra={Boolean(compras)} cancelar={(valor) => { setMensaje(""); setSeleccion(valor); }}>{documentacion && <DocumentosCompra compra={documentacion} />}</ReservaItem>;
      })}
      {seleccion && <CancelarModal seleccion={seleccion} cerrar={() => setSeleccion(null)} completado={(valor) => { setSeleccion(null); setMensaje(valor); router.refresh(); }} />}
    </div>
  );
}
