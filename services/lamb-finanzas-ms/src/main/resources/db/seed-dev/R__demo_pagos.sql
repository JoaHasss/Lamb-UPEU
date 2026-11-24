-- DATOS DE DEMO (solo DEV). Flyway los carga desde lamb-finanzas-ms-dev.yml (locations incluye db/seed-dev);
-- el perfil prod no incluye esta carpeta. Idempotente: ids fijos + ON CONFLICT DO NOTHING.
-- Coherente con lamb-matricula-ms/db/seed-dev/R__demo_matriculas.sql: pagos 1..6 son los cargos
-- de las matriculas 1..6 (matricula_id) y su estado explica el de la matricula.
-- id_persona 1..5: estudiantes de demo de lamb-personas-ms/db/seed-dev/R__demo_personas.sql.

-- Conceptos de pago (tarifario): los montos de los pagos salen de aqui
INSERT INTO categorias_concepto (id, nombre, descripcion) VALUES
(1, 'Academico', 'Conceptos ligados a la matricula y los estudios'),
(2, 'Tramites',  'Constancias, certificados y documentos')
ON CONFLICT (id) DO NOTHING;

INSERT INTO conceptos_pago (id, id_categoria, nombre, monto, vigencia_desde, vigencia_hasta) VALUES
(1, 1, 'Matricula',              350.00, '2026-01-01', NULL),
(2, 2, 'Constancia de estudios',  30.00, '2026-01-01', NULL),
(3, 2, 'Carnet universitario',    25.00, '2026-01-01', NULL),
(4, 2, 'Certificado de notas',    45.00, '2026-01-01', NULL)
ON CONFLICT (id) DO NOTHING;

-- Pagos
INSERT INTO pagos (id, id_persona, concepto, monto, metodo, estado, fecha_pago, referencia_externa, matricula_id, numero_operacion, banco_referencia, fecha_voucher) VALUES
-- Cargos de matricula (uno por matricula)
(1, 1, 'Matricula 2026-1',       350.00, 'TARJETA',       'APROBADO',    '2026-03-10 09:20', 'demo-01', 1, NULL,       NULL,  NULL),
(2, 1, 'Matricula 2026-2',       350.00, 'YAPE',          'APROBADO',    '2026-08-12 10:34', 'demo-02', 2, NULL,       NULL,  NULL),
(3, 2, 'Matricula 2026-2',       350.00, NULL,            'PENDIENTE',   '2026-08-14 16:05', 'demo-03', 3, NULL,       NULL,  NULL),
(4, 3, 'Matricula 2026-2',       350.00, 'TRANSFERENCIA', 'EN_PROCESO',  '2026-08-25 11:45', 'demo-04', 4, '00458712', 'BCP', '2026-08-25 11:30'),
(5, 4, 'Matricula 2026-2',       350.00, 'TARJETA',       'RECHAZADO',   '2026-08-13 08:55', 'demo-05', 5, NULL,       NULL,  NULL),
(6, 5, 'Matricula 2026-2',       350.00, 'YAPE',          'APROBADO',    '2026-08-11 12:26', 'demo-06', 6, NULL,       NULL,  NULL),
-- Pagos de tramites (sin matricula, origen "Caja"), con los montos del catalogo
(7, 1, 'Constancia de estudios',  30.00, 'YAPE',          'APROBADO',    '2026-09-02 15:10', 'demo-07', NULL, NULL,     NULL,  NULL),
(8, 2, 'Carnet universitario',    25.00, 'EFECTIVO',      'EN_PROCESO',  '2026-09-05 10:00', 'demo-08', NULL, NULL,     NULL,  NULL),
(9, 5, 'Certificado de notas',    45.00, 'TARJETA',       'REEMBOLSADO', '2026-09-10 17:25', 'demo-09', NULL, NULL,     NULL,  NULL)
ON CONFLICT (id) DO NOTHING;

-- Cuentas de estudiante (una por persona). saldo_actual = saldo A FAVOR hoy (negativo = debe).
-- Cargos antiguos aun sin pagar: persona 2 la matricula (pago 3) y el carnet (pago 8, aun sin validar);
-- persona 3 la matricula (pago 4, voucher sin validar) mas una mora por ajuste manual. Persona 4 no
-- debe: su cargo se cancelo. Todos estos cargos se compensan con el saldo inicial de S/ 1000.
-- Persona 5 tiene S/ 20 a favor por un ajuste manual. Ademas, cada estudiante parte con S/ 1000 a favor
-- (movimientos 18..22). Al final del archivo el saldo se recalcula desde los movimientos, asi siempre
-- cuadra: los valores de abajo son solo el punto de partida y el UPDATE final los deja correctos.
INSERT INTO cuentas_estudiante (id, id_persona, saldo_actual, fecha_apertura) VALUES
(1, 1, 1000.00, '2026-03-10 09:15'),
(2, 2,  625.00, '2026-08-14 16:05'),
(3, 3,  635.00, '2026-08-25 11:40'),
(4, 4, 1000.00, '2026-08-13 08:50'),
(5, 5, 1020.00, '2026-08-11 12:20')
ON CONFLICT (id) DO NOTHING;

