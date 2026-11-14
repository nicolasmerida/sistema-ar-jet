BEGIN;
ALTER TABLE pasaje ADD COLUMN IF NOT EXISTS precio_unitario NUMERIC(10, 2);
-- Las reservas anteriores no tenían precio histórico: se toma la tarifa conocida al migrar.
UPDATE pasaje p SET precio_unitario = CASE WHEN p.clase = 'economy' THEN v.precio_economy ELSE v.precio_primera END
FROM viaje j JOIN vuelo v ON v.id_vuelo = j.id_vuelo
WHERE p.id_viaje = j.id_viaje AND p.precio_unitario IS NULL;
ALTER TABLE pasaje ALTER COLUMN precio_unitario SET NOT NULL;
ALTER TABLE pago ADD COLUMN IF NOT EXISTS importe NUMERIC(12, 2);
ALTER TABLE pago ADD COLUMN IF NOT EXISTS moneda VARCHAR(3) NOT NULL DEFAULT 'ARS';
ALTER TABLE pago ADD COLUMN IF NOT EXISTS fecha_pago TIMESTAMPTZ;
ALTER TABLE pago ADD COLUMN IF NOT EXISTS referencia VARCHAR(50);
ALTER TABLE pago ADD COLUMN IF NOT EXISTS tarjeta_ultimos4 VARCHAR(4);
CREATE UNIQUE INDEX IF NOT EXISTS pago_referencia_key ON pago (referencia);
COMMIT;
