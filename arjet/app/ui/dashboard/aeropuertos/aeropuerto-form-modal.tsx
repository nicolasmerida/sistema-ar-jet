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
import { CampoAreaTexto, CampoTexto } from "./campos";
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
    descripcion: aeropuerto?.descripcion ?? "",
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
      descripcion: true,
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
      descripcion="Ingresá los datos del aeropuerto. Los campos marcados con * son obligatorios."
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

        <CampoAreaTexto
          id="descripcion"
          label="Descripción"
          valor={datos.descripcion}
          error={errorDe("descripcion")}
          maxLength={LARGO_MAXIMO.descripcion}
          placeholder="Aeropuerto internacional. Opera vuelos de cabotaje y regionales."
          disabled={guardando}
          onCambiar={(valor) => cambiar("descripcion", valor)}
          onSalir={() => marcarTocado("descripcion")}
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
