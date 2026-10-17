"use client";

import { useState, useTransition } from "react";
import type { ResultadoAccionUsuario, UsuarioListado } from "@/lib/usuarios/tipos";
import { Modal } from "../aviones/modal";

export function DarDeBajaModal({ usuario, onCerrar, onConfirmar }: {
  usuario: UsuarioListado;
  onCerrar: () => void;
  onConfirmar: () => Promise<ResultadoAccionUsuario>;
}) {
  const [eliminando, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirmar() {
    if (eliminando) return;
    startTransition(async () => {
      setError(null);
      try {
        const resultado = await onConfirmar();
        if (!resultado.ok) setError(resultado.mensaje);
      } catch {
        setError("No se pudieron guardar los datos. Por favor, contactá al equipo técnico");
      }
    });
  }

  return (
    <Modal titulo="Dar de baja usuario" onCerrar={() => { if (!eliminando) onCerrar(); }}>
      <p className="text-sm text-zinc-600">¿Está seguro de que quiere dar de baja a <strong className="text-foreground">{usuario.nombre} {usuario.apellido}</strong> ({usuario.email})?</p>
      <p className="mt-3 text-sm text-zinc-500">La cuenta queda bloqueada y ya no va a poder iniciar sesión.</p>
      {error && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-7 flex justify-end gap-3">
        <button type="button" disabled={eliminando} onClick={onCerrar} className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-tertiary">No, cancelar</button>
        <button type="button" disabled={eliminando} onClick={confirmar} className="rounded-md bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50">{eliminando ? "Procesando..." : "Sí, dar de baja"}</button>
      </div>
    </Modal>
  );
}
