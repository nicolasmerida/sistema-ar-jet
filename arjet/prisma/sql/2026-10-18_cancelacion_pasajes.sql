BEGIN;
ALTER TABLE pasaje ADD COLUMN IF NOT EXISTS cancelado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE pasaje ADD COLUMN IF NOT EXISTS fecha_cancelacion TIMESTAMPTZ;
UPDATE pasaje SET cancelado = TRUE
WHERE cancelado = FALSE AND compra IN (SELECT cod_compra FROM pago WHERE estado_compra IN ('cancelado', 'reembolsado'));
ALTER TABLE pasaje DROP CONSTRAINT IF EXISTS pasaje_unico_por_viaje;
DROP INDEX IF EXISTS pasaje_unico_por_viaje;
CREATE UNIQUE INDEX pasaje_unico_por_viaje ON pasaje (id_viaje, pasajero) WHERE cancelado = FALSE;
CREATE INDEX IF NOT EXISTS idx_pasaje_viaje_pasajero ON pasaje (id_viaje, pasajero);
COMMIT;
