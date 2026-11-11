"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Ticket, RotateCcw, LoaderCircle } from "lucide-react";
import type { DocumentacionVista } from "@/lib/documentos/data";
import { DOCUMENTACION_PENDIENTE } from "@/lib/documentos/tipos";
import { reintentarDocumentacion } from "@/lib/documentos/actions";

export function DocumentosCompra({ compra }: { compra: DocumentacionVista }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState("");
  const incompleta = compra.estado !== "completa";
  useEffect(() => {
    if (!incompleta) return;
    const timer = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(timer);
  }, [incompleta, router]);

  function reintentar() {
    setError("");
    iniciar(async () => {
      try {
        const resultado = await reintentarDocumentacion(compra.codigo);
        if (!resultado.ok) setError(resultado.mensaje);
        router.refresh();
      } catch { setError("No se pudo registrar la documentación. Por favor, contactá al equipo técnico."); }
    });
  }

  return (
    <section aria-labelledby={`documentos-${compra.codigo}`} className="mt-6 border-t border-zinc-200 pt-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id={`documentos-${compra.codigo}`} className="text-lg font-semibold">Factura y tickets</h2>
        {incompleta && <button type="button" disabled={pendiente} onClick={reintentar} className="inline-flex items-center gap-2 rounded-md border border-secondary/20 px-3 py-2 text-sm font-semibold text-secondary hover:bg-tertiary disabled:opacity-50">
          {pendiente ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="size-4" aria-hidden="true" />}Reintentar
        </button>}
      </div>
      {incompleta && <p role="status" className="mb-4 border-l-4 border-primary bg-tertiary p-4 text-sm">{DOCUMENTACION_PENDIENTE}</p>}
      <ul className="divide-y divide-zinc-200">
        {compra.documentos.map((documento) => {
          const Icon = documento.tipo === "factura" ? FileText : Ticket;
          return <li key={documento.id} className="flex flex-col items-start gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full min-w-0 items-start gap-3 sm:w-auto sm:flex-1">
              <Icon className="mt-1 size-5 shrink-0 text-secondary" aria-hidden="true" />
              <div className="min-w-0"><p className="break-words text-sm font-semibold">{documento.tipo === "factura" ? "Factura" : `Ticket · ${documento.pasajero?.nombre ?? ""} ${documento.pasajero?.apellido ?? ""}`}</p><p className="mt-1 break-all text-xs text-zinc-500">{documento.numero}</p><p className={`mt-1 text-xs ${documento.estado === "Cancelado" ? "text-red-700" : "text-zinc-500"}`}>{documento.estado}</p></div>
            </div>
            {documento.listo ? <a href={`/vuelos/compras/documentos/${documento.id}`} className="inline-flex items-center gap-2 rounded-md border border-secondary/20 px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary hover:text-white" aria-label={`Descargar ${documento.numero}`}><Download className="size-4" aria-hidden="true" />Descargar PDF</a> : <span className="text-xs text-zinc-500">Generación pendiente</span>}
          </li>;
        })}
      </ul>
      {error && <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}
