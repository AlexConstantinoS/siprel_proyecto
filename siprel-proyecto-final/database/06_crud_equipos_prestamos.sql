USE siprel_db;
DELIMITER $$

-- =========================================================
-- CRUD DE EQUIPOS
-- =========================================================

DROP PROCEDURE IF EXISTS usp_CategoriasEquipoListar$$
CREATE PROCEDURE usp_CategoriasEquipoListar()
BEGIN
  SELECT categoria_id,nombre,descripcion,activo
  FROM categorias_equipo
  WHERE activo=1
  ORDER BY nombre;
END$$

DROP PROCEDURE IF EXISTS usp_EquiposListarGestion$$
CREATE PROCEDURE usp_EquiposListarGestion(IN p_incluir_inactivos TINYINT, IN p_filtro VARCHAR(100))
BEGIN
  SELECT e.equipo_id,e.codigo,e.nombre,e.marca,e.modelo,e.numero_serie,e.categoria_id,
         c.nombre AS categoria,e.estado,e.ubicacion,e.observaciones,e.activo,e.creado_en
  FROM equipos e
  JOIN categorias_equipo c ON c.categoria_id=e.categoria_id
  WHERE (p_incluir_inactivos=1 OR e.activo=1)
    AND (
      p_filtro IS NULL OR TRIM(p_filtro)='' OR
      e.nombre LIKE CONCAT('%',TRIM(p_filtro),'%') OR
      e.codigo LIKE CONCAT('%',TRIM(p_filtro),'%') OR
      COALESCE(e.marca,'') LIKE CONCAT('%',TRIM(p_filtro),'%')
    )
  ORDER BY e.equipo_id;
END$$

DROP PROCEDURE IF EXISTS usp_EquipoObtenerGestion$$
CREATE PROCEDURE usp_EquipoObtenerGestion(IN p_equipo_id INT)
BEGIN
  SELECT e.equipo_id,e.codigo,e.nombre,e.marca,e.modelo,e.numero_serie,e.categoria_id,
         c.nombre AS categoria,e.estado,e.ubicacion,e.observaciones,e.activo,e.creado_en
  FROM equipos e
  JOIN categorias_equipo c ON c.categoria_id=e.categoria_id
  WHERE e.equipo_id=p_equipo_id;
END$$

