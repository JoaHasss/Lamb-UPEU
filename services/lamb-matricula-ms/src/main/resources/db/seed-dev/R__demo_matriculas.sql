-- DATOS DE DEMO (solo DEV). Flyway los carga desde lamb-matricula-ms-dev.yml (locations incluye db/seed-dev);
-- el perfil prod no incluye esta carpeta. Idempotente: ids fijos + ON CONFLICT DO NOTHING.
-- Coherente con lamb-finanzas-ms/db/seed-dev/R__demo_pagos.sql: cada matricula 1..6 tiene su cargo
-- (pagos.matricula_id) y el estado de la matricula sigue al del pago:
--   pago APROBADO -> CONFIRMADA, PENDIENTE / EN_PROCESO -> REGISTRADA, RECHAZADO -> ANULADA.
-- Tipos (MAT-001..010, V9) y modalidades (MOD-001..003, V12) ya existen por migracion.
-- id_persona 1..5: estudiantes de demo de lamb-personas-ms/db/seed-dev/R__demo_personas.sql.
-- Periodos con el codigo de lamb-planificacion-ms (2026-1, 2026-2). id_seccion = id de grupo ABIERTO
-- de planificacion de ese periodo (los creditos son los del curso). Esos grupos los crea
-- lamb-planificacion-ms/db/seed-dev/R__demo_planificacion.sql con los mismos ids.

INSERT INTO cronogramas_matricula (id, periodo, fecha_inicio, fecha_fin, descripcion) VALUES
(1, '2026-1', '2026-03-02', '2026-03-20', 'Matricula regular del semestre 2026-1'),
(2, '2026-2', '2026-08-03', '2026-08-21', 'Matricula regular del semestre 2026-2')
ON CONFLICT (id) DO NOTHING;

INSERT INTO variaciones_matricula (id, id_cronograma, tipo, fecha_inicio, fecha_fin, descripcion) VALUES
(1, 1, 'RECTIFICACION', '2026-03-23', '2026-03-27', 'Rectificacion de cursos 2026-1'),
(2, 2, 'RECTIFICACION', '2026-08-24', '2026-08-28', 'Rectificacion de cursos 2026-2'),
(3, 2, 'RETIRO',        '2026-08-31', '2026-10-16', 'Retiro de cursos sin nota 2026-2')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ampliaciones_plazo_matricula (id, id_cronograma, fecha_ampliada, motivo, autorizado_por) VALUES
(1, 2, '2026-08-28', 'Caida de la pasarela de pagos el ultimo dia de matricula', 'Direccion de Registros Academicos')
ON CONFLICT (id) DO NOTHING;

INSERT INTO matriculas (id, id_persona, periodo, fecha, estado, id_tipo_matricula, id_modalidad_matricula) VALUES
(1, 1, '2026-1', '2026-03-10 09:15', 'CONFIRMADA', 8, 1),  -- ingresante, ciclo 1
(2, 1, '2026-2', '2026-08-12 10:30', 'CONFIRMADA', 1, 1),  -- regular, ciclo 2
(3, 2, '2026-2', '2026-08-14 16:05', 'REGISTRADA', 8, 2),  -- ingresante, ciclo 1
(4, 3, '2026-2', '2026-08-25 11:40', 'REGISTRADA', 2, 1),  -- extemporanea (dentro de la ampliacion), ciclo 3
(5, 4, '2026-2', '2026-08-13 08:50', 'ANULADA',    1, 3),  -- ciclo 3
(6, 5, '2026-2', '2026-08-11 12:20', 'CONFIRMADA', 8, 1)   -- ingresante, ciclo 1
ON CONFLICT (id) DO NOTHING;

INSERT INTO detalle_matriculas (id, id_matricula, id_seccion, creditos) VALUES
-- Mat. 1 (2026-1, grupo 1A): Matematica Basica, Programacion I, Intro. a la Ing. de Sistemas
(1,  1, 843, 4), (2,  1, 844, 5), (3,  1, 845, 3),
-- Mat. 2 (2026-2, grupo 2A): POO, Matematica Discreta, Redaccion Academica
(4,  2, 885, 4), (5,  2, 886, 3), (6,  2, 887, 3),
-- Mat. 3 (2026-2, grupo 1A): Matematica Basica, Programacion I
(7,  3, 897, 4), (8,  3, 898, 5),
-- Mat. 4 (2026-2, grupo 3A): Estadistica Aplicada
(9,  4, 871, 4),
-- Mat. 5 (2026-2, grupo 3A): Ingles Basico
(10, 5, 874, 3),
-- Mat. 6 (2026-2, grupo 1A): Intro. a la Ing. de Sistemas, Comunicacion y Lectura Critica
(11, 6, 899, 3), (12, 6, 901, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO historial_estados_matricula (id, id_matricula, estado_anterior, estado_nuevo, fecha_cambio, observacion) VALUES
(1,  1, NULL,         'REGISTRADA', '2026-03-10 09:15', 'Matricula registrada por el estudiante'),
(2,  1, 'REGISTRADA', 'CONFIRMADA', '2026-03-10 09:20', 'Pago de matricula aprobado (pago 1)'),
(3,  2, NULL,         'REGISTRADA', '2026-08-12 10:30', 'Matricula registrada por el estudiante'),
(4,  2, 'REGISTRADA', 'CONFIRMADA', '2026-08-12 10:34', 'Pago de matricula aprobado (pago 2)'),
(5,  3, NULL,         'REGISTRADA', '2026-08-14 16:05', 'Matricula registrada; cargo pendiente de pago'),
(6,  4, NULL,         'REGISTRADA', '2026-08-25 11:40', 'Matricula extemporanea; voucher en validacion'),
(7,  5, NULL,         'REGISTRADA', '2026-08-13 08:50', 'Matricula registrada por el estudiante'),
(8,  5, 'REGISTRADA', 'ANULADA',    '2026-08-29 18:00', 'Anulada por impago: pago rechazado (pago 5)'),
(9,  6, NULL,         'REGISTRADA', '2026-08-11 12:20', 'Matricula de ingresante registrada'),
(10, 6, 'REGISTRADA', 'CONFIRMADA', '2026-08-11 12:26', 'Pago de matricula aprobado (pago 6)')
ON CONFLICT (id) DO NOTHING;

-- Las siguientes altas desde la app continuan despues de los ids fijos
SELECT setval(pg_get_serial_sequence('cronogramas_matricula', 'id'), (SELECT max(id) FROM cronogramas_matricula));
SELECT setval(pg_get_serial_sequence('variaciones_matricula', 'id'), (SELECT max(id) FROM variaciones_matricula));
SELECT setval(pg_get_serial_sequence('ampliaciones_plazo_matricula', 'id'), (SELECT max(id) FROM ampliaciones_plazo_matricula));
SELECT setval(pg_get_serial_sequence('matriculas', 'id'), (SELECT max(id) FROM matriculas));
SELECT setval(pg_get_serial_sequence('detalle_matriculas', 'id'), (SELECT max(id) FROM detalle_matriculas));
SELECT setval(pg_get_serial_sequence('historial_estados_matricula', 'id'), (SELECT max(id) FROM historial_estados_matricula));
