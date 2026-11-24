-- DATOS DE DEMO (solo DEV). Flyway los carga desde lamb-personas-ms-dev.yml (locations incluye db/seed-dev);
-- el perfil prod no incluye esta carpeta. Idempotente: ids fijos + ON CONFLICT DO NOTHING.
-- Estudiantes 1..5 ficticios que usan los seeds de matricula y finanzas. Si la persona 1 ya existe
-- (p.ej. registrada a mano), ON CONFLICT la deja como esta.
INSERT INTO personas (id, tipo_documento, numero_documento, nombres, apellidos, email, telefono, fecha_nacimiento, tipo) VALUES
(1, 'DNI', '70000001', 'Carlos Alberto','Quispe Ticona',  'carlos.quispe@lamb.edu.pe', '900000001', '2005-09-18', 'ESTUDIANTE'),
(2, 'DNI', '70000002', 'Lucia Andrea',  'Mamani Quispe',  'lucia.mamani@lamb.edu.pe',  '900000002', '2006-04-12', 'ESTUDIANTE'),
(3, 'DNI', '70000003', 'Diego Alonso',  'Condori Ramos',  'diego.condori@lamb.edu.pe', '900000003', '2004-11-03', 'ESTUDIANTE'),
(4, 'DNI', '70000004', 'Maria Fernanda','Huanca Flores',  'maria.huanca@lamb.edu.pe',  '900000004', '2005-01-27', 'ESTUDIANTE'),
(5, 'DNI', '70000005', 'Jose Manuel',   'Apaza Choque',   'jose.apaza@lamb.edu.pe',    '900000005', '2007-06-30', 'ESTUDIANTE')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('personas', 'id'), (SELECT max(id) FROM personas));
