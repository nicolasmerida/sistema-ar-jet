"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { crearAvion, actualizarAvion, eliminarAvion } from "@/lib/aviones/actions";
import type { DatosAvion } from "@/lib/aviones/validacion";
import type { ResultadoAccionAvion } from "@/lib/aviones/tipos";
import { AvionFormModal } from "./avion-form-modal";
import type { AvionListado } from "./aviones-data";
import { AvionesTable } from "./aviones-table";
import { Aviso, type DatosAviso } from "./aviso";
import { Buscador } from "./buscador";
import { EliminarAvionModal } from "./eliminar-avion-modal";

type ModalAbierto = { tipo: "crear" } | { tipo: "editar" | "eliminar"; avion: AvionListado } | null;

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function AvionesManager({ aviones }: { aviones: AvionListado[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [modal, setModal] = useState<ModalAbierto>(null);
  const [aviso, setAviso] = useState<DatosAviso | null>(null);
  const termino = normalizar(busqueda.trim());
  const filtrados = aviones.filter((avion) => normalizar(`${avion.matricula} ${avion.modelo}`).includes(termino));

  async function guardar(datos: DatosAvion): Promise<ResultadoAccionAvion> {
    const editado = modal?.tipo === "editar" ? modal.avion : undefined;
    const resultado = editado ? await actualizarAvion(editado.id, datos) : await crearAvion(datos);
    if (resultado.ok) {
      setModal(null);
      setAviso({ tipo: "exito", mensaje: resultado.mensaje });
    }
    return resultado;
  }

  async function eliminar(): Promise<ResultadoAccionAvion> {
    if (modal?.tipo !== "eliminar") return { ok: false, mensaje: "Seleccioná un avión" };
    const resultado = await eliminarAvion(modal.avion.id);
    if (resultado.ok) {
      setModal(null);
      setAviso({ tipo: "exito", mensaje: resultado.mensaje });
    }
    return resultado;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Gestión de aviones</h1>
          <p className="mt-1 text-sm text-zinc-500">Administrá los aviones de la flota y su capacidad de asientos por clase.</p>
        </div>
        <button type="button" onClick={() => setModal({ tipo: "crear" })} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
          <Plus className="size-4" aria-hidden="true" />Nuevo avión
        </button>
      </div>
      <Buscador valor={busqueda} onCambiar={setBusqueda} />
      {aviso && <Aviso {...aviso} onCerrar={() => setAviso(null)} />}
      <AvionesTable aviones={filtrados} hayBusqueda={Boolean(termino)} onEditar={(avion) => setModal({ tipo: "editar", avion })} onEliminar={(avion) => setModal({ tipo: "eliminar", avion })} />
      {modal?.tipo === "crear" && <AvionFormModal onCerrar={() => setModal(null)} onGuardar={guardar} />}
      {modal?.tipo === "editar" && <AvionFormModal key={modal.avion.id} avion={modal.avion} onCerrar={() => setModal(null)} onGuardar={guardar} />}
      {modal?.tipo === "eliminar" && <EliminarAvionModal avion={modal.avion} onCerrar={() => setModal(null)} onConfirmar={eliminar} />}
    </div>
  );
}
