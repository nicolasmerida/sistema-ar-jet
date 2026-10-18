-- El medio de pago se elige después de registrar la reserva pendiente (US-18).
ALTER TABLE pago ALTER COLUMN tipo DROP NOT NULL;
