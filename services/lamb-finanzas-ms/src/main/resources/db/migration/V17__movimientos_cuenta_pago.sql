-- Cada movimiento de cuenta puede venir de un pago (cargo al generarse, abono al aprobarse).
-- Nulo en movimientos manuales y ajustes.
ALTER TABLE movimientos_cuenta ADD COLUMN id_pago BIGINT;
ALTER TABLE movimientos_cuenta
    ADD CONSTRAINT fk_movimientos_cuenta_pago FOREIGN KEY (id_pago) REFERENCES pagos (id);
CREATE INDEX idx_movimientos_cuenta_pago ON movimientos_cuenta (id_pago);
