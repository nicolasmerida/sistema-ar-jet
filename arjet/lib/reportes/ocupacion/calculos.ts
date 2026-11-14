import type { FiltrosValidos, FilaOcupacion, ReporteOcupacion, ViajeOcupacion } from "./tipos";

export function calcularReporte(viajes: ViajeOcupacion[], clase: FiltrosValidos["clase"]): ReporteOcupacion {
  const clases = clase === "ambas" ? ["economy", "primera"] as const : [clase];
  const filas: FilaOcupacion[] = [];
  const resumen: ReporteOcupacion["resumen"] = { viajes: 0, cancelados: 0, capacidad: 0, vendidos: 0, libres: 0, promedio: null };
  for (const viaje of viajes) {
    const cancelado = viaje.estado === "cancelado";
    if (cancelado) resumen.cancelados++;
    else resumen.viajes++;
    for (const clase of clases) {
      const capacidad = clase === "economy" ? viaje.capacidad_economy : viaje.capacidad_primera;
      const vendidos = clase === "economy" ? viaje.vendidos_economy : viaje.vendidos_primera;
      filas.push({
        viaje: viaje.id_viaje, fecha: viaje.fecha_partida.toISOString(), vuelo: viaje.numero,
        ruta: `${viaje.origen} → ${viaje.destino}`, estado: viaje.estado, clase,
        capacidad, vendidos, libres: capacidad - vendidos,
        porcentaje: capacidad > 0 ? vendidos / capacidad * 100 : null,
      });
      if (!cancelado) {
        resumen.capacidad += capacidad;
        resumen.vendidos += vendidos;
      }
    }
  }
  resumen.libres = resumen.capacidad - resumen.vendidos;
  // Promedio ponderado: nunca promediar porcentajes ya redondeados.
  resumen.promedio = resumen.capacidad > 0 ? resumen.vendidos / resumen.capacidad * 100 : null;
  return { filas, resumen };
}
