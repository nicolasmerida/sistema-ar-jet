-- Corrección de la consulta (D): vuelos que cruzan la medianoche.
-- El vuelo indica si llega el mismo día de la salida o el día siguiente (como máximo).
-- Los días de operación siguen siendo los días de salida.
-- Los vuelos existentes quedan en false: hasta ahora todos llegaban el mismo día.
-- viaje no cambia: viaje_fechas_validas y viaje_avion_sin_solapamiento ya trabajan
-- sobre fecha_partida/fecha_llegada (timestamptz).
BEGIN;

ALTER TABLE vuelo
  ADD COLUMN llega_dia_siguiente BOOLEAN NOT NULL DEFAULT false,
  DROP CONSTRAINT vuelo_horario_valido,
  -- Mismo día: la llegada es posterior a la salida.
  -- Día siguiente: la llegada es anterior o igual a la salida (duración de hasta 24 h).
  ADD CONSTRAINT vuelo_horario_valido CHECK (
    (NOT llega_dia_siguiente AND hora_llegada > hora_salida)
    OR (llega_dia_siguiente AND hora_llegada <= hora_salida)
  );

COMMIT;
