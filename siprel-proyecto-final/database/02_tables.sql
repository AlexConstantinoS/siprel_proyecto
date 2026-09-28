-- SIPREL - Esquema final seguro
USE siprel_db;

CREATE TABLE IF NOT EXISTS roles (
    rol_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    activo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cuentas (
    cuenta_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    rol_id INT NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cuentas_roles FOREIGN KEY (rol_id) REFERENCES roles(rol_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categorias_equipo (
    categoria_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(250) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS equipos (
    equipo_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    marca VARCHAR(80) NULL,
    modelo VARCHAR(80) NULL,
    numero_serie VARCHAR(100) NULL,
    categoria_id INT NOT NULL,
    estado ENUM('DISPONIBLE','RESERVADO','PRESTADO','MANTENIMIENTO','BAJA') NOT NULL DEFAULT 'DISPONIBLE',
    ubicacion VARCHAR(120) NULL,
    observaciones VARCHAR(500) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_equipos_categorias FOREIGN KEY (categoria_id) REFERENCES categorias_equipo(categoria_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reservas (
    reserva_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    cuenta_id INT NOT NULL,
    equipo_id INT NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    motivo VARCHAR(300) NULL,
    estado ENUM('PENDIENTE','APROBADA','RECHAZADA','CANCELADA','ATENDIDA') NOT NULL DEFAULT 'PENDIENTE',
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reservas_cuentas FOREIGN KEY (cuenta_id) REFERENCES cuentas(cuenta_id),
    CONSTRAINT fk_reservas_equipos FOREIGN KEY (equipo_id) REFERENCES equipos(equipo_id),
    INDEX ix_reservas_equipo_fechas (equipo_id, fecha_inicio, fecha_fin, estado)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS prestamos (
    prestamo_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    cuenta_id INT NOT NULL,
    autorizado_por INT NULL,
    fecha_prestamo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_compromiso DATETIME NOT NULL,
    fecha_devolucion DATETIME NULL,
    estado ENUM('PENDIENTE','ENTREGADO','DEVUELTO','VENCIDO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
    observaciones VARCHAR(500) NULL,
    CONSTRAINT fk_prestamos_cuenta FOREIGN KEY (cuenta_id) REFERENCES cuentas(cuenta_id),
    CONSTRAINT fk_prestamos_autorizador FOREIGN KEY (autorizado_por) REFERENCES cuentas(cuenta_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS prestamo_detalle (
    detalle_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    prestamo_id INT NOT NULL,
    equipo_id INT NOT NULL,
    condicion_salida VARCHAR(300) NULL,
    condicion_entrada VARCHAR(300) NULL,
    CONSTRAINT uq_prestamo_equipo UNIQUE (prestamo_id, equipo_id),
    CONSTRAINT fk_detalle_prestamo FOREIGN KEY (prestamo_id) REFERENCES prestamos(prestamo_id),
    CONSTRAINT fk_detalle_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(equipo_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS incidencias (
    incidencia_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    cuenta_id INT NOT NULL,
    equipo_id INT NOT NULL,
    tipo ENUM('DANO','FALLA','PERDIDA','OTRO') NOT NULL,
    descripcion TEXT NOT NULL,
    estado ENUM('ABIERTA','EN_REVISION','RESUELTA') NOT NULL DEFAULT 'ABIERTA',
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_incidencias_cuenta FOREIGN KEY (cuenta_id) REFERENCES cuentas(cuenta_id),
    CONSTRAINT fk_incidencias_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(equipo_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS historial_equipo (
    historial_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL,
    cuenta_id INT NULL,
    estado_anterior VARCHAR(30) NULL,
    estado_nuevo VARCHAR(30) NOT NULL,
    detalle VARCHAR(500) NULL,
    fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historial_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(equipo_id),
    CONSTRAINT fk_historial_cuenta FOREIGN KEY (cuenta_id) REFERENCES cuentas(cuenta_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bitacora_seguridad (
    log_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    cuenta_id INT NULL,
    usuario VARCHAR(50) NULL,
    accion VARCHAR(100) NOT NULL,
    detalle VARCHAR(700) NULL,
    ip VARCHAR(50) NULL,
    user_agent VARCHAR(300) NULL,
    fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bitacora_cuenta FOREIGN KEY (cuenta_id) REFERENCES cuentas(cuenta_id),
    INDEX ix_bitacora_fecha (fecha_hora),
    INDEX ix_bitacora_usuario (usuario, fecha_hora)
) ENGINE=InnoDB;
