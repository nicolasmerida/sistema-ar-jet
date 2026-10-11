-- Corrección de la consulta (C): el aeropuerto tiene una descripción opcional.
-- Los aeropuertos ya cargados quedan con NULL.
BEGIN;

ALTER TABLE aeropuerto
  ADD COLUMN descripcion VARCHAR(500);

COMMIT;
