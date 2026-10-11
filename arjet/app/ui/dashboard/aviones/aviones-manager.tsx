"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { crearAvion, actualizarAvion } from "@/lib/aviones/actions";
import type { DatosAvion } from "@/lib/aviones/validacion";
import type { ResultadoAccionAvion } from "@/lib/aviones/tipos";
import { type FiltroEstado, SelectorEstado, filtrarPorEstado } from "../baja/filtro-estado";
import { AvionFormModal } from "./avion-form-modal";
import type { AvionListado } from "./aviones-data";
import { AvionesTable } from "./aviones-table";
import { Aviso, type DatosAviso } from "./aviso";
import { BajaAvionModal } from "./baja-avion-modal";
import { Buscador } from "./buscador";

type ModalAbierto = { tipo: "crear" } | { tipo: "editar" | "baja"; avion: AvionListado } | null;

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function mensajeVacio(total: number, hayBusqueda: boolean, filtro: FiltroEstado) {
  if (total === 0) return "Todavía no hay aviones registrados.";
  if (hayBusqueda) return "No hay aviones que coincidan con la búsqueda.";
  if (filtro === "de_baja") return "No hay aviones dados de baja.";
  if (filtro === "activo") return "No hay aviones activos.";
  return "Todavía no hay aviones registrados.";
}

export function AvionesManager({ aviones }: { aviones: AvionListado[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("activo");
  const [modal, setModal] = useState<ModalAbierto>(null);
  const [aviso, setAviso] = useState<DatosAviso | null>(null);
  const termino = normalizar(busqueda.trim());
  const filtrados = filtrarPorEstado(aviones, filtroEstado)
    .filter((avion) => normalizar(`${avion.matricula} ${avion.modelo}`).includes(termino));

  async function guardar(datos: DatosAvion): Promise<ResultadoAccionAvion> {
    const editado = modal?.tipo === "editar" ? modal.avion : undefined;
    const resultado = editado ? await actualizarAvion(editado.id, datos) : await crearAvion(datos);
    if (resultado.ok) {
      setModal(null);
      setAviso({ tipo: "exito", mensaje: resultado.mensaje });
    }
    return resultado;
  }

  function dadoDeBaja(mensaje: string) {
    setModal(null);
    setAviso({ tipo: "exito", mensaje });
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
      <div className="flex flex-wrap items-center gap-3">
        <Buscador valor={busqueda} onCambiar={setBusqueda} />
        <SelectorEstado valor={filtroEstado} onCambiar={setFiltroEstado} etiqueta="Mostrar aviones" />
      </div>
      {aviso && <Aviso {...aviso} onCerrar={() => setAviso(null)} />}
      <AvionesTable aviones={filtrados} mensajeVacio={mensajeVacio(aviones.length, Boolean(termino), filtroEstado)} onEditar={(avion) => setModal({ tipo: "editar", avion })} onDarDeBaja={(avion) => setModal({ tipo: "baja", avion })} />
      {modal?.tipo === "crear" && <AvionFormModal onCerrar={() => setModal(null)} onGuardar={guardar} />}
      {modal?.tipo === "editar" && <AvionFormModal key={modal.avion.id} avion={modal.avion} onCerrar={() => setModal(null)} onGuardar={guardar} />}
      {modal?.tipo === "baja" && <BajaAvionModal key={modal.avion.id} avion={modal.avion} onCerrar={() => setModal(null)} onDadoDeBaja={dadoDeBaja} />}
    </div>
  );
}
