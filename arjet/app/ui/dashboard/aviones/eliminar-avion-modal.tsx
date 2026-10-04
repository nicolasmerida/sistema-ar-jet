import type { AvionListado } from "./aviones-data";
import { Modal } from "./modal";

export function EliminarAvionModal({ avion, onCerrar, onConfirmar }: {
  avion: AvionListado; onCerrar: () => void; onConfirmar: () => void;
}) {
  const bloqueado = avion.vuelosVigentes > 0;
  return (
    <Modal titulo="Dar de baja avión" onCerrar={onCerrar}>
      <p className="text-sm text-zinc-600">¿Está seguro de que quiere dar de baja el avión <strong className="text-foreground">{avion.matricula}</strong> ({avion.modelo})?</p>
      {bloqueado ? (
        <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">No se puede dar de baja un avión asignado a vuelos vigentes</p>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">Dejará de estar disponible para asignarlo a nuevos vuelos.</p>
      )}
      <div className="mt-7 flex justify-end gap-3">
        <button type="button" onClick={onCerrar} className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-tertiary">{bloqueado ? "Cerrar" : "No, cancelar"}</button>
        <button type="button" disabled={bloqueado} onClick={onConfirmar} className="rounded-md bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50">Sí, dar de baja</button>
      </div>
    </Modal>
  );
}
