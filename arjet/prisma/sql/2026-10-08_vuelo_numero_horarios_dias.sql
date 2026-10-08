-- US-09/10/11: el vuelo tiene número, horarios y días de operación; cada viaje
-- (una fecha del vuelo) se cancela por separado con motivo y fecha.
-- Los días usan la numeración ISO: 1 = lunes ... 7 = domingo.
-- Los horarios son hora local de Argentina (America/Argentina/Buenos_Aires).
BEGIN;

ALTER TABLE vuelo
  ADD COLUMN numero VARCHAR(10) NOT NULL,
  ADD COLUMN hora_salida TIME(0) NOT NULL,
  ADD COLUMN hora_llegada TIME(0) NOT NULL,
  ADD COLUMN dias_operacion SMALLINT[] NOT NULL,
  ADD CONSTRAINT vuelo_numero_formato CHECK (numero ~ '^[A-Z0-9]{2} [0-9]{1,4}$'),
  ADD CONSTRAINT vuelo_horario_valido CHECK (hora_llegada > hora_salida),
  ADD CONSTRAINT vuelo_dias_operacion_validos CHECK (
    cardinality(dias_operacion) BETWEEN 1 AND 7
    AND dias_operacion <@ ARRAY[1, 2, 3, 4, 5, 6, 7]::SMALLINT[]
  ),
  -- Un mismo número no puede repetirse en períodos de vigencia superpuestos.
  ADD CONSTRAINT vuelo_numero_sin_solapamiento EXCLUDE USING gist (
    numero WITH =,
    daterange(inicio_disp, fin_disp, '[]') WITH &&
  );

ALTER TABLE estado
  ALTER COLUMN motivo TYPE VARCHAR(500),
  ADD COLUMN fecha TIMESTAMPTZ NOT NULL DEFAULT now();

COMMIT;
