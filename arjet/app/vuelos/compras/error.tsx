"use client";

import { RotateCcw } from "lucide-react";

export default function ErrorCompras({ reset }: { reset: () => void }) {
  return <section className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-12"><h1 className="text-xl font-semibold">No se pudo cargar la documentación</h1><p className="text-sm text-zinc-500">Por favor, reintentá o contactá al equipo técnico.</p><button type="button" onClick={reset} className="inline-flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold"><RotateCcw className="size-4" aria-hidden="true" />Reintentar</button></section>;
}
