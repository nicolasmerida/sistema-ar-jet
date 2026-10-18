-- La modalidad de reserva no implica un cobro ni un medio de pago definitivo.
ALTER TABLE reserva ADD COLUMN IF NOT EXISTS modalidad VARCHAR(20)
  CHECK (modalidad IN ('tarjeta', 'mostrador'));
