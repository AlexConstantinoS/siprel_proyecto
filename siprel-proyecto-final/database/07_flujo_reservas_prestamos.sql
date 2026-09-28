USE siprel_db;
DELIMITER $$

-- =========================================================
-- GESTION DE RESERVAS POR ADMIN / ENCARGADO
-- =========================================================

DROP PROCEDURE IF EXISTS usp_ReservasListarGestion$$
CREATE PROCEDURE usp_ReservasListarGestion()
BEGIN
  SELECT r.reserva_id,r.cuenta_id,c.usuario,c.nombre AS solicitante,
         r.equipo_id,e.codigo,e.nombre AS equipo,e.marca,e.ubicacion,
         r.fecha_inicio,r.fecha_fin,r.motivo,r.estado,r.creado_en
  FROM reservas r
  JOIN cuentas c ON c.cuenta_id=r.cuenta_id
  JOIN equipos e ON e.equipo_id=r.equipo_id
  ORDER BY
    CASE r.estado
      WHEN 'PENDIENTE' THEN 1
      WHEN 'APROBADA' THEN 2
      WHEN 'ATENDIDA' THEN 3
      WHEN 'RECHAZADA' THEN 4
      WHEN 'CANCELADA' THEN 5
      ELSE 6
    END,
    r.fecha_inicio ASC,
    r.reserva_id DESC;
END$$

DROP PROCEDURE IF EXISTS usp_ReservaCambiarEstado$$
CREATE PROCEDURE usp_ReservaCambiarEstado(
  IN p_reserva_id INT,
  IN p_estado VARCHAR(20)
)
BEGIN
  DECLARE v_actual VARCHAR(20) DEFAULT NULL;

  SELECT estado INTO v_actual
  FROM reservas
  WHERE reserva_id=p_reserva_id
  LIMIT 1;

  IF v_actual IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Reserva no encontrada';
  END IF;

  IF p_estado NOT IN ('APROBADA','RECHAZADA') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Estado de reserva invalido';
  END IF;

  IF v_actual NOT IN ('PENDIENTE','APROBADA') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='La reserva ya no puede cambiar de estado';
  END IF;

  IF p_estado='APROBADA' AND v_actual<>'PENDIENTE' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Solo una reserva pendiente puede aprobarse';
  END IF;

  UPDATE reservas
  SET estado=p_estado
  WHERE reserva_id=p_reserva_id;

  SELECT r.reserva_id,r.estado,r.cuenta_id,r.equipo_id
  FROM reservas r
  WHERE r.reserva_id=p_reserva_id;
END$$

DROP PROCEDURE IF EXISTS usp_ReservaConvertirAPrestamo$$
CREATE PROCEDURE usp_ReservaConvertirAPrestamo(
  IN p_reserva_id INT,
  IN p_autorizado_por INT,
  IN p_condicion_salida VARCHAR(300),
  IN p_observaciones VARCHAR(500)
)
BEGIN
  DECLARE v_cuenta_id INT DEFAULT NULL;
  DECLARE v_equipo_id INT DEFAULT NULL;
  DECLARE v_fecha_fin DATETIME DEFAULT NULL;
  DECLARE v_estado_reserva VARCHAR(20) DEFAULT NULL;
  DECLARE v_estado_equipo VARCHAR(20) DEFAULT NULL;
  DECLARE v_conflictos INT DEFAULT 0;
  DECLARE v_prestamo_id INT DEFAULT 0;

  SELECT cuenta_id,equipo_id,fecha_fin,estado
    INTO v_cuenta_id,v_equipo_id,v_fecha_fin,v_estado_reserva
  FROM reservas
  WHERE reserva_id=p_reserva_id
  LIMIT 1;

  IF v_estado_reserva IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Reserva no encontrada';
  END IF;

  IF v_estado_reserva<>'APROBADA' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='La reserva debe estar APROBADA antes de generar el prestamo';
  END IF;

  IF v_fecha_fin<=NOW() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='La fecha compromiso de la reserva ya vencio';
  END IF;

  IF NOT EXISTS(SELECT 1 FROM cuentas WHERE cuenta_id=v_cuenta_id AND activo=1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='La cuenta solicitante ya no esta activa';
  END IF;

  IF NOT EXISTS(SELECT 1 FROM cuentas WHERE cuenta_id=p_autorizado_por AND activo=1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Cuenta autorizadora invalida';
  END IF;

  SELECT estado INTO v_estado_equipo
  FROM equipos
  WHERE equipo_id=v_equipo_id AND activo=1
  LIMIT 1;

  IF v_estado_equipo IS NULL OR v_estado_equipo IN ('MANTENIMIENTO','BAJA','PRESTADO','RESERVADO') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='El equipo ya no esta disponible para generar el prestamo';
  END IF;

  SELECT COUNT(*) INTO v_conflictos
  FROM prestamo_detalle pd
  JOIN prestamos p ON p.prestamo_id=pd.prestamo_id
  WHERE pd.equipo_id=v_equipo_id
    AND p.estado IN ('PENDIENTE','ENTREGADO','VENCIDO');

  IF v_conflictos>0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='El equipo ya esta asociado a otro prestamo activo';
  END IF;

  INSERT INTO prestamos(cuenta_id,autorizado_por,fecha_prestamo,fecha_compromiso,estado,observaciones)
  VALUES(
    v_cuenta_id,
    p_autorizado_por,
    NOW(),
    v_fecha_fin,
    'PENDIENTE',
    NULLIF(TRIM(CONCAT('Reserva #',p_reserva_id,
      CASE WHEN NULLIF(TRIM(p_observaciones),'') IS NULL THEN '' ELSE CONCAT(' - ',TRIM(p_observaciones)) END
    )), '')
  );
  SET v_prestamo_id=LAST_INSERT_ID();

  INSERT INTO prestamo_detalle(prestamo_id,equipo_id,condicion_salida)
  VALUES(v_prestamo_id,v_equipo_id,NULLIF(TRIM(p_condicion_salida),''));

  UPDATE reservas
  SET estado='ATENDIDA'
  WHERE reserva_id=p_reserva_id;

  UPDATE equipos
  SET estado='RESERVADO'
  WHERE equipo_id=v_equipo_id AND activo=1;

  SELECT v_prestamo_id AS prestamo_id,
         p_reserva_id AS reserva_id,
         v_cuenta_id AS cuenta_id,
         v_equipo_id AS equipo_id,
         'PENDIENTE' AS estado;
END$$

DELIMITER ;