DROP PROCEDURE IF EXISTS usp_EquipoCrear$$
CREATE PROCEDURE usp_EquipoCrear(
  IN p_codigo VARCHAR(30), IN p_nombre VARCHAR(150), IN p_marca VARCHAR(80),
  IN p_modelo VARCHAR(80), IN p_numero_serie VARCHAR(100), IN p_categoria_id INT,
  IN p_estado VARCHAR(20), IN p_ubicacion VARCHAR(120), IN p_observaciones VARCHAR(500),
  IN p_activo TINYINT
)
BEGIN
  IF NOT EXISTS(SELECT 1 FROM categorias_equipo WHERE categoria_id=p_categoria_id AND activo=1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Categoria de equipo invalida';
  END IF;
  IF p_estado NOT IN ('DISPONIBLE','RESERVADO','PRESTADO','MANTENIMIENTO','BAJA') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Estado de equipo invalido';
  END IF;
  IF TRIM(p_codigo)='' OR TRIM(p_nombre)='' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Codigo y nombre son obligatorios';
  END IF;

  INSERT INTO equipos(codigo,nombre,marca,modelo,numero_serie,categoria_id,estado,ubicacion,observaciones,activo)
  VALUES(
    UPPER(TRIM(p_codigo)),TRIM(p_nombre),NULLIF(TRIM(p_marca),''),NULLIF(TRIM(p_modelo),''),
    NULLIF(TRIM(p_numero_serie),''),p_categoria_id,p_estado,NULLIF(TRIM(p_ubicacion),''),
    NULLIF(TRIM(p_observaciones),''),COALESCE(p_activo,1)
  );
  CALL usp_EquipoObtenerGestion(LAST_INSERT_ID());
END$$

DROP PROCEDURE IF EXISTS usp_EquipoActualizar$$
CREATE PROCEDURE usp_EquipoActualizar(
  IN p_equipo_id INT, IN p_codigo VARCHAR(30), IN p_nombre VARCHAR(150), IN p_marca VARCHAR(80),
  IN p_modelo VARCHAR(80), IN p_numero_serie VARCHAR(100), IN p_categoria_id INT,
  IN p_estado VARCHAR(20), IN p_ubicacion VARCHAR(120), IN p_observaciones VARCHAR(500),
  IN p_activo TINYINT
)
BEGIN
  IF NOT EXISTS(SELECT 1 FROM equipos WHERE equipo_id=p_equipo_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Equipo no encontrado';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM categorias_equipo WHERE categoria_id=p_categoria_id AND activo=1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Categoria de equipo invalida';
  END IF;
  IF p_estado NOT IN ('DISPONIBLE','RESERVADO','PRESTADO','MANTENIMIENTO','BAJA') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Estado de equipo invalido';
  END IF;
  IF TRIM(p_codigo)='' OR TRIM(p_nombre)='' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Codigo y nombre son obligatorios';
  END IF;

  UPDATE equipos
  SET codigo=UPPER(TRIM(p_codigo)), nombre=TRIM(p_nombre), marca=NULLIF(TRIM(p_marca),''),
      modelo=NULLIF(TRIM(p_modelo),''), numero_serie=NULLIF(TRIM(p_numero_serie),''),
      categoria_id=p_categoria_id, estado=p_estado, ubicacion=NULLIF(TRIM(p_ubicacion),''),
      observaciones=NULLIF(TRIM(p_observaciones),''), activo=COALESCE(p_activo,activo)
  WHERE equipo_id=p_equipo_id;

  CALL usp_EquipoObtenerGestion(p_equipo_id);
END$$

DROP PROCEDURE IF EXISTS usp_EquipoEliminar$$
CREATE PROCEDURE usp_EquipoEliminar(IN p_equipo_id INT)
BEGIN
  DECLARE v_en_uso INT DEFAULT 0;

  IF NOT EXISTS(SELECT 1 FROM equipos WHERE equipo_id=p_equipo_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Equipo no encontrado';
  END IF;

  SELECT COUNT(*) INTO v_en_uso
  FROM prestamo_detalle pd
  JOIN prestamos p ON p.prestamo_id=pd.prestamo_id
  WHERE pd.equipo_id=p_equipo_id AND p.estado IN ('PENDIENTE','ENTREGADO','VENCIDO');

  IF v_en_uso>0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='No se puede dar de baja un equipo asociado a un prestamo activo';
  END IF;

  UPDATE reservas
  SET estado='CANCELADA'
  WHERE equipo_id=p_equipo_id AND estado IN ('PENDIENTE','APROBADA');

  UPDATE equipos SET activo=0,estado='BAJA' WHERE equipo_id=p_equipo_id;
  SELECT p_equipo_id AS equipo_id,ROW_COUNT() AS filas_afectadas,'BAJA_LOGICA' AS operacion;
END$$

-- =========================================================
-- CRUD / GESTION DE PRESTAMOS
-- =========================================================

DROP PROCEDURE IF EXISTS usp_CuentasPrestamoListar$$
CREATE PROCEDURE usp_CuentasPrestamoListar()
BEGIN
  SELECT c.cuenta_id,c.usuario,c.nombre,c.email,r.nombre AS rol
  FROM cuentas c JOIN roles r ON r.rol_id=c.rol_id
  WHERE c.activo=1
  ORDER BY c.nombre;
END$$

DROP PROCEDURE IF EXISTS usp_PrestamosListarGestion$$
CREATE PROCEDURE usp_PrestamosListarGestion()
BEGIN
  SELECT p.prestamo_id,p.cuenta_id,c.usuario,c.nombre AS solicitante,p.autorizado_por,
         a.usuario AS autorizado_usuario,p.fecha_prestamo,p.fecha_compromiso,p.fecha_devolucion,
         p.estado,p.observaciones,
         GROUP_CONCAT(CONCAT(e.codigo,' - ',e.nombre) SEPARATOR ', ') AS equipos
  FROM prestamos p
  JOIN cuentas c ON c.cuenta_id=p.cuenta_id
  LEFT JOIN cuentas a ON a.cuenta_id=p.autorizado_por
  LEFT JOIN prestamo_detalle pd ON pd.prestamo_id=p.prestamo_id
  LEFT JOIN equipos e ON e.equipo_id=pd.equipo_id
  GROUP BY p.prestamo_id,p.cuenta_id,c.usuario,c.nombre,p.autorizado_por,a.usuario,
           p.fecha_prestamo,p.fecha_compromiso,p.fecha_devolucion,p.estado,p.observaciones
  ORDER BY p.prestamo_id DESC;
END$$

DROP PROCEDURE IF EXISTS usp_PrestamoCrear$$
CREATE PROCEDURE usp_PrestamoCrear(
  IN p_cuenta_id INT, IN p_autorizado_por INT, IN p_fecha_compromiso DATETIME,
  IN p_estado VARCHAR(20), IN p_observaciones VARCHAR(500), IN p_equipo_id INT,
  IN p_condicion_salida VARCHAR(300)
)
BEGIN
  DECLARE v_equipo_estado VARCHAR(20) DEFAULT NULL;
  DECLARE v_conflictos INT DEFAULT 0;
  DECLARE v_id INT DEFAULT 0;

  IF NOT EXISTS(SELECT 1 FROM cuentas WHERE cuenta_id=p_cuenta_id AND activo=1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Cuenta solicitante invalida';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM cuentas WHERE cuenta_id=p_autorizado_por AND activo=1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Cuenta autorizadora invalida';
  END IF;
  IF p_fecha_compromiso<=NOW() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='La fecha compromiso debe ser futura';
  END IF;
  IF p_estado NOT IN ('PENDIENTE','ENTREGADO') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Estado inicial de prestamo invalido';
  END IF;

  SELECT estado INTO v_equipo_estado FROM equipos WHERE equipo_id=p_equipo_id AND activo=1 LIMIT 1;
  IF v_equipo_estado IS NULL OR v_equipo_estado IN ('MANTENIMIENTO','BAJA','PRESTADO','RESERVADO') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='El equipo no esta disponible para prestamo';
  END IF;

  SELECT COUNT(*) INTO v_conflictos
  FROM prestamo_detalle pd JOIN prestamos p ON p.prestamo_id=pd.prestamo_id
  WHERE pd.equipo_id=p_equipo_id AND p.estado IN ('PENDIENTE','ENTREGADO','VENCIDO');
  IF v_conflictos>0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='El equipo ya esta asociado a un prestamo activo';
  END IF;

  INSERT INTO prestamos(cuenta_id,autorizado_por,fecha_prestamo,fecha_compromiso,estado,observaciones)
  VALUES(p_cuenta_id,p_autorizado_por,NOW(),p_fecha_compromiso,p_estado,NULLIF(TRIM(p_observaciones),''));
  SET v_id=LAST_INSERT_ID();

  INSERT INTO prestamo_detalle(prestamo_id,equipo_id,condicion_salida)
  VALUES(v_id,p_equipo_id,NULLIF(TRIM(p_condicion_salida),''));

  UPDATE equipos
  SET estado=IF(p_estado='ENTREGADO','PRESTADO','RESERVADO')
  WHERE equipo_id=p_equipo_id;

  SELECT v_id AS prestamo_id;
END$$

DROP PROCEDURE IF EXISTS usp_PrestamoActualizar$$
CREATE PROCEDURE usp_PrestamoActualizar(
  IN p_prestamo_id INT, IN p_cuenta_id INT, IN p_autorizado_por INT,
  IN p_fecha_compromiso DATETIME, IN p_fecha_devolucion DATETIME,
  IN p_estado VARCHAR(20), IN p_observaciones VARCHAR(500), IN p_equipo_id INT,
  IN p_condicion_salida VARCHAR(300), IN p_condicion_entrada VARCHAR(300)
)
BEGIN
  DECLARE v_estado_actual VARCHAR(20) DEFAULT NULL;
  DECLARE v_equipo_anterior INT DEFAULT NULL;
  DECLARE v_equipo_estado VARCHAR(20) DEFAULT NULL;
  DECLARE v_conflictos INT DEFAULT 0;

  SELECT estado INTO v_estado_actual FROM prestamos WHERE prestamo_id=p_prestamo_id LIMIT 1;
  IF v_estado_actual IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Prestamo no encontrado';
  END IF;
  IF v_estado_actual IN ('DEVUELTO','CANCELADO') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Un prestamo finalizado no puede modificarse';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM cuentas WHERE cuenta_id=p_cuenta_id AND activo=1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Cuenta solicitante invalida';
  END IF;
  IF p_estado NOT IN ('PENDIENTE','ENTREGADO','DEVUELTO','VENCIDO','CANCELADO') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Estado de prestamo invalido';
  END IF;

  SELECT equipo_id INTO v_equipo_anterior
  FROM prestamo_detalle WHERE prestamo_id=p_prestamo_id ORDER BY detalle_id LIMIT 1;

  SELECT estado INTO v_equipo_estado FROM equipos WHERE equipo_id=p_equipo_id AND activo=1 LIMIT 1;
  IF v_equipo_estado IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Equipo no encontrado o inactivo';
  END IF;

  IF p_equipo_id<>v_equipo_anterior THEN
    SELECT COUNT(*) INTO v_conflictos
    FROM prestamo_detalle pd JOIN prestamos p ON p.prestamo_id=pd.prestamo_id
    WHERE pd.equipo_id=p_equipo_id AND p.prestamo_id<>p_prestamo_id
      AND p.estado IN ('PENDIENTE','ENTREGADO','VENCIDO');
    IF v_conflictos>0 OR v_equipo_estado IN ('MANTENIMIENTO','BAJA','PRESTADO','RESERVADO') THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='El nuevo equipo no esta disponible';
    END IF;
    UPDATE equipos SET estado='DISPONIBLE' WHERE equipo_id=v_equipo_anterior AND activo=1;
  END IF;

  UPDATE prestamos
  SET cuenta_id=p_cuenta_id,autorizado_por=p_autorizado_por,fecha_compromiso=p_fecha_compromiso,
      fecha_devolucion=CASE
        WHEN p_estado='DEVUELTO' THEN COALESCE(p_fecha_devolucion,NOW())
        WHEN p_estado='CANCELADO' THEN p_fecha_devolucion
        ELSE NULL
      END,
      estado=p_estado,observaciones=NULLIF(TRIM(p_observaciones),'')
  WHERE prestamo_id=p_prestamo_id;

  UPDATE prestamo_detalle
  SET equipo_id=p_equipo_id,condicion_salida=NULLIF(TRIM(p_condicion_salida),''),
      condicion_entrada=NULLIF(TRIM(p_condicion_entrada),'')
  WHERE prestamo_id=p_prestamo_id;

  UPDATE equipos
  SET estado=CASE
    WHEN p_estado='PENDIENTE' THEN 'RESERVADO'
    WHEN p_estado IN ('ENTREGADO','VENCIDO') THEN 'PRESTADO'
    WHEN p_estado IN ('DEVUELTO','CANCELADO') THEN 'DISPONIBLE'
    ELSE estado END
  WHERE equipo_id=p_equipo_id AND activo=1;

  CALL usp_ObtenerPrestamoSeguro(p_prestamo_id,p_cuenta_id,'ADMIN');
END$$

DROP PROCEDURE IF EXISTS usp_PrestamoEliminar$$
CREATE PROCEDURE usp_PrestamoEliminar(IN p_prestamo_id INT, IN p_autorizado_por INT)
BEGIN
  DECLARE v_estado VARCHAR(20) DEFAULT NULL;
  DECLARE v_equipo_id INT DEFAULT NULL;

  SELECT estado INTO v_estado FROM prestamos WHERE prestamo_id=p_prestamo_id LIMIT 1;
  IF v_estado IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Prestamo no encontrado';
  END IF;
  IF v_estado='DEVUELTO' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Un prestamo devuelto se conserva por trazabilidad y no puede cancelarse';
  END IF;

  SELECT equipo_id INTO v_equipo_id FROM prestamo_detalle WHERE prestamo_id=p_prestamo_id ORDER BY detalle_id LIMIT 1;
  UPDATE prestamos SET estado='CANCELADO',autorizado_por=p_autorizado_por WHERE prestamo_id=p_prestamo_id;
  UPDATE equipos SET estado='DISPONIBLE' WHERE equipo_id=v_equipo_id AND activo=1;
  SELECT p_prestamo_id AS prestamo_id,1 AS filas_afectadas,'CANCELACION_LOGICA' AS operacion;
END$$

DELIMITER ;
