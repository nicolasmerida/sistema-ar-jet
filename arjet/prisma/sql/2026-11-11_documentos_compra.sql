BEGIN;
CREATE TABLE IF NOT EXISTS documentacion_compra (
  cod_compra INTEGER PRIMARY KEY REFERENCES pago(cod_compra),
  datos JSONB NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'procesando', 'completa')),
  intentos INTEGER NOT NULL DEFAULT 0,
  proximo_intento TIMESTAMPTZ NOT NULL DEFAULT now(),
  bloqueo_hasta TIMESTAMPTZ,
  bloqueo_token VARCHAR(36),
  actualizado TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS documentacion_compra_estado_proximo_intento_idx ON documentacion_compra(estado, proximo_intento);
CREATE TABLE IF NOT EXISTS documento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave VARCHAR(80) NOT NULL UNIQUE,
  numero VARCHAR(50) NOT NULL UNIQUE,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('factura', 'ticket')),
  cod_compra INTEGER NOT NULL REFERENCES documentacion_compra(cod_compra),
  id_pasaje INTEGER UNIQUE REFERENCES pasaje(id_pasaje),
  pdf BYTEA,
  emitido_en TIMESTAMPTZ,
  CHECK ((tipo = 'factura' AND id_pasaje IS NULL) OR (tipo = 'ticket' AND id_pasaje IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS documento_factura_por_compra ON documento(cod_compra) WHERE tipo = 'factura';
CREATE INDEX IF NOT EXISTS documento_cod_compra_idx ON documento(cod_compra);

-- Compras anteriores: congelar los datos conocidos hoy; nunca inventar pagos ni fechas.
INSERT INTO documentacion_compra(cod_compra, datos)
SELECT p.cod_compra, jsonb_build_object(
  'version', 1, 'codigo', p.cod_compra,
  'numeroFactura', COALESCE(p.factura, 'FAC-' || EXTRACT(YEAR FROM p.fecha_pago)::text || '-' || lpad(p.cod_compra::text, 8, '0')),
  'fecha', to_char(p.fecha_pago AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'importe', p.importe::text, 'moneda', p.moneda,
  'comprador', jsonb_build_object('dni', u.dni, 'nombre', u.nombre, 'apellido', u.apellido),
  'pasajes', lineas.datos
)
FROM pago p JOIN reserva r ON r.cod_compra = p.cod_compra JOIN usuario u ON u.dni = r.dni_usuario
CROSS JOIN LATERAL (
  SELECT jsonb_agg(jsonb_build_object(
    'idPasaje', ps.id_pasaje, 'nombre', persona.nombre, 'apellido', persona.apellido, 'dni', persona.dni,
    'vuelo', v.numero, 'origen', ao.ciudad || ' (' || ao.codigo_iata || ')', 'destino', ad.ciudad || ' (' || ad.codigo_iata || ')',
    'partida', to_char(j.fecha_partida AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'llegada', to_char(j.fecha_llegada AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'clase', ps.clase::text, 'precio', ps.precio_unitario::text
  ) ORDER BY ps.id_pasaje) AS datos
  FROM pasaje ps JOIN pasajero persona ON persona.dni = ps.pasajero JOIN viaje j ON j.id_viaje = ps.id_viaje
  JOIN vuelo v ON v.id_vuelo = j.id_vuelo JOIN aeropuerto ao ON ao.id_aeropuerto = v.origen JOIN aeropuerto ad ON ad.id_aeropuerto = v.destino
  WHERE ps.compra = p.cod_compra AND (ps.fecha_cancelacion IS NULL OR ps.fecha_cancelacion > p.fecha_pago)
) lineas
WHERE p.fecha_pago IS NOT NULL AND p.importe > 0 AND lineas.datos IS NOT NULL
ON CONFLICT (cod_compra) DO NOTHING;

INSERT INTO documento(clave, numero, tipo, cod_compra)
SELECT 'factura:' || cod_compra, datos->>'numeroFactura', 'factura', cod_compra FROM documentacion_compra
ON CONFLICT (clave) DO NOTHING;
INSERT INTO documento(clave, numero, tipo, cod_compra, id_pasaje)
SELECT 'ticket:' || (linea->>'idPasaje'), 'TKT-' || d.cod_compra || '-' || (linea->>'idPasaje'), 'ticket', d.cod_compra, (linea->>'idPasaje')::int
FROM documentacion_compra d CROSS JOIN LATERAL jsonb_array_elements(d.datos->'pasajes') linea
ON CONFLICT (clave) DO NOTHING;
UPDATE pago p SET factura = d.datos->>'numeroFactura' FROM documentacion_compra d WHERE p.cod_compra = d.cod_compra AND p.factura IS NULL;
COMMIT;
