// Ejecutar desde arjet/: node --import tsx --conditions=react-server tests/ocupacion.integration.mjs
// Compara el reporte con conteos independientes; PostgreSQL impide escrituras.
import "dotenv/config";
import assert from "node:assert/strict";
import { db } from "../src/prisma/db.ts";
import { consultarOcupacion } from "../lib/reportes/ocupacion/data.ts";

try {
  await db.$transaction(async tx => {
    await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    for (const clase of ["ambas", "economy", "primera"]) {
      const filtros = { vuelo: null, clase, desde: "2000-01-01", hasta: "2100-12-31" };
      const reporte = await consultarOcupacion(filtros, tx);
      const capacidad = clase === "economy" ? "a.capacidad_economy" : clase === "primera" ? "a.capacidad_primera" : "a.capacidad_economy + a.capacidad_primera";
      // Las únicas variantes son constantes de esta prueba, nunca entradas del usuario.
      const filtroClase = clase === "ambas" ? "" : `AND p.clase = '${clase}'`;
      const [control] = await tx.$queryRawUnsafe(`SELECT
        (SELECT COALESCE(SUM(${capacidad}), 0)::int FROM viaje j JOIN avion a USING(id_avion)
          WHERE j.estado <> 'cancelado' AND j.fecha_partida >= '2000-01-01T00:00:00-03:00' AND j.fecha_partida < '2101-01-01T00:00:00-03:00') AS capacidad,
        (SELECT COUNT(*)::int FROM pasaje p JOIN pago g ON g.cod_compra = p.compra JOIN viaje j USING(id_viaje)
          WHERE NOT p.cancelado AND g.estado_compra = 'pagado' AND j.estado <> 'cancelado'
          AND j.fecha_partida >= '2000-01-01T00:00:00-03:00' AND j.fecha_partida < '2101-01-01T00:00:00-03:00' ${filtroClase}) AS vendidos`);
      assert.equal(reporte.resumen.capacidad, control.capacidad);
      assert.equal(reporte.resumen.vendidos, control.vendidos);
      assert.equal(reporte.resumen.promedio, control.capacidad ? control.vendidos / control.capacidad * 100 : null);
      console.log(`Reporte y control SQL coinciden: ${clase} (${reporte.filas.length} filas)`);
    }
    const [viaje] = await tx.$queryRawUnsafe("SELECT id_vuelo FROM viaje ORDER BY id_viaje LIMIT 1");
    if (viaje) {
      const filtros = { vuelo: viaje.id_vuelo, clase: "ambas", desde: "2000-01-01", hasta: "2100-12-31" };
      const reporte = await consultarOcupacion(filtros, tx);
      const [control] = await tx.$queryRaw`SELECT COUNT(*)::int AS cantidad FROM viaje WHERE id_vuelo = ${viaje.id_vuelo} AND fecha_partida >= '2000-01-01T00:00:00-03:00' AND fecha_partida < '2101-01-01T00:00:00-03:00'`;
      assert.equal(reporte.filas.length, control.cantidad * 2);
      console.log("Filtro de vuelo: OK");
    }
    const vacio = await consultarOcupacion({ vuelo: null, clase: "ambas", desde: "1900-01-01", hasta: "1900-01-01" }, tx);
    assert.equal(vacio.filas.length, 0);
    console.log("Sin datos: OK");
  }, { timeout: 30000, isolationLevel: "RepeatableRead" });
} finally {
  await db.$disconnect();
}
