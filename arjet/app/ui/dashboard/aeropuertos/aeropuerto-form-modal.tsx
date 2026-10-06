"use client";

import { useState, useTransition } from "react";
import {
  actualizarAeropuerto,
  crearAeropuerto,
} from "@/lib/aeropuertos/actions";
import type { AeropuertoListado } from "@/lib/aeropuertos/data";
import {
  type DatosAeropuerto,
  type ErroresAeropuerto,
  LARGO_MAXIMO,
  tieneErrores,
  validarAeropuerto,
} from "@/lib/aeropuertos/validacion";
import { MensajeError } from "./aviso";
import { Modal } from "./modal";

type Campo = keyof DatosAeropuerto;

type AeropuertoFormModalProps = {
  // Sin aeropuerto es un alta; con aeropuerto, una edición.
  aeropuerto?: AeropuertoListado;
  onCerrar: () => void;
  onGuardado: (mensaje: string) => void;
};

export function AeropuertoFormModal({
  aeropuerto,
  onCerrar,
  onGuardado,
}: AeropuertoFormModalProps) {
  const [datos, setDatos] = useState<DatosAeropuerto>({
    codigo: aeropuerto?.codigo ?? "",
    nombre: aeropuerto?.nombre ?? "",
    ciudad: aeropuerto?.ciudad ?? "",
    pais: aeropuerto?.pais ?? "",
    direccion: aeropuerto?.direccion ?? "",
  });
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [erroresServidor, setErroresServidor] = useState<ErroresAeropuerto>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, startTransition] = useTransition();

  const erroresLocales = validarAeropuerto(datos);
  const guardadoHabilitado = !tieneErrores(erroresLocales) && !guardando;

  function errorDe(campo: Campo) {
    if (erroresServidor[campo]) return erroresServidor[campo];
    return tocados[campo] ? erroresLocales[campo] : undefined;
  }

  function cambiar(campo: Campo, valor: string) {
    setDatos((anteriores) => ({
      ...anteriores,
      [campo]: campo === "codigo" ? valor.toUpperCase() : valor,
    }));
    setErroresServidor((anteriores) => ({ ...anteriores, [campo]: undefined }));
    setErrorGeneral(null);
  }

  function marcarTocado(campo: Campo) {
    setTocados((anteriores) => ({ ...anteriores, [campo]: true }));
  }

  function cerrar() {
    if (!guardando) onCerrar();
  }

  function guardar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTocados({
      codigo: true,
      nombre: true,
      ciudad: true,
      pais: true,
      direccion: true,
    });
    if (!guardadoHabilitado) return;

    startTransition(async () => {
      const resultado = aeropuerto
        ? await actualizarAeropuerto(aeropuerto.id, datos)
        : await crearAeropuerto(datos);

      if (resultado.ok) {
        onGuardado(resultado.mensaje);
        return;
      }

      if (resultado.errores) {
        setErroresServidor(resultado.errores);
      }
      // El duplicado ya se muestra debajo del campo código.
      if (!resultado.errores?.codigo) {
        setErrorGeneral(resultado.mensaje);
      }
    });
  }

  return (
    <Modal
      titulo={aeropuerto ? "Editar aeropuerto" : "Nuevo aeropuerto"}
      descripcion="Ingresá los datos del aeropuerto. Todos los campos son obligatorios."
      deshabilitarCerrar={guardando}
      onCerrar={cerrar}
    >
      <form onSubmit={guardar} noValidate className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
          <CampoTexto
            id="codigo"
            label="Código IATA"
            valor={datos.codigo}
            error={errorDe("codigo")}
            maxLength={LARGO_MAXIMO.codigo}
            placeholder="SLA"
            autoFocus
            disabled={guardando}
            className="font-mono uppercase"
            onCambiar={(valor) => cambiar("codigo", valor)}
            onSalir={() => marcarTocado("codigo")}
          />
          <CampoTexto
            id="nombre"
            label="Nombre"
            valor={datos.nombre}
            error={errorDe("nombre")}
            maxLength={LARGO_MAXIMO.nombre}
            placeholder="Martín Miguel de Güemes"
            disabled={guardando}
            onCambiar={(valor) => cambiar("nombre", valor)}
            onSalir={() => marcarTocado("nombre")}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <CampoTexto
            id="ciudad"
            label="Ciudad"
            valor={datos.ciudad}
            error={errorDe("ciudad")}
            maxLength={LARGO_MAXIMO.ciudad}
            placeholder="Salta"
            disabled={guardando}
            onCambiar={(valor) => cambiar("ciudad", valor)}
            onSalir={() => marcarTocado("ciudad")}
          />
          <CampoTexto
            id="pais"
            label="País"
            valor={datos.pais}
            error={errorDe("pais")}
            maxLength={LARGO_MAXIMO.pais}
            placeholder="Argentina"
            disabled={guardando}
            onCambiar={(valor) => cambiar("pais", valor)}
            onSalir={() => marcarTocado("pais")}
          />
        </div>

        <CampoTexto
          id="direccion"
          label="Dirección"
          valor={datos.direccion}
          error={errorDe("direccion")}
          maxLength={LARGO_MAXIMO.direccion}
          placeholder="Ruta Nacional 51, km 5"
          disabled={guardando}
          onCambiar={(valor) => cambiar("direccion", valor)}
          onSalir={() => marcarTocado("direccion")}
        />

        {errorGeneral && <MensajeError mensaje={errorGeneral} />}

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={cerrar}
            disabled={guardando}
            className="rounded-md border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-tertiary disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!guardadoHabilitado}
            className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

type CampoTextoProps = {
  id: Campo;
  label: string;
  valor: string;
  error?: string;
  maxLength: number;
  placeholder: string;
  autoFocus?: boolean;
  className?: string;
  disabled?: boolean;
  onCambiar: (valor: string) => void;
  onSalir: () => void;
};

function CampoTexto({
  id,
  label,
  valor,
  error,
  maxLength,
  placeholder,
  autoFocus,
  className = "",
  disabled = false,
  onCambiar,
  onSalir,
}: CampoTextoProps) {
  const idError = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label} <span className="text-red-600">*</span>
      </label>
      <input
        id={id}
        name={id}
        type="text"
        value={valor}
        maxLength={maxLength}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        required
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        onChange={(event) => onCambiar(event.target.value)}
        onBlur={onSalir}
        className={`rounded-md border px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 ${
          error
            ? "border-red-500 bg-red-50/40 focus:border-red-500 focus:ring-red-200"
            : "border-zinc-300 focus:border-primary focus:ring-primary/30"
        } ${className}`}
      />
      {error && (
        <p id={idError} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
