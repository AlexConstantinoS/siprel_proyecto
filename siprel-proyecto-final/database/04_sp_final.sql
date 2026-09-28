USE siprel_db;
DELIMITER $$

DROP PROCEDURE IF EXISTS usp_AuthObtenerPorUsuario$$
CREATE PROCEDURE usp_AuthObtenerPorUsuario(IN p_usuario VARCHAR(50))
BEGIN
  SELECT c.cuenta_id, c.usuario, c.password_hash, c.nombre, c.email, r.nombre AS rol
  FROM cuentas c JOIN roles r ON r.rol_id = c.rol_id
  WHERE c.usuario = TRIM(p_usuario) AND c.activo = 1 LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS usp_RegistroSolicitante$$
CREATE PROCEDURE usp_RegistroSolicitante(IN p_usuario VARCHAR(50), IN p_password_hash VARCHAR(255), IN p_nombre VARCHAR(120), IN p_email VARCHAR(150))
BEGIN
  DECLARE v_rol_id INT DEFAULT NULL;
  SELECT rol_id INTO v_rol_id FROM roles WHERE nombre='SOLICITANTE' AND activo=1 LIMIT 1;
  IF v_rol_id IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Rol SOLICITANTE no disponible'; END IF;
  INSERT INTO cuentas(usuario,password_hash,nombre,email,rol_id,activo)
  VALUES(TRIM(p_usuario), p_password_hash, TRIM(p_nombre), LOWER(TRIM(p_email)), v_rol_id, 1);
  SELECT LAST_INSERT_ID() AS cuenta_id;
END$$

DROP PROCEDURE IF EXISTS usp_BuscarEquipos$$
CREATE PROCEDURE usp_BuscarEquipos(IN p_filtro VARCHAR(100))
BEGIN
  SELECT e.equipo_id,e.codigo,e.nombre,e.marca,e.modelo,e.numero_serie,c.nombre AS categoria,e.estado,e.ubicacion,e.observaciones
  FROM equipos e JOIN categorias_equipo c ON c.categoria_id=e.categoria_id
  WHERE e.activo=1 AND (
    p_filtro IS NULL OR p_filtro='' OR
    e.nombre LIKE CONCAT('%',p_filtro,'%') OR e.codigo LIKE CONCAT('%',p_filtro,'%') OR e.marca LIKE CONCAT('%',p_filtro,'%')
  ) ORDER BY e.nombre;
END$$

DROP PROCEDURE IF EXISTS usp_ObtenerEquipoPorId$$
CREATE PROCEDURE usp_ObtenerEquipoPorId(IN p_equipo_id INT)
BEGIN
  SELECT e.equipo_id,e.codigo,e.nombre,e.marca,e.modelo,e.numero_serie,c.nombre AS categoria,e.estado,e.ubicacion,e.observaciones
  FROM equipos e JOIN categorias_equipo c ON c.categoria_id=e.categoria_id
  WHERE e.equipo_id=p_equipo_id AND e.activo=1;
END$$

DROP PROCEDURE IF EXISTS usp_ObtenerPrestamoSeguro$$
CREATE PROCEDURE usp_ObtenerPrestamoSeguro(IN p_prestamo_id INT, IN p_cuenta_id INT, IN p_rol VARCHAR(50))
BEGIN
  SELECT p.prestamo_id,p.cuenta_id,c.usuario,c.nombre AS solicitante,p.fecha_prestamo,p.fecha_compromiso,p.fecha_devolucion,p.estado,p.observaciones,
         e.equipo_id,e.codigo AS codigo_equipo,e.nombre AS equipo,pd.condicion_salida,pd.condicion_entrada
  FROM prestamos p JOIN cuentas c ON c.cuenta_id=p.cuenta_id
  LEFT JOIN prestamo_detalle pd ON pd.prestamo_id=p.prestamo_id
  LEFT JOIN equipos e ON e.equipo_id=pd.equipo_id
  WHERE p.prestamo_id=p_prestamo_id AND (p.cuenta_id=p_cuenta_id OR p_rol IN ('ADMIN','ENCARGADO'));
END$$

DROP PROCEDURE IF EXISTS usp_ListarPrestamosPorCuenta$$
CREATE PROCEDURE usp_ListarPrestamosPorCuenta(IN p_cuenta_id INT)
BEGIN
  SELECT p.prestamo_id,p.cuenta_id,p.fecha_prestamo,p.fecha_compromiso,p.fecha_devolucion,p.estado,p.observaciones,
         GROUP_CONCAT(CONCAT(e.codigo,' - ',e.nombre) SEPARATOR ', ') AS equipos
  FROM prestamos p LEFT JOIN prestamo_detalle pd ON pd.prestamo_id=p.prestamo_id LEFT JOIN equipos e ON e.equipo_id=pd.equipo_id
  WHERE p.cuenta_id=p_cuenta_id
  GROUP BY p.prestamo_id,p.cuenta_id,p.fecha_prestamo,p.fecha_compromiso,p.fecha_devolucion,p.estado,p.observaciones
  ORDER BY p.fecha_prestamo DESC;
