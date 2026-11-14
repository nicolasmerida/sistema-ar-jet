import "server-only";
import { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/src/prisma/db";
import { instanteLocal, fechaDeColumna } from "@/lib/vuelos/fechas";
import { calcularReporte } from "./calculos";
import type { FiltrosValidos, OpcionVuelo, ViajeOcupacion } from "./tipos";

export async function obtenerVuelosReporte(): Promise<OpcionVuelo[]> {
  // También se incluyen vuelos históricos y cancelados.
  const vuelos = await db.vuelo.findMany({
    orderBy: [{ numero: "asc" }, { inicio_disp: "asc" }, { id_vuelo: "asc" }],
    select: {
      id_vuelo: true, numero: true, inicio_disp: true, fin_disp: true,
      aeropuerto_vuelo_origenToaeropuerto: { select: { codigo_iata: true } },
      aeropuerto_vuelo_destinoToaeropuerto: { select: { codigo_iata: true } },
    },
  });
  return vuelos.map(v => ({
    id: v.id_vuelo,
    etiqueta: `${v.numero} · ${v.aeropuerto_vuelo_origenToaeropuerto.codigo_iata} → ${v.aeropuerto_vuelo_destinoToaeropuerto.codigo_iata} · ${fechaDeColumna(v.inicio_disp)} / ${fechaDeColumna(v.fin_disp)}`,
  }));
}

export async function consultarOcupacion(filtros: FiltrosValidos, cliente: Pick<typeof db, "$queryRaw"> = db) {
  const desde = instanteLocal(filtros.desde, "00:00");
  const hastaExclusivo = instanteLocal(filtros.hasta, "00:00");
  hastaExclusivo.setUTCDate(hastaExclusivo.getUTCDate() + 1);
  // Una sola sentencia SELECT da una vista consistente de capacidades y ventas.
  // Coincide con filtroPasajesVendidos: sólo pagos pagados y pasajes no cancelados.
  const viajes = await cliente.$queryRaw<ViajeOcupacion[]>(Prisma.sql`
    SELECT j.id_viaje, j.fecha_partida, j.estado, v.numero,
      origen.codigo_iata AS origen, destino.codigo_iata AS destino,
      a.capacidad_economy, a.capacidad_primera,
      (COUNT(p.id_pasaje) FILTER (WHERE p.clase = 'economy' AND NOT p.cancelado AND pago.estado_compra = 'pagado'))::int AS vendidos_economy,
      (COUNT(p.id_pasaje) FILTER (WHERE p.clase = 'primera' AND NOT p.cancelado AND pago.estado_compra = 'pagado'))::int AS vendidos_primera
    FROM viaje j
    JOIN vuelo v ON v.id_vuelo = j.id_vuelo
    JOIN avion a ON a.id_avion = j.id_avion
    JOIN aeropuerto origen ON origen.id_aeropuerto = v.origen
    JOIN aeropuerto destino ON destino.id_aeropuerto = v.destino
    LEFT JOIN pasaje p ON p.id_viaje = j.id_viaje
    LEFT JOIN pago ON pago.cod_compra = p.compra
    WHERE j.fecha_partida >= ${desde} AND j.fecha_partida < ${hastaExclusivo}
      ${filtros.vuelo === null ? Prisma.empty : Prisma.sql`AND j.id_vuelo = ${filtros.vuelo}`}
    GROUP BY j.id_viaje, v.id_vuelo, a.id_avion, origen.id_aeropuerto, destino.id_aeropuerto
    ORDER BY j.fecha_partida, j.id_viaje
  `);
  return calcularReporte(viajes, filtros.clase);
}
