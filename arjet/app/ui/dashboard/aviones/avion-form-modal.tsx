"use client";

import { useState, useTransition } from "react";
import { validarAvion, type DatosAvion, type ErroresAvion } from "@/lib/aviones/validacion";
import type { ResultadoAccionAvion } from "@/lib/aviones/tipos";
import type { AvionListado } from "./aviones-data";
import { Modal } from "./modal";

type Campo = keyof DatosAvion;

export function AvionFormModal({ avion, onCerrar, onGuardar }: {
  avion?: AvionListado;
  onCerrar: () => void;
  onGuardar: (datos: DatosAvion) => Promise<ResultadoAccionAvion>;
}) {
  const [datos, setDatos] = useState<DatosAvion>({
    matricula: avion?.matricula ?? "",
    modelo: avion?.modelo ?? "",
    capacidadEconomy: avion ? String(avion.capacidadEconomy) : "",
    capacidadPrimera: avion ? String(avion.capacidadPrimera) : "",
  });
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [erroresGuardado, setErroresGuardado] = useState<ErroresAvion>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, startTransition] = useTransition();
  const errores = validarAvion(datos);
  const puedeGuardar = Object.keys(errores).length === 0 && !guardando;

  function cambiar(campo: Campo, valor: string) {
    setDatos((previos) => ({ ...previos, [campo]: campo === "matricula" ? valor.toUpperCase() : valor }));
    setErroresGuardado((previos) => ({ ...previos, [campo]: undefined }));
    setErrorGeneral(null);
  }

  function guardar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTocados({ matricula: true, modelo: true, capacidadEconomy: true, capacidadPrimera: true });
    if (!puedeGuardar) return;
    startTransition(async () => {
      setErrorGeneral(null);
      try {
        const resultado = await onGuardar(datos);
        if (!resultado.ok) {
          setErroresGuardado(resultado.errores ?? {});
          if (!resultado.errores || Object.keys(resultado.errores).length === 0) {
            setErrorGeneral(resultado.mensaje);
          }
        }
      } catch {
        setErrorGeneral("No se pudieron guardar los datos. Por favor, contactá al equipo técnico");
      }
    });
  }

  const campos: { campo: Campo; etiqueta: string; ejemplo: string; numerico?: boolean }[] = [
    { campo: "matricula", etiqueta: "Matrícula", ejemplo: "LV-NEW" },
    { campo: "modelo", etiqueta: "Modelo", ejemplo: "Boeing 737-800" },
    { campo: "capacidadEconomy", etiqueta: "Capacidad Economy", ejemplo: "162", numerico: true },
    { campo: "capacidadPrimera", etiqueta: "Capacidad Primera Clase", ejemplo: "16", numerico: true },
  ];

  return (
    <Modal titulo={avion ? "Editar avión" : "Nuevo avión"} descripcion="Las capacidades deben ser enteros no negativos." onCerrar={() => { if (!guardando) onCerrar(); }}>
      <form onSubmit={guardar} noValidate className="flex flex-col gap-7">
        <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
          {campos.map(({ campo, etiqueta, ejemplo, numerico }) => {
            const error = erroresGuardado[campo] ?? (tocados[campo] ? errores[campo] : undefined);
            const id = `avion-${campo}`;
            return (
              <div key={campo} className="flex flex-col gap-1.5">
                <label htmlFor={id} className="text-sm font-medium">{etiqueta} <span className="text-red-600">*</span></label>
                <input id={id} name={campo} type={numerico ? "number" : "text"} min={numerico ? 0 : undefined} step={numerico ? 1 : undefined}
                  value={datos[campo]} required autoComplete="off" placeholder={ejemplo} disabled={guardando}
                  readOnly={campo === "matricula" && Boolean(avion)}
                  aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
                  onChange={(event) => cambiar(campo, event.target.value)}
                  onBlur={() => setTocados((previos) => ({ ...previos, [campo]: true }))}
                  className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 read-only:bg-tertiary focus:ring-2 ${error ? "border-red-500 bg-red-50/40 focus:ring-red-200" : "border-zinc-300 focus:border-primary focus:ring-primary/30"}`} />
                {error && <p id={`${id}-error`} className="text-xs text-red-600">{error}</p>}
              </div>
            );
          })}
        </div>
        {errorGeneral && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorGeneral}</p>}
        <div className="mt-2 flex justify-end gap-3">
          <button type="button" disabled={guardando} onClick={onCerrar} className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-tertiary">Cancelar</button>
          <button type="submit" disabled={!puedeGuardar} className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{guardando ? "Guardando..." : "Guardar"}</button>
        </div>
      </form>
    </Modal>
  );
}
