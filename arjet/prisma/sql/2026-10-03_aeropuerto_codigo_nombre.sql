-- US-03/04/05: el aeropuerto se identifica por su código IATA y tiene nombre.
-- direccion y pais pasan a ser opcionales (no forman parte del ABM).
BEGIN;

ALTER TABLE aeropuerto
  ADD COLUMN codigo_iata VARCHAR(3) NOT NULL,
  ADD COLUMN nombre VARCHAR(150) NOT NULL,
  ALTER COLUMN direccion DROP NOT NULL,
  ALTER COLUMN pais DROP NOT NULL,
  ADD CONSTRAINT aeropuerto_codigo_iata_key UNIQUE (codigo_iata),
  ADD CONSTRAINT aeropuerto_codigo_iata_formato CHECK (codigo_iata ~ '^[A-Z]{3}$');

COMMIT;
