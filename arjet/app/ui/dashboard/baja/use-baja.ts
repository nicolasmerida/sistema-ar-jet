"use client";

import { useEffect, useState, useTransition } from "react";
import type { ResultadoBaja, ResultadoResumenBaja, ResumenBaja, ViajeBloqueante } from "@/lib/vuelos/tipos";

export type EstadoBaja =
  | { paso: "cargando" }
  | { paso: "error"; mensaje: string }
  | { paso: "bloqueada"; mensaje: string; bloqueantes: ViajeBloqueante[] }
  | { paso: "confirmar"; resumen: ResumenBaja; error: string | null };

const ERROR_CONEXION = "No se pudieron obtener los datos. Por favor, contactá al equipo técnico";

/**
 * Flujo del modal de baja: al abrirse pide el resumen; si hay viajes que no se pueden cancelar
 * muestra el rechazo, y si no pide confirmación. El servidor vuelve a verificar al confirmar.
 */
export function useBaja({ resumir, darDeBaja, mensajeBloqueo, onDadoDeBaja }: {
  resumir: () => Promise<ResultadoResumenBaja>;
  darDeBaja: () => Promise<ResultadoBaja>;
  mensajeBloqueo: string;
  onDadoDeBaja: (mensaje: string) => void;
}) {
  const [estado, setEstado] = useState<EstadoBaja>({ paso: "cargando" });
  const [procesando, startTransition] = useTransition();

  useEffect(() => {
    let vigente = true;
    resumir()
      .then((resultado) => {
        if (!vigente) return;
        if (!resultado.ok) setEstado({ paso: "error", mensaje: resultado.mensaje });
        else if (resultado.resumen.bloqueantes.length > 0)
          setEstado({ paso: "bloqueada", mensaje: mensajeBloqueo, bloqueantes: resultado.resumen.bloqueantes });
        else setEstado({ paso: "confirmar", resumen: resultado.resumen, error: null });
      })
      .catch(() => vigente && setEstado({ paso: "error", mensaje: ERROR_CONEXION }));
    return () => {
      vigente = false;
    };
    // Se pide una sola vez, al abrir el modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function confirmar() {
    if (estado.paso !== "confirmar" || procesando) return;
    const { resumen } = estado;
    startTransition(async () => {
      try {
        const resultado = await darDeBaja();
        if (resultado.ok) onDadoDeBaja(resultado.mensaje);
        else if (resultado.bloqueantes?.length)
          setEstado({ paso: "bloqueada", mensaje: resultado.mensaje, bloqueantes: resultado.bloqueantes });
        else setEstado({ paso: "confirmar", resumen, error: resultado.mensaje });
      } catch {
        setEstado({ paso: "confirmar", resumen, error: ERROR_CONEXION });
      }
    });
  }

  return { estado, procesando, confirmar };
}
