"use client";

import { useState } from "react";
import { cambiarRolUsuario, darDeBajaUsuario } from "@/lib/usuarios/actions";
import type { Rol, ResultadoAccionUsuario, UsuarioListado } from "@/lib/usuarios/tipos";
import { Aviso, type DatosAviso } from "../aviones/aviso";
import { Buscador } from "./buscador";
import { CambiarRolModal } from "./cambiar-rol-modal";
import { DarDeBajaModal } from "./dar-de-baja-modal";
import { UsuariosTable } from "./usuarios-table";

type ModalAbierto = { tipo: "rol" | "baja"; usuario: UsuarioListado } | null;

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function UsuariosManager({ usuarios, miClerkId }: { usuarios: UsuarioListado[]; miClerkId: string }) {
  const [busqueda, setBusqueda] = useState("");
  const [modal, setModal] = useState<ModalAbierto>(null);
  const [aviso, setAviso] = useState<DatosAviso | null>(null);
  const termino = normalizar(busqueda.trim());
  const filtrados = usuarios.filter((usuario) =>
    normalizar(`${usuario.nombre} ${usuario.apellido} ${usuario.email} ${usuario.dni ?? ""}`).includes(termino),
  );

  async function cambiarRol(nuevoRol: Rol): Promise<ResultadoAccionUsuario> {
    if (modal?.tipo !== "rol") return { ok: false, mensaje: "Seleccioná un usuario" };
    const resultado = await cambiarRolUsuario(modal.usuario.clerkId, nuevoRol);
    if (resultado.ok) {
      setModal(null);
      setAviso({ tipo: "exito", mensaje: resultado.mensaje });
    }
    return resultado;
  }

  async function darDeBaja(): Promise<ResultadoAccionUsuario> {
    if (modal?.tipo !== "baja") return { ok: false, mensaje: "Seleccioná un usuario" };
    const resultado = await darDeBajaUsuario(modal.usuario.clerkId);
    if (resultado.ok) {
      setModal(null);
      setAviso({ tipo: "exito", mensaje: resultado.mensaje });
    }
    return resultado;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Gestión de usuarios</h1>
        <p className="mt-1 text-sm text-zinc-500">Consultá las cuentas del sistema, cambiá su rol o dalas de baja.</p>
      </div>
      <Buscador valor={busqueda} onCambiar={setBusqueda} />
      {aviso && <Aviso {...aviso} onCerrar={() => setAviso(null)} />}
      <UsuariosTable
        usuarios={filtrados}
        hayBusqueda={Boolean(termino)}
        miClerkId={miClerkId}
        onCambiarRol={(usuario) => setModal({ tipo: "rol", usuario })}
        onDarDeBaja={(usuario) => setModal({ tipo: "baja", usuario })}
      />
      {modal?.tipo === "rol" && <CambiarRolModal usuario={modal.usuario} onCerrar={() => setModal(null)} onConfirmar={cambiarRol} />}
      {modal?.tipo === "baja" && <DarDeBajaModal usuario={modal.usuario} onCerrar={() => setModal(null)} onConfirmar={darDeBaja} />}
    </div>
  );
}