-- Movimientos de cuenta: explican cada saldo de arriba (ABONO suma saldo a favor, CARGO lo descuenta).
-- Cada pago genera su CARGO; al aprobarse, su ABONO. Persona 4: matricula anulada, cargo revertido.
-- (Datos de demo del esquema anterior: los pagos nuevos solo generan su CARGO al aprobarse.)
INSERT INTO movimientos_cuenta (id, id_cuenta, tipo, monto, concepto, fecha, id_pago) VALUES
( 1, 1, 'CARGO', 350.00, 'Matricula 2026-1',                                 '2026-03-10 09:15', 1),
( 2, 1, 'ABONO', 350.00, 'Pago aprobado: Matricula 2026-1',                  '2026-03-10 09:20', 1),
( 3, 1, 'CARGO', 350.00, 'Matricula 2026-2',                                 '2026-08-12 10:30', 2),
( 4, 1, 'ABONO', 350.00, 'Pago aprobado: Matricula 2026-2',                  '2026-08-12 10:34', 2),
( 5, 1, 'CARGO',  30.00, 'Constancia de estudios',                           '2026-09-02 15:05', 7),
( 6, 1, 'ABONO',  30.00, 'Pago aprobado: Constancia de estudios',            '2026-09-02 15:10', 7),
( 7, 2, 'CARGO', 350.00, 'Matricula 2026-2',                                 '2026-08-14 16:05', 3),
( 8, 2, 'CARGO',  25.00, 'Carnet universitario',                             '2026-09-05 10:00', 8),
( 9, 3, 'CARGO', 350.00, 'Matricula 2026-2',                                 '2026-08-25 11:40', 4),
(10, 4, 'CARGO', 350.00, 'Matricula 2026-2',                                 '2026-08-13 08:50', 5),
(11, 4, 'ABONO', 350.00, 'Cargo de matricula cancelado: Matricula 2026-2',   '2026-08-29 18:00', 5),
(12, 5, 'CARGO', 350.00, 'Matricula 2026-2',                                 '2026-08-11 12:20', 6),
(13, 5, 'ABONO', 350.00, 'Pago aprobado: Matricula 2026-2',                  '2026-08-11 12:26', 6),
(14, 5, 'CARGO',  45.00, 'Certificado de notas',                             '2026-09-10 17:20', 9),
(15, 5, 'ABONO',  45.00, 'Pago aprobado: Certificado de notas',              '2026-09-10 17:25', 9),
-- Ajustes manuales (ver ajustes_manuales_saldo): uno suma deuda (CARGO), otro deja saldo a favor (ABONO)
(16, 3, 'CARGO',  15.00, 'Ajuste manual: Mora por pago extemporaneo de matricula', '2026-09-01 10:00', NULL),
(17, 5, 'ABONO',  20.00, 'Ajuste manual: Pago duplicado en ventanilla, queda a favor', '2026-09-20 12:00', NULL),
-- Saldo a favor inicial de S/ 1000 para cada estudiante de demo (se suma al resto de movimientos)
(18, 1, 'ABONO', 1000.00, 'Saldo inicial a favor', '2026-01-01 08:00', NULL),
(19, 2, 'ABONO', 1000.00, 'Saldo inicial a favor', '2026-01-01 08:00', NULL),
(20, 3, 'ABONO', 1000.00, 'Saldo inicial a favor', '2026-01-01 08:00', NULL),
(21, 4, 'ABONO', 1000.00, 'Saldo inicial a favor', '2026-01-01 08:00', NULL),
(22, 5, 'ABONO', 1000.00, 'Saldo inicial a favor', '2026-01-01 08:00', NULL)
ON CONFLICT (id) DO NOTHING;

-- Ajustes manuales de saldo: positivo = suma saldo a favor (ABONO), negativo = lo descuenta (CARGO)
INSERT INTO ajustes_manuales_saldo (id, id_cuenta, monto, motivo, autorizado_por, fecha) VALUES
(1, 3, -15.00, 'Mora por pago extemporaneo de matricula',  'Tesoreria', '2026-09-01 10:00'),
(2, 5,  20.00, 'Pago duplicado en ventanilla, queda a favor', 'Tesoreria', '2026-09-20 12:00')
ON CONFLICT (id) DO NOTHING;