END$$

DROP PROCEDURE IF EXISTS usp_CrearReserva$$
CREATE PROCEDURE usp_CrearReserva(IN p_cuenta_id INT, IN p_equipo_id INT, IN p_fecha_inicio DATETIME, IN p_fecha_fin DATETIME, IN p_motivo VARCHAR(300))
BEGIN
  DECLARE v_estado VARCHAR(30) DEFAULT NULL;
  DECLARE v_conflictos INT DEFAULT 0;
  IF p_fecha_inicio <= NOW() OR p_fecha_fin <= p_fecha_inicio OR TIMESTAMPDIFF(DAY,p_fecha_inicio,p_fecha_fin)>7 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Rango de fechas invalido';
  END IF;
  SELECT estado INTO v_estado FROM equipos WHERE equipo_id=p_equipo_id AND activo=1 LIMIT 1;
  IF v_estado IS NULL OR v_estado IN ('MANTENIMIENTO','BAJA','PRESTADO') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='El equipo no esta disponible para reserva';
  END IF;
  SELECT COUNT(*) INTO v_conflictos FROM reservas
    WHERE equipo_id=p_equipo_id AND estado IN ('PENDIENTE','APROBADA')
      AND p_fecha_inicio < fecha_fin AND p_fecha_fin > fecha_inicio;
  IF v_conflictos>0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Existe una reserva que se traslapa con el horario solicitado'; END IF;
  INSERT INTO reservas(cuenta_id,equipo_id,fecha_inicio,fecha_fin,motivo,estado)
  VALUES(p_cuenta_id,p_equipo_id,p_fecha_inicio,p_fecha_fin,NULLIF(TRIM(p_motivo),''),'PENDIENTE');
  SELECT LAST_INSERT_ID() AS nueva_reserva_id;
END$$

DROP PROCEDURE IF EXISTS usp_ListarReservasPorCuenta$$
CREATE PROCEDURE usp_ListarReservasPorCuenta(IN p_cuenta_id INT)
BEGIN
  SELECT r.reserva_id,r.cuenta_id,r.equipo_id,e.codigo,e.nombre AS equipo,r.fecha_inicio,r.fecha_fin,r.motivo,r.estado,r.creado_en
  FROM reservas r JOIN equipos e ON e.equipo_id=r.equipo_id
  WHERE r.cuenta_id=p_cuenta_id ORDER BY r.creado_en DESC;
END$$

DROP PROCEDURE IF EXISTS usp_CancelarReserva$$
CREATE PROCEDURE usp_CancelarReserva(IN p_reserva_id INT, IN p_cuenta_id INT, IN p_rol VARCHAR(50))
BEGIN
  UPDATE reservas SET estado='CANCELADA'
  WHERE reserva_id=p_reserva_id AND estado IN ('PENDIENTE','APROBADA')
    AND (cuenta_id=p_cuenta_id OR p_rol IN ('ADMIN','ENCARGADO'));
  SELECT ROW_COUNT() AS filas_afectadas, p_reserva_id AS reserva_id;
END$$

