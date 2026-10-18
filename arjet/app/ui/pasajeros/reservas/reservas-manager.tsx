"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Tickets, CheckCircle2 } from "lucide-react";
import type { ReservaCliente } from "@/lib/pasajeros/mis-reservas-data";
import { ReservaItem, type SeleccionCancelacion } from "./reserva-item";
import { CancelarModal } from "./cancelar-modal";

export function ReservasManager({ reservas }: { reservas: ReservaCliente[] }) {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<SeleccionCancelacion | null>(null);
  const [mensaje, setMensaje] = useState("");
  return (
    <div className="flex flex-col gap-5">
      {mensaje && <p role="status" className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800"><CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />{mensaje}</p>}
      {!reservas.length ? <div className="flex flex-col items-center gap-4 bg-tertiary px-4 py-12 text-center"><Tickets className="size-8 text-zinc-400" aria-hidden="true" /><p className="text-sm text-zinc-600">Todavía no tenés reservas.</p><Link href="/vuelos" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold">Buscar vuelos</Link></div> : reservas.map((reserva) => <ReservaItem key={reserva.codigo} reserva={reserva} cancelar={(valor) => { setMensaje(""); setSeleccion(valor); }} />)}
      {seleccion && <CancelarModal seleccion={seleccion} cerrar={() => setSeleccion(null)} completado={(valor) => { setSeleccion(null); setMensaje(valor); router.refresh(); }} />}
    </div>
  );
}
