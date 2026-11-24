-- Guarda cuanto costaba el cargo antes de becas/descuentos y cuanto se desconto.
-- "monto" sigue siendo lo que se cobra (monto final). Nulos en registros anteriores.
ALTER TABLE pagos ADD COLUMN monto_original NUMERIC(10,2);
ALTER TABLE pagos ADD COLUMN monto_descuento NUMERIC(10,2);

ALTER TABLE detalles_cobro ADD COLUMN monto_original NUMERIC(10,2);
ALTER TABLE detalles_cobro ADD COLUMN monto_descuento NUMERIC(10,2);
