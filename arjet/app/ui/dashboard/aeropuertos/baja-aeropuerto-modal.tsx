"use client";

import { darDeBajaAeropuerto, resumenBajaAeropuerto } from "@/lib/aeropuertos/actions";
import type { AeropuertoListado } from "@/lib/aeropuertos/data";
import { CuerpoBaja, tituloBaja } from "../baja/cuerpo-baja";
import { useBaja } from "../baja/use-baja";
import { Modal } from "./modal";

const MENSAJE_BLOQUEO =
  "Este aeropuerto no se puede dar de baja porque tiene vuelos vigentes que no se pueden cancelar";

export function BajaAeropuertoModal({ aeropuerto, onCerrar, onDadoDeBaja }: {
  aeropuerto: AeropuertoListado;
  onCerrar: () => void;
  onDadoDeBaja: (mensaje: string) => void;
}) {
  const { estado, procesando, confirmar } = useBaja({
    resumir: () => resumenBajaAeropuerto(aeropuerto.id),
    darDeBaja: () => darDeBajaAeropuerto(aeropuerto.id),
    mensajeBloqueo: MENSAJE_BLOQUEO,
    onDadoDeBaja,
  });

  function cerrar() {
    if (!procesando) onCerrar();
  }

  return (
    <Modal titulo={tituloBaja(estado, "aeropuerto")} deshabilitarCerrar={procesando} onCerrar={cerrar}>
      <CuerpoBaja
        estado={estado}
        procesando={procesando}
        nombre={<strong>{aeropuerto.codigo} - {aeropuerto.nombre}</strong>}
        consecuencia="Dejará de ofrecerse como origen y destino."
        onConfirmar={confirmar}
        onCerrar={cerrar}
      />
    </Modal>
  );
}