DROP PROCEDURE IF EXISTS usp_RegistrarIncidencia$$
CREATE PROCEDURE usp_RegistrarIncidencia(IN p_cuenta_id INT, IN p_equipo_id INT, IN p_tipo VARCHAR(20), IN p_descripcion TEXT)
BEGIN
  IF NOT EXISTS(SELECT 1 FROM equipos WHERE equipo_id=p_equipo_id AND activo=1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Equipo no encontrado';
  END IF;
  INSERT INTO incidencias(cuenta_id,equipo_id,tipo,descripcion,estado)
  VALUES(p_cuenta_id,p_equipo_id,p_tipo,TRIM(p_descripcion),'ABIERTA');
  SELECT LAST_INSERT_ID() AS nueva_incidencia_id;
END$$

DROP PROCEDURE IF EXISTS usp_ListarIncidenciasSeguras$$
CREATE PROCEDURE usp_ListarIncidenciasSeguras(IN p_cuenta_id INT, IN p_rol VARCHAR(50))
BEGIN
  SELECT i.incidencia_id,i.cuenta_id,c.usuario,e.equipo_id,e.codigo,e.nombre AS equipo,i.tipo,i.descripcion,i.estado,i.creado_en
  FROM incidencias i JOIN cuentas c ON c.cuenta_id=i.cuenta_id JOIN equipos e ON e.equipo_id=i.equipo_id
  WHERE i.cuenta_id=p_cuenta_id OR p_rol IN ('ADMIN','ENCARGADO') ORDER BY i.creado_en DESC;
END$$

DROP PROCEDURE IF EXISTS usp_AuditoriaListar$$
CREATE PROCEDURE usp_AuditoriaListar()
BEGIN
  SELECT log_id,cuenta_id,usuario,accion,detalle,ip,user_agent,fecha_hora FROM bitacora_seguridad ORDER BY fecha_hora DESC LIMIT 500;
END$$

DROP PROCEDURE IF EXISTS usp_AuditoriaRegistrar$$
CREATE PROCEDURE usp_AuditoriaRegistrar(IN p_cuenta_id INT, IN p_usuario VARCHAR(50), IN p_accion VARCHAR(100), IN p_detalle VARCHAR(700), IN p_ip VARCHAR(50), IN p_user_agent VARCHAR(300))
BEGIN
  INSERT INTO bitacora_seguridad(cuenta_id,usuario,accion,detalle,ip,user_agent)
  VALUES(p_cuenta_id,NULLIF(TRIM(p_usuario),''),TRIM(p_accion),NULLIF(TRIM(p_detalle),''),NULLIF(TRIM(p_ip),''),NULLIF(TRIM(p_user_agent),''));
END$$

DROP PROCEDURE IF EXISTS usp_RolesListar$$
CREATE PROCEDURE usp_RolesListar()
BEGIN SELECT rol_id,nombre,activo FROM roles WHERE activo=1 ORDER BY nombre; END$$

DROP PROCEDURE IF EXISTS usp_UsuariosListar$$
CREATE PROCEDURE usp_UsuariosListar(IN p_incluir_inactivos TINYINT)
BEGIN
  SELECT c.cuenta_id,c.usuario,c.nombre,c.email,c.rol_id,r.nombre AS rol,c.activo,c.creado_en,c.actualizado_en
  FROM cuentas c JOIN roles r ON r.rol_id=c.rol_id
  WHERE p_incluir_inactivos=1 OR c.activo=1 ORDER BY c.cuenta_id;
END$$

DROP PROCEDURE IF EXISTS usp_UsuarioObtenerPorId$$
CREATE PROCEDURE usp_UsuarioObtenerPorId(IN p_cuenta_id INT)
BEGIN
  SELECT c.cuenta_id,c.usuario,c.nombre,c.email,c.rol_id,r.nombre AS rol,c.activo,c.creado_en,c.actualizado_en
  FROM cuentas c JOIN roles r ON r.rol_id=c.rol_id WHERE c.cuenta_id=p_cuenta_id;
END$$

DROP PROCEDURE IF EXISTS usp_UsuarioCrear$$
CREATE PROCEDURE usp_UsuarioCrear(IN p_usuario VARCHAR(50), IN p_password_hash VARCHAR(255), IN p_nombre VARCHAR(120), IN p_email VARCHAR(150), IN p_rol_id INT, IN p_activo TINYINT)
BEGIN
  IF NOT EXISTS(SELECT 1 FROM roles WHERE rol_id=p_rol_id AND activo=1) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Rol invalido'; END IF;
  INSERT INTO cuentas(usuario,password_hash,nombre,email,rol_id,activo)
  VALUES(TRIM(p_usuario),p_password_hash,TRIM(p_nombre),LOWER(TRIM(p_email)),p_rol_id,COALESCE(p_activo,1));
  CALL usp_UsuarioObtenerPorId(LAST_INSERT_ID());
END$$

DROP PROCEDURE IF EXISTS usp_UsuarioActualizar$$
CREATE PROCEDURE usp_UsuarioActualizar(IN p_cuenta_id INT, IN p_usuario VARCHAR(50), IN p_password_hash VARCHAR(255), IN p_nombre VARCHAR(120), IN p_email VARCHAR(150), IN p_rol_id INT, IN p_activo TINYINT)
BEGIN
  IF NOT EXISTS(SELECT 1 FROM roles WHERE rol_id=p_rol_id AND activo=1) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Rol invalido'; END IF;
  UPDATE cuentas SET usuario=TRIM(p_usuario),password_hash=COALESCE(NULLIF(TRIM(p_password_hash),''),password_hash),nombre=TRIM(p_nombre),
         email=LOWER(TRIM(p_email)),rol_id=p_rol_id,activo=COALESCE(p_activo,activo)
  WHERE cuenta_id=p_cuenta_id;
  CALL usp_UsuarioObtenerPorId(p_cuenta_id);
END$$

DROP PROCEDURE IF EXISTS usp_UsuarioEliminar$$
CREATE PROCEDURE usp_UsuarioEliminar(IN p_cuenta_id INT)
BEGIN
  UPDATE cuentas SET activo=0 WHERE cuenta_id=p_cuenta_id;
  SELECT p_cuenta_id AS cuenta_id,ROW_COUNT() AS filas_afectadas,'BAJA_LOGICA' AS operacion;
END$$

DELIMITER ;
