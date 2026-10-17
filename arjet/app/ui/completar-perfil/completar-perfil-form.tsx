"use client";

import { useState, useTransition } from "react";
import { completarPerfil } from "@/lib/usuarios/actions";
import { validarPerfil, type DatosPerfil, type ErroresPerfil } from "@/lib/usuarios/validacion";

export function CompletarPerfilForm() {
  const [datos, setDatos] = useState<DatosPerfil>({ dni: "" });
  const [tocado, setTocado] = useState(false);
  const [erroresGuardado, setErroresGuardado] = useState<ErroresPerfil>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, startTransition] = useTransition();
  const errores = validarPerfil(datos);
  const puedeGuardar = Object.keys(errores).length === 0 && !guardando;
  const error = erroresGuardado.dni ?? (tocado ? errores.dni : undefined);

  function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTocado(true);
    if (!puedeGuardar) return;
    startTransition(async () => {
      setErrorGeneral(null);
      try {
        const resultado = await completarPerfil(datos);
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

  return (
    <form onSubmit={enviar} noValidate className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="dni" className="text-sm font-medium">
          Documento <span className="text-red-600">*</span>
        </label>
        <input
          id="dni"
          name="dni"
          type="text"
          autoComplete="off"
          placeholder="40123456"
          disabled={guardando}
          value={datos.dni}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "dni-error" : undefined}
          onChange={(event) => {
            setDatos({ dni: event.target.value });
            setErroresGuardado({});
            setErrorGeneral(null);
          }}
          onBlur={() => setTocado(true)}
          className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:ring-2 ${
            error
              ? "border-red-500 bg-red-50/40 focus:ring-red-200"
              : "border-zinc-300 focus:border-primary focus:ring-primary/30"
          }`}
        />
        {error && (
          <p id="dni-error" className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
      {errorGeneral && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorGeneral}
        </p>
      )}
      <button
        type="submit"
        disabled={!puedeGuardar}
        className="mt-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {guardando ? "Guardando..." : "Continuar"}
      </button>
    </form>
  );
}