-- Cancelacion del cargo de la matricula 5 (persona 4): explica el ABONO 11 de arriba
INSERT INTO cancelaciones_cargo_matricula (id, id_pago, id_matricula, motivo, fecha) VALUES
(1, 5, 5, 'Matricula anulada por impago: pago rechazado', '2026-08-29 18:00')
ON CONFLICT (id) DO NOTHING;

-- Becas: tipos y a quien se aplican. Rigen desde 2026-09-01, despues de las matriculas 2026-2,
-- por eso esos cargos se pagaron completos (S/ 350).
INSERT INTO tipos_beca (id, nombre, descripcion) VALUES
(1, 'Excelencia academica', 'Para estudiantes del tercio superior del ciclo anterior'),
(2, 'Socioeconomica',       'Para estudiantes con evaluacion socioeconomica favorable'),
(3, 'Deportiva',            'Para estudiantes que representan a la universidad en competencias'),
(4, 'Hijo de trabajador',   'Por convenio con el personal de la universidad')
ON CONFLICT (id) DO NOTHING;

INSERT INTO becas_aplicadas (id, id_persona, id_tipo_beca, porcentaje, fecha_inicio) VALUES
(1, 1, 1, 50.00, '2026-09-01'),  -- tercio superior en 2026-1
(2, 5, 2, 25.00, '2026-09-01'),
(3, 3, 3, 30.00, '2026-09-01')   -- seleccion de futsal de la universidad
ON CONFLICT (id) DO NOTHING;

-- Renovacion / suspension de beca: la deportiva de la persona 3 se suspende en octubre
-- (deja de descontar) y se renueva en noviembre (vuelve a descontar). Ver detalles de cobro 3 y 4.
INSERT INTO renovaciones_suspensiones_beca (id, id_beca_aplicada, tipo, fecha, motivo) VALUES
(1, 3, 'SUSPENSION', '2026-10-01', 'No se presento a los entrenamientos de la seleccion'),
(2, 3, 'RENOVACION', '2026-11-02', 'Reincorporado a la seleccion de futsal')
ON CONFLICT (id) DO NOTHING;

-- Descuentos: tipos y a quien se aplican (se suman a la beca, con tope de 100%)
INSERT INTO tipos_descuento (id, nombre, porcentaje, descripcion) VALUES
(1, 'Pronto pago',           10.00, 'Pago de la pension antes del vencimiento'),
(2, 'Hermanos estudiando',   15.00, 'Dos o mas hermanos matriculados en la universidad'),
(3, 'Convenio con empresa',  80.00, 'Hijo de trabajador de empresa con convenio')
ON CONFLICT (id) DO NOTHING;

INSERT INTO descuentos_aplicados (id, id_persona, id_tipo_descuento, porcentaje, fecha_inicio) VALUES
(1, 1, 1, 10.00, '2026-09-01'),  -- persona 1: beca 50% + pronto pago 10% = 60%
(2, 2, 2, 15.00, '2026-09-01'),  -- persona 2: sin beca, solo descuento 15%
(3, 5, 3, 80.00, '2026-09-01')   -- persona 5: beca 25% + convenio 80% = 105% -> tope 100%
ON CONFLICT (id) DO NOTHING;

-- Convenios institucionales (catalogo; aun no se aplican solos en el cobro)
INSERT INTO convenios_institucionales_descuento (id, nombre_institucion, porcentaje_descuento) VALUES
(1, 'Colegio Adventista Union',     20.00),
(2, 'Asociacion de exalumnos UPeU', 10.00)
ON CONFLICT (id) DO NOTHING;

-- Cobros de pension con beca/descuento aplicados (monto = lo que se cobra; monto_original y
-- monto_descuento muestran el calculo). Un caso por situacion:
INSERT INTO estados_cobro (id, id_cuenta_estudiante, estado, fecha) VALUES
(1, 1, 'SIN_DEUDA', '2026-09-15'),
(2, 2, 'CON_DEUDA', '2026-09-15'),
(3, 3, 'CON_DEUDA', '2026-10-15'),
(4, 3, 'CON_DEUDA', '2026-11-15'),
(5, 4, 'SIN_DEUDA', '2026-09-15'),
(6, 5, 'SIN_DEUDA', '2026-09-15')
ON CONFLICT (id) DO NOTHING;

INSERT INTO detalles_cobro (id, id_estado_cobro, concepto, monto, id_descuento_aplicado, monto_original, monto_descuento) VALUES
(1, 1, 'Pension septiembre 2026', 200.00, 1,    500.00, 300.00),  -- beca 50% + descuento 10%
(2, 2, 'Pension septiembre 2026', 425.00, 2,    500.00,  75.00),  -- solo descuento 15%
(3, 3, 'Pension octubre 2026',    500.00, NULL, 500.00,   0.00),  -- beca suspendida: no descuenta
(4, 4, 'Pension noviembre 2026',  350.00, NULL, 500.00, 150.00),  -- beca renovada: 30%
(5, 5, 'Duplicado de carnet',      25.00, NULL,  25.00,   0.00),  -- sin beca ni descuento
(6, 6, 'Pension septiembre 2026',   0.00, 3,    500.00, 500.00)   -- 25% + 80% topado en 100%
ON CONFLICT (id) DO NOTHING;

