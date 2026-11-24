-- Catalogo de modalidades de matricula (Ley Universitaria 30220, art. 39: modalidades de estudio).
-- Sin estas filas el desplegable "Modalidad de matricula" del frontend queda vacio.
INSERT INTO modalidades_matricula (codigo, nombre, descripcion, activo, articulo_legal, requiere_pago) VALUES
('MOD-001', 'Presencial', 'Clases en el campus con asistencia obligatoria segun el horario del grupo.', true, 'Ley 30220 Art. 39', true),
('MOD-002', 'Semipresencial', 'Combina sesiones presenciales con actividades virtuales guiadas por el docente.', true, 'Ley 30220 Art. 39', true),
('MOD-003', 'A distancia', 'Clases virtuales con acompanamiento docente, sin asistencia fisica al campus.', true, 'Ley 30220 Art. 39', true)
ON CONFLICT (codigo) DO NOTHING;
