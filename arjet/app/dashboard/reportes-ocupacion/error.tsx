"use client";

import { ERROR_REPORTE } from "@/lib/reportes/ocupacion/tipos";

export default function ErrorReporte({ reset }: { reset: () => void }) {
  return (
    <div className="p-6" role="alert">
      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{ERROR_REPORTE}</p>
      <button onClick={reset} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold hover:bg-primary/85">Reintentar</button>
    </div>
  );
}
