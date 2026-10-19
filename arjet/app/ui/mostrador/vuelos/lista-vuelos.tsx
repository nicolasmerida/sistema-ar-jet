import { RefreshCw } from "lucide-react";
import { MENSAJE_SIN_VUELOS } from "@/lib/mostrador/vuelos/tipos";
import type { ResultadoEstadoVuelos } from "@/lib/mostrador/vuelos/tipos";
import { ZONA_HORARIA } from "@/lib/vuelos/fechas";
import { VueloItem } from "./vuelo-item";

const formatoHora = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA_HORARIA,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const caja = "rounded-md border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500";

type Props = {
  resultado: ResultadoEstadoVuelos;
  consultando: boolean;
  onActualizar: () => void;
};

export function ListaVuelos({ resultado, consultando, onActualizar }: Props) {
  return (
    <div aria-live="polite" className="flex flex-col gap-4">
      <Contenido resultado={resultado} consultando={consultando} onActualizar={onActualizar} />
    </div>
  );
}

function Contenido({ resultado, consultando, onActualizar }: Props) {
  if (!resultado.ok) {
    // Los errores de un campo se muestran junto al campo, no acá.
    if (resultado.campo) return null;
    return (
      <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {resultado.mensaje}
      </p>
    );
  }

  if (resultado.vuelos.length === 0) return <p className={caja}>{MENSAJE_SIN_VUELOS}</p>;

  const cantidad = resultado.vuelos.length;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
        <p>
          {cantidad === 1 ? "1 vuelo" : `${cantidad} vuelos`} · Actualizado a las {formatoHora.format(new Date(resultado.consultadoEn))}
          {resultado.hayMas && ". Se muestran los primeros 100: afiná los filtros para ver el resto"}
        </p>
        <button
          type="button"
          onClick={onActualizar}
          disabled={consultando}
          className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${consultando ? "animate-spin" : ""}`} aria-hidden="true" />
          Actualizar
        </button>
      </div>
      {resultado.vuelos.map((vuelo) => (
        <VueloItem key={vuelo.id} vuelo={vuelo} />
      ))}
    </>
  );
}
