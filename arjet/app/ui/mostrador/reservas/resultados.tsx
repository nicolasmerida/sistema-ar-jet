import type { FiltroEstado, ResultadoBusqueda } from "@/lib/mostrador/tipos";
import { ReservaItem } from "./reserva-item";

type Props = {
  resultado: ResultadoBusqueda | null;
  buscando: boolean;
  filtro: FiltroEstado;
};

const caja = "rounded-md border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500";

export function Resultados({ resultado, buscando, filtro }: Props) {
  return (
    <div aria-live="polite">
      <Contenido resultado={resultado} buscando={buscando} filtro={filtro} />
    </div>
  );
}

function Contenido({ resultado, buscando, filtro }: Props) {
  if (buscando) return <p className={caja}>Buscando reservas...</p>;

  if (!resultado) {
    return <p className={caja}>Elegí un criterio, ingresá el valor y presioná &quot;Buscar&quot;.</p>;
  }

  if (!resultado.ok) {
    // Los errores de un campo se muestran junto al campo, no acá.
    if (resultado.campo) return null;
    return (
      <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {resultado.mensaje}
      </p>
    );
  }

  if (resultado.reservas.length === 0) {
    return (
      <div className={caja}>
        <p className="font-medium text-zinc-700">No se encontraron reservas para los datos ingresados</p>
        {filtro === "pendientes" && (
          <p className="mt-1">
            Solo se buscó entre reservas pendientes de pago. Probá con &quot;Todas las reservas&quot;.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500">
        {resultado.reservas.length === 1 ? "1 reserva encontrada" : `${resultado.reservas.length} reservas encontradas`}
        {resultado.hayMas && ". Se muestran las más recientes: afiná la búsqueda para ver el resto"}
      </p>
      {resultado.reservas.map((reserva) => (
        <ReservaItem key={reserva.codigo} reserva={reserva} />
      ))}
    </div>
  );
}
