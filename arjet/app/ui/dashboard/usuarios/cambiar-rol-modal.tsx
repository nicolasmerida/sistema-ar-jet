"use client";

import { useState, useTransition } from "react";
import { ETIQUETA_ROL, ROLES_VALIDOS, type Rol, type ResultadoAccionUsuario, type UsuarioListado } from "@/lib/usuarios/tipos";
import { Modal } from "../aviones/modal";

export function CambiarRolModal({ usuario, onCerrar, onConfirmar }: {
  usuario: UsuarioListado;
  onCerrar: () => void;
  onConfirmar: (nuevoRol: Rol) => Promise<ResultadoAccionUsuario>;
}) {
  const [rol, setRol] = useState<Rol>(usuario.rol);
  const [guardando, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirmar() {
    if (guardando || rol === usuario.rol) return;
    startTransition(async () => {
      setError(null);
      try {
        const resultado = await onConfirmar(rol);
        if (!resultado.ok) setError(resultado.mensaje);
      } catch {
        setError("No se pudieron guardar los datos. Por favor, contactá al equipo técnico");
      }
    });
  }

  return (
    <Modal titulo="Cambiar rol" descripcion={`${usuario.nombre} ${usuario.apellido} — ${usuario.email}`} onCerrar={() => { if (!guardando) onCerrar(); }}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="rol" className="text-sm font-medium">Rol</label>
        <select id="rol" value={rol} disabled={guardando} onChange={(event) => setRol(event.target.value as Rol)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30">
          {ROLES_VALIDOS.map((opcion) => <option key={opcion} value={opcion}>{ETIQUETA_ROL[opcion]}</option>)}
        </select>
      </div>
      {error && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-7 flex justify-end gap-3">
        <button type="button" disabled={guardando} onClick={onCerrar} className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-tertiary">Cancelar</button>
        <button type="button" disabled={guardando || rol === usuario.rol} onClick={confirmar} className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{guardando ? "Guardando..." : "Guardar"}</button>
      </div>
    </Modal>
  );
}
