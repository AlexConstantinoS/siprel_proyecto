USE siprel_db;

INSERT INTO roles (nombre) VALUES ('ADMIN'), ('ENCARGADO'), ('SOLICITANTE');

-- Hashes bcrypt cost 12. Credenciales de DEMO documentadas en README.
INSERT INTO cuentas (usuario, password_hash, nombre, email, rol_id) VALUES
('admin', '$2b$12$QWwiWVbRGWqiBeV.gCJgJekuDajm.xyGbxAzxKMuGVP8CRC2zAZJC', 'Ana Administradora', 'admin@siprel.local', 1),
('encargado', '$2b$12$LXMDYx1F0b4ipB9W31kV5uen5KaoF8zOG0GXvu.V3BpU62iYU7Zjq', 'Ernesto Encargado', 'encargado@siprel.local', 2),
('jose', '$2b$12$QdIYFFRpp8xpXVoWxtGb/Ot/FgOq9LBTEikgmIBbPf0yk4BY82fNy', 'Jose Mendoza', 'jose@siprel.local', 3),
('maria', '$2b$12$noO7ekg0AO03kKM6j3jzfOvEyT9MBNOoDbjqzHWRo/LzGbZ8silnu', 'Maria Lopez', 'maria@siprel.local', 3);

INSERT INTO categorias_equipo (nombre, descripcion) VALUES
('LAPTOP', 'Equipos portatiles para practicas'),
('PROYECTOR', 'Proyectores de aula y laboratorio'),
('HERRAMIENTA', 'Herramientas electronicas y de mantenimiento'),
('REDES', 'Equipos para practicas de redes');

INSERT INTO equipos (codigo, nombre, marca, modelo, numero_serie, categoria_id, estado, ubicacion, observaciones) VALUES
('EQ-001', 'Laptop Dell Latitude', 'Dell', 'Latitude 5420', 'DL5420-001', 1, 'DISPONIBLE', 'Laboratorio A', 'Equipo de practicas'),
('EQ-002', 'Laptop Lenovo ThinkPad', 'Lenovo', 'T14', 'LVT14-002', 1, 'PRESTADO', 'Laboratorio A', 'Asignada temporalmente'),
('EQ-003', 'Proyector Epson', 'Epson', 'PowerLite E20', 'EP-E20-003', 2, 'DISPONIBLE', 'Almacen', NULL),
('EQ-004', 'Multimetro digital', 'Truper', 'MUT-33', 'TR-M33-004', 3, 'DISPONIBLE', 'Laboratorio B', NULL),
('EQ-005', 'Router de practica', 'MikroTik', 'hAP ac2', 'MT-AC2-005', 4, 'MANTENIMIENTO', 'Taller', 'Puerto ether3 intermitente');

INSERT INTO prestamos (cuenta_id, autorizado_por, fecha_prestamo, fecha_compromiso, estado, observaciones) VALUES
(3, 2, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY), 'ENTREGADO', 'Practica de programacion'),
(4, 2, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY), 'ENTREGADO', 'Practica de redes');

INSERT INTO prestamo_detalle (prestamo_id, equipo_id, condicion_salida) VALUES
(1, 2, 'Buen estado, cargador incluido'),
(2, 3, 'Buen estado, cable HDMI incluido');

INSERT INTO reservas (cuenta_id, equipo_id, fecha_inicio, fecha_fin, motivo, estado) VALUES
(3, 1, DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 3 DAY), INTERVAL 4 HOUR), 'Practica de desarrollo web', 'PENDIENTE'),
(4, 4, DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 2 DAY), INTERVAL 3 HOUR), 'Practica de electronica', 'APROBADA');

INSERT INTO incidencias (cuenta_id, equipo_id, tipo, descripcion, estado) VALUES
(3, 2, 'FALLA', 'La bateria dura menos de una hora.', 'ABIERTA');