-- Solicitudes de devolucion: solo sobre pagos cobrados (APROBADO / REEMBOLSADO).
-- 1: aprobada y ya reembolsada (pago 9 queda REEMBOLSADO).
-- 2: pendiente de revision (pago 7 sigue APROBADO; no cambia el saldo de la persona 1).
-- 3: rechazada (pago 6 sigue APROBADO; la matricula 6 sigue CONFIRMADA).
INSERT INTO solicitudes_devolucion (id, id_pago, motivo, monto_solicitado, estado, fecha) VALUES
(1, 9, 'Certificado emitido con datos erroneos; tramite anulado', 45.00, 'APROBADA', '2026-09-11 09:00'),
(2, 7, 'Constancia solicitada por error; ya tenia una vigente',   30.00, 'PENDIENTE', '2026-09-04 10:15'),
(3, 6, 'Retiro voluntario del semestre fuera del plazo de devolucion', 350.00, 'RECHAZADA', '2026-10-20 16:40')
ON CONFLICT (id) DO NOTHING;

INSERT INTO reembolsos_pago (id, id_solicitud_devolucion, id_cuenta_estudiante, monto_reembolsado, fecha) VALUES
(1, 1, 5, 45.00, '2026-09-15 11:30')
ON CONFLICT (id) DO NOTHING;

-- El saldo de cada cuenta de demo es la suma de sus movimientos (ABONO suma, CARGO resta)
UPDATE cuentas_estudiante c SET saldo_actual = COALESCE((
    SELECT SUM(CASE WHEN m.tipo = 'ABONO' THEN m.monto ELSE -m.monto END)
    FROM movimientos_cuenta m WHERE m.id_cuenta = c.id), 0)
WHERE c.id BETWEEN 1 AND 5;  -- solo las cuentas de demo: no toca cuentas creadas desde la app

-- Las siguientes altas desde la app continuan despues de los ids fijos
SELECT setval(pg_get_serial_sequence('categorias_concepto', 'id'), (SELECT max(id) FROM categorias_concepto));
SELECT setval(pg_get_serial_sequence('conceptos_pago', 'id'), (SELECT max(id) FROM conceptos_pago));
SELECT setval(pg_get_serial_sequence('pagos', 'id'), (SELECT max(id) FROM pagos));
SELECT setval(pg_get_serial_sequence('cuentas_estudiante', 'id'), (SELECT max(id) FROM cuentas_estudiante));
SELECT setval(pg_get_serial_sequence('movimientos_cuenta', 'id'), (SELECT max(id) FROM movimientos_cuenta));
SELECT setval(pg_get_serial_sequence('tipos_beca', 'id'), (SELECT max(id) FROM tipos_beca));
SELECT setval(pg_get_serial_sequence('becas_aplicadas', 'id'), (SELECT max(id) FROM becas_aplicadas));
SELECT setval(pg_get_serial_sequence('solicitudes_devolucion', 'id'), (SELECT max(id) FROM solicitudes_devolucion));
SELECT setval(pg_get_serial_sequence('reembolsos_pago', 'id'), (SELECT max(id) FROM reembolsos_pago));
SELECT setval(pg_get_serial_sequence('ajustes_manuales_saldo', 'id'), (SELECT max(id) FROM ajustes_manuales_saldo));
SELECT setval(pg_get_serial_sequence('cancelaciones_cargo_matricula', 'id'), (SELECT max(id) FROM cancelaciones_cargo_matricula));
SELECT setval(pg_get_serial_sequence('renovaciones_suspensiones_beca', 'id'), (SELECT max(id) FROM renovaciones_suspensiones_beca));
SELECT setval(pg_get_serial_sequence('tipos_descuento', 'id'), (SELECT max(id) FROM tipos_descuento));
SELECT setval(pg_get_serial_sequence('descuentos_aplicados', 'id'), (SELECT max(id) FROM descuentos_aplicados));
SELECT setval(pg_get_serial_sequence('convenios_institucionales_descuento', 'id'), (SELECT max(id) FROM convenios_institucionales_descuento));
SELECT setval(pg_get_serial_sequence('estados_cobro', 'id'), (SELECT max(id) FROM estados_cobro));
SELECT setval(pg_get_serial_sequence('detalles_cobro', 'id'), (SELECT max(id) FROM detalles_cobro));
