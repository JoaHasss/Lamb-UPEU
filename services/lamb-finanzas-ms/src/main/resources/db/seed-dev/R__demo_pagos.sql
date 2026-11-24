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

-- Cuentas de estudiante (una por persona). saldo_actual = lo que adeuda hoy:
-- persona 2 debe la matricula (pago 3) y el carnet (pago 8, aun sin validar); persona 3 la matricula
-- (pago 4, voucher sin validar). Persona 4 no adeuda: su matricula se anulo.
INSERT INTO cuentas_estudiante (id, id_persona, saldo_actual, fecha_apertura) VALUES
(1, 1,   0.00, '2026-03-10 09:15'),
(2, 2, 375.00, '2026-08-14 16:05'),
(3, 3, 350.00, '2026-08-25 11:40'),
(4, 4,   0.00, '2026-08-13 08:50'),
(5, 5,   0.00, '2026-08-11 12:20')
ON CONFLICT (id) DO NOTHING;

-- Movimientos de cuenta: explican cada saldo de arriba (CARGO suma a la deuda, ABONO la resta).
-- Cada pago genera su CARGO; al aprobarse, su ABONO. Persona 4: matricula anulada, cargo revertido.
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
(11, 4, 'ABONO', 350.00, 'Cargo de matricula cancelado: Matricula 2026-2',   '2026-08-20 09:00', 5),
(12, 5, 'CARGO', 350.00, 'Matricula 2026-2',                                 '2026-08-11 12:20', 6),
(13, 5, 'ABONO', 350.00, 'Pago aprobado: Matricula 2026-2',                  '2026-08-11 12:26', 6),
(14, 5, 'CARGO',  45.00, 'Certificado de notas',                             '2026-09-10 17:20', 9),
(15, 5, 'ABONO',  45.00, 'Pago aprobado: Certificado de notas',              '2026-09-10 17:25', 9)
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
