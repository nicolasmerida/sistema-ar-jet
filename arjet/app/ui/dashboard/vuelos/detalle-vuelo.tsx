import Link from "next/link";
import type { DetalleVuelo } from "@/lib/vuelos/tipos";
import { EstadoBadge } from "./estado-badge";
import { diasDeOperacion, fechaCorta, precio } from "./formato";
import { ViajesTable } from "./viajes-table";
import { VolverAVuelos } from "./volver-a-vuelos";

export function DetalleVueloVista({ vuelo }: { vuelo: DetalleVuelo }) {
  const datos = [
    { etiqueta: "Ruta", valor: `${vuelo.origenCiudad} (${vuelo.origen}) → ${vuelo.destinoCiudad} (${vuelo.destino})` },
    { etiqueta: "Horario", valor: `${vuelo.horaSalida} – ${vuelo.horaLlegada}` },
    { etiqueta: "Opera", valor: diasDeOperacion(vuelo.dias) },
    { etiqueta: "Vigencia", valor: `${fechaCorta(vuelo.inicio)} – ${fechaCorta(vuelo.fin)}` },
    { etiqueta: "Precio Economy", valor: precio(vuelo.precioEconomy) },
    { etiqueta: "Precio Primera clase", valor: precio(vuelo.precioPrimera) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <VolverAVuelos />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Vuelo {vuelo.numero}</h1>
            <EstadoBadge estado={vuelo.estado} />
          </div>
          {vuelo.estado === "programado" && (
            <Link href={`/dashboard/vuelos/${vuelo.id}/editar`} className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-medium hover:bg-tertiary">Editar vuelo</Link>
          )}
        </div>
      </div>
      <dl className="grid gap-4 rounded-2xl border border-zinc-200 bg-background p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
        {datos.map((dato) => (
          <div key={dato.etiqueta}>
            <dt className="text-xs text-zinc-500">{dato.etiqueta}</dt>
            <dd className="mt-1 text-sm font-medium">{dato.valor}</dd>
          </div>
        ))}
      </dl>
      <ViajesTable vuelo={vuelo} />
    </div>
  );
}
