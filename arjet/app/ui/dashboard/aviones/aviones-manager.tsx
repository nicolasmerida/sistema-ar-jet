"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { validarAvion, type DatosAvion, type ErroresAvion } from "@/lib/aviones/validacion";
import { AvionFormModal } from "./avion-form-modal";
import { avionesEjemplo, type AvionListado } from "./aviones-data";
import { AvionesTable } from "./aviones-table";
import { Aviso, type DatosAviso } from "./aviso";
import { Buscador } from "./buscador";
import { EliminarAvionModal } from "./eliminar-avion-modal";

type ModalAbierto = { tipo: "crear" } | { tipo: "editar" | "eliminar"; avion: AvionListado } | null;

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function AvionesManager() {
  const [aviones, setAviones] = useState(avionesEjemplo);
  const [busqueda, setBusqueda] = useState("");
  const [modal, setModal] = useState<ModalAbierto>(null);
  const [aviso, setAviso] = useState<DatosAviso | null>(null);
  const termino = normalizar(busqueda.trim());
  const filtrados = aviones.filter((avion) => normalizar(`${avion.matricula} ${avion.modelo}`).includes(termino));

  function guardar(datos: DatosAvion): ErroresAvion {
    const errores = validarAvion(datos);
    if (Object.keys(errores).length) return errores;
    const editado = modal?.tipo === "editar" ? modal.avion : undefined;
    const matricula = datos.matricula.trim().toUpperCase();
    if (aviones.some((avion) => avion.id !== editado?.id && avion.matricula.toUpperCase() === matricula))
      return { matricula: "Ya existe un avión con esa matrícula" };
    const avion: AvionListado = {
      id: editado?.id ?? Math.max(0, ...aviones.map((item) => item.id)) + 1,
      matricula,
      modelo: datos.modelo.trim(),
      capacidadEconomy: Number(datos.capacidadEconomy),
      capacidadPrimera: Number(datos.capacidadPrimera),
      vuelosVigentes: editado?.vuelosVigentes ?? 0,
    };
    setAviones((previos) => editado ? previos.map((item) => item.id === editado.id ? avion : item) : [...previos, avion]);
    setModal(null);
    setAviso({ tipo: "exito", mensaje: editado ? "Avión actualizado correctamente" : "Avión registrado correctamente" });
    return {};
  }

  function eliminar() {
    if (modal?.tipo !== "eliminar") return;
    const avion = aviones.find((item) => item.id === modal.avion.id);
    if (!avion) return;
    if (avion.vuelosVigentes > 0) {
      setAviso({ tipo: "error", mensaje: "No se puede dar de baja un avión asignado a vuelos vigentes" });
      return;
    }
    setAviones((previos) => previos.filter((item) => item.id !== avion.id));
    setModal(null);
    setAviso({ tipo: "exito", mensaje: "Avión dado de baja correctamente" });
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
      <p className="text-xs text-zinc-500">Vista de demostración: los cambios se conservan hasta recargar la página.</p>
      {modal?.tipo === "crear" && <AvionFormModal onCerrar={() => setModal(null)} onGuardar={guardar} />}
      {modal?.tipo === "editar" && <AvionFormModal key={modal.avion.id} avion={modal.avion} onCerrar={() => setModal(null)} onGuardar={guardar} />}
      {modal?.tipo === "eliminar" && <EliminarAvionModal avion={modal.avion} onCerrar={() => setModal(null)} onConfirmar={eliminar} />}
    </div>
  );
}
