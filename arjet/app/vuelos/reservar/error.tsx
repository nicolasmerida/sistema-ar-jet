"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function ErrorReserva({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto flex max-w-xl flex-col justify-center gap-4 px-6 py-12">
      <h1 className="text-xl font-semibold">No se pudo cargar la reserva</h1>
      <p className="text-sm text-zinc-600">Por favor, reintentá más tarde.</p>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold"><RotateCcw className="size-4" aria-hidden="true" />Reintentar</button>
        <Link href="/vuelos" className="text-sm font-semibold text-secondary underline">Volver a buscar vuelos</Link>
      </div>
    </section>
  );
}
