"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useEffect } from "react";

export type DatosAviso = { tipo: "exito" | "error"; mensaje: string };

type AvisoProps = DatosAviso & { onCerrar: () => void };

export function Aviso({ tipo, mensaje, onCerrar }: AvisoProps) {
  useEffect(() => {
    const timer = setTimeout(onCerrar, 4000);
    return () => clearTimeout(timer);
  }, [mensaje, onCerrar]);

  const Icono = tipo === "exito" ? CircleCheck : CircleAlert;

  return (
    <div
      role={tipo === "exito" ? "status" : "alert"}
      className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-md border px-4 py-3 text-sm shadow-lg ${
        tipo === "exito"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <Icono className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="flex-1">{mensaje}</p>
      <button
        type="button"
        onClick={onCerrar}
        className="rounded p-0.5 opacity-70 transition hover:opacity-100"
        aria-label="Cerrar aviso"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function MensajeError({ mensaje }: { mensaje: string }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {mensaje}
    </p>
  );
}
