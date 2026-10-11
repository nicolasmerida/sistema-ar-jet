"use client";

import { darDeBajaAvion, resumenBajaAvion } from "@/lib/aviones/actions";
import { CuerpoBaja, tituloBaja } from "../baja/cuerpo-baja";
import { useBaja } from "../baja/use-baja";
import type { AvionListado } from "./aviones-data";
import { Modal } from "./modal";

const MENSAJE_BLOQUEO = "Este avión no se puede dar de baja porque tiene vuelos vigentes que no se pueden cancelar";

export function BajaAvionModal({ avion, onCerrar, onDadoDeBaja }: {
  avion: AvionListado; onCerrar: () => void; onDadoDeBaja: (mensaje: string) => void;
}) {
  const { estado, procesando, confirmar } = useBaja({
    resumir: () => resumenBajaAvion(avion.id),
    darDeBaja: () => darDeBajaAvion(avion.id),
    mensajeBloqueo: MENSAJE_BLOQUEO,
    onDadoDeBaja,
  });

  function cerrar() {
    if (!procesando) onCerrar();
  }

  return (
    <Modal titulo={tituloBaja(estado, "avión")} onCerrar={cerrar}>
      <CuerpoBaja
        estado={estado}
        procesando={procesando}
        nombre={<>el avión <strong className="text-foreground">{avion.matricula}</strong> ({avion.modelo})</>}
        consecuencia="Dejará de estar disponible para asignarlo a vuelos."
        onConfirmar={confirmar}
        onCerrar={cerrar}
      />
    </Modal>
  );
}
