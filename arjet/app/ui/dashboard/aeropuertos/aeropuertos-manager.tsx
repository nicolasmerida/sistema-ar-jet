"use client";

import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import type { AeropuertoListado } from "@/lib/aeropuertos/data";
import { AeropuertoFormModal } from "./aeropuerto-form-modal";
import { AeropuertosTable } from "./aeropuertos-table";
import { Aviso, type DatosAviso } from "./aviso";
import { Buscador } from "./buscador";
import { EliminarAeropuertoModal } from "./eliminar-aeropuerto-modal";

type ModalAbierto =
  | { tipo: "crear" }
  | { tipo: "editar"; aeropuerto: AeropuertoListado }
  | { tipo: "eliminar"; aeropuerto: AeropuertoListado }
  | null;

export function AeropuertosManager({
  aeropuertos,
}: {
  aeropuertos: AeropuertoListado[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [modal, setModal] = useState<ModalAbierto>(null);
  const [aviso, setAviso] = useState<DatosAviso | null>(null);

  const cerrarModal = useCallback(() => setModal(null), []);
  const cerrarAviso = useCallback(() => setAviso(null), []);

  function finalizarConExito(mensaje: string) {
    setModal(null);
    setAviso({ tipo: "exito", mensaje });
  }

  const filtrados = filtrarAeropuertos(aeropuertos, busqueda);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Gestión de aeropuertos
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Administrá los aeropuertos disponibles como origen y destino de los
            vuelos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ tipo: "crear" })}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          <Plus className="size-4" aria-hidden="true" />
          Nuevo aeropuerto
        </button>
      </div>

      <Buscador valor={busqueda} onCambiar={setBusqueda} />

      <AeropuertosTable
        aeropuertos={filtrados}
        hayBusqueda={busqueda.trim() !== ""}
        onEditar={(aeropuerto) => setModal({ tipo: "editar", aeropuerto })}
        onEliminar={(aeropuerto) => setModal({ tipo: "eliminar", aeropuerto })}
      />

      {modal?.tipo === "crear" && (
        <AeropuertoFormModal
          onCerrar={cerrarModal}
          onGuardado={finalizarConExito}
        />
      )}
      {modal?.tipo === "editar" && (
        <AeropuertoFormModal
          key={modal.aeropuerto.id}
          aeropuerto={modal.aeropuerto}
          onCerrar={cerrarModal}
          onGuardado={finalizarConExito}
        />
      )}
      {modal?.tipo === "eliminar" && (
        <EliminarAeropuertoModal
          key={modal.aeropuerto.id}
          aeropuerto={modal.aeropuerto}
          onCerrar={cerrarModal}
          onEliminado={finalizarConExito}
        />
      )}

      {aviso && <Aviso {...aviso} onCerrar={cerrarAviso} />}
    </div>
  );
}

function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function filtrarAeropuertos(aeropuertos: AeropuertoListado[], busqueda: string) {
  const termino = normalizarTexto(busqueda.trim());
  if (!termino) return aeropuertos;

  return aeropuertos.filter((aeropuerto) =>
    [
      aeropuerto.codigo,
      aeropuerto.nombre,
      aeropuerto.ciudad,
      aeropuerto.pais,
    ].some((valor) => normalizarTexto(valor).includes(termino)),
  );
}
