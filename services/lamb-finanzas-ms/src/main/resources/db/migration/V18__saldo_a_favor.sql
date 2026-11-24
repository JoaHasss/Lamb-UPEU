-- El saldo de la cuenta del estudiante pasa de "lo que DEBE" a "saldo A FAVOR":
--   saldo = suma(ABONO) - suma(CARGO)   (antes: suma(CARGO) - suma(ABONO))
--   positivo = saldo a favor (credito que se le abona); negativo = el estudiante debe ese monto.
-- Los movimientos NO cambian: CARGO y ABONO conservan su significado contable, solo se invierte
-- el signo del saldo acumulado y de los ajustes manuales para que sigan cuadrando.
UPDATE cuentas_estudiante SET saldo_actual = -saldo_actual;

-- Ajuste manual: positivo = suma saldo a favor (ABONO); negativo = lo descuenta (CARGO).
UPDATE ajustes_manuales_saldo SET monto = -monto;
