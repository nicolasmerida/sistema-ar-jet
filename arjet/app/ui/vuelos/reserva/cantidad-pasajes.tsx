"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { MAX_PASAJES_POR_TRANSACCION, validarCantidadPasajes } from "@/lib/pasajeros/reserva-validacion";

export function CantidadPasajes({ cantidad, aviso, pendiente, cambiar, invalidar }: {
  cantidad: number; aviso?: string; pendiente: boolean;
  cambiar: (valor: number) => void; invalidar: (invalida: boolean) => void;
}) {
  const [texto, setTexto] = useState(String(cantidad));
  const errorTexto = validarCantidadPasajes(Number(texto || NaN));
  const error = errorTexto ?? aviso;

  function escribir(valor: string) {
    setTexto(valor);
    const invalida = Boolean(validarCantidadPasajes(Number(valor || NaN)));
    invalidar(invalida);
    if (!invalida) cambiar(Number(valor));
  }

  const boton = "flex size-9 items-center justify-center rounded-md border border-zinc-300 disabled:opacity-40";
  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <label htmlFor="cantidad-pasajeros" className="mr-2 text-sm font-medium">Cantidad de pasajes</label>
        <button type="button" title="Quitar pasajero" aria-label="Quitar pasajero" disabled={pendiente || cantidad <= 1} onClick={() => escribir(String(cantidad - 1))} className={boton}><Minus className="size-4" aria-hidden="true" /></button>
        <input id="cantidad-pasajeros" type="number" inputMode="numeric" min={1} max={MAX_PASAJES_POR_TRANSACCION} step={1} value={texto} disabled={pendiente}
          aria-invalid={Boolean(error)} aria-describedby={error ? "cantidad-pasajeros-error" : undefined} onChange={(e) => escribir(e.target.value)}
          className={`h-9 w-16 rounded-md border text-center text-sm outline-none focus:ring-2 ${error ? "border-red-500 bg-red-50/40 focus:ring-red-200" : "border-zinc-300 focus:border-primary focus:ring-primary/30"}`} />
        <button type="button" title="Agregar pasajero" aria-label="Agregar pasajero" disabled={pendiente || cantidad >= MAX_PASAJES_POR_TRANSACCION} onClick={() => escribir(String(cantidad + 1))} className={boton}><Plus className="size-4" aria-hidden="true" /></button>
      </div>
      {error && <p id="cantidad-pasajeros-error" role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
