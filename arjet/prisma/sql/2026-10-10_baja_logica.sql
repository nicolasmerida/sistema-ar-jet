-- Corrección de la consulta (A): baja lógica de aeropuertos y aviones.
-- "Dar de baja" ya no borra filas: cambia el estado y registra la fecha.
-- Los viajes pendientes se cancelan desde la aplicación, en la misma transacción.
-- codigo_iata y matricula siguen siendo UNIQUE globales (incluyen los dados de baja).
-- Los triggers repiten en la base las reglas que ya controla la aplicación, para que
-- valgan también para cualquier otro código que use la misma base.
BEGIN;

CREATE TYPE estado_registro_t AS ENUM ('activo', 'de_baja');

ALTER TABLE aeropuerto
  ADD COLUMN estado estado_registro_t NOT NULL DEFAULT 'activo',
  ADD COLUMN fecha_baja TIMESTAMPTZ,
  ADD CONSTRAINT aeropuerto_baja_consistente
    CHECK ((estado = 'de_baja') = (fecha_baja IS NOT NULL));

ALTER TABLE avion
  ADD COLUMN estado estado_registro_t NOT NULL DEFAULT 'activo',
  ADD COLUMN fecha_baja TIMESTAMPTZ,
  ADD CONSTRAINT avion_baja_consistente
    CHECK ((estado = 'de_baja') = (fecha_baja IS NOT NULL));

COMMENT ON TYPE estado_registro_t IS 'Estado de un registro con baja lógica. De baja: se conserva con su historial pero no se ofrece para vuelos nuevos.';
COMMENT ON COLUMN aeropuerto.estado IS 'activo / de_baja. Dar de baja cancela los viajes pendientes que salen o llegan acá.';
COMMENT ON COLUMN aeropuerto.fecha_baja IS 'Cuándo se dio de baja; NULL mientras está activo.';
COMMENT ON COLUMN avion.estado IS 'activo / de_baja. Dar de baja cancela los viajes pendientes asignados.';
COMMENT ON COLUMN avion.fecha_baja IS 'Cuándo se dio de baja; NULL mientras está activo.';

-- 1. Nunca se borran filas: se dan de baja.
CREATE FUNCTION impedir_borrado_fisico() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'baja_logica: no se borran filas de %, se dan de baja', TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END $$ LANGUAGE plpgsql;

CREATE TRIGGER aeropuerto_sin_borrado BEFORE DELETE ON aeropuerto
  FOR EACH ROW EXECUTE FUNCTION impedir_borrado_fisico();
CREATE TRIGGER avion_sin_borrado BEFORE DELETE ON avion
  FOR EACH ROW EXECUTE FUNCTION impedir_borrado_fisico();

-- 2a. Un vuelo no puede tener origen ni destino dados de baja.
-- Solo controla cuando se asignan (alta o cambio de ruta). FOR SHARE espera a una
-- baja simultánea que todavía no confirmó.
CREATE FUNCTION vuelo_aeropuertos_activos() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.origen = OLD.origen AND NEW.destino = OLD.destino THEN
    RETURN NEW;
  END IF;
  PERFORM 1 FROM aeropuerto WHERE id_aeropuerto IN (NEW.origen, NEW.destino) FOR SHARE;
  IF EXISTS (SELECT 1 FROM aeropuerto
             WHERE id_aeropuerto IN (NEW.origen, NEW.destino) AND estado = 'de_baja') THEN
    RAISE EXCEPTION 'vuelo_aeropuertos_activos: el aeropuerto está dado de baja'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER vuelo_con_aeropuertos_activos BEFORE INSERT OR UPDATE OF origen, destino ON vuelo
  FOR EACH ROW EXECUTE FUNCTION vuelo_aeropuertos_activos();

-- 2b. Un viaje en pie no puede asignarse a un avión dado de baja.
-- Cancelar los viajes de un avión dado de baja (cambiar su estado) sigue permitido.
CREATE FUNCTION viaje_avion_activo() RETURNS trigger AS $$
BEGIN
  IF NEW.estado = 'cancelado' OR (TG_OP = 'UPDATE' AND NEW.id_avion = OLD.id_avion) THEN
    RETURN NEW;
  END IF;
  PERFORM 1 FROM avion WHERE id_avion = NEW.id_avion FOR SHARE;
  IF EXISTS (SELECT 1 FROM avion WHERE id_avion = NEW.id_avion AND estado = 'de_baja') THEN
    RAISE EXCEPTION 'viaje_avion_activo: el avión está dado de baja'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER viaje_con_avion_activo BEFORE INSERT OR UPDATE OF id_avion ON viaje
  FOR EACH ROW EXECUTE FUNCTION viaje_avion_activo();

COMMIT;

-- Para revertir (borra también las fechas de baja registradas):
-- BEGIN;
-- DROP TRIGGER viaje_con_avion_activo ON viaje;
-- DROP TRIGGER vuelo_con_aeropuertos_activos ON vuelo;
-- DROP TRIGGER avion_sin_borrado ON avion;
-- DROP TRIGGER aeropuerto_sin_borrado ON aeropuerto;
-- DROP FUNCTION viaje_avion_activo(), vuelo_aeropuertos_activos(), impedir_borrado_fisico();
-- ALTER TABLE avion DROP CONSTRAINT avion_baja_consistente, DROP COLUMN fecha_baja, DROP COLUMN estado;
-- ALTER TABLE aeropuerto DROP CONSTRAINT aeropuerto_baja_consistente, DROP COLUMN fecha_baja, DROP COLUMN estado;
-- DROP TYPE estado_registro_t;
-- COMMIT;
