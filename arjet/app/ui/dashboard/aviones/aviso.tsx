import { X } from "lucide-react";

export type DatosAviso = { tipo: "exito" | "error"; mensaje: string };

export function Aviso({ tipo, mensaje, onCerrar }: DatosAviso & { onCerrar: () => void }) {
  return (
    <div role={tipo === "error" ? "alert" : "status"} className={`flex items-start justify-between gap-4 rounded-md border px-4 py-3 text-sm ${tipo === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-primary/40 bg-primary/10 text-foreground"}`}>
      <p>{mensaje}</p>
      <button type="button" onClick={onCerrar} aria-label="Cerrar aviso" className="rounded p-0.5 hover:bg-foreground/5"><X className="size-4" aria-hidden="true" /></button>
    </div>
  );
}
