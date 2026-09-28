const pool = require('../config/db');

function firstResultSet(rows) {
  if (!Array.isArray(rows)) return [];
  return Array.isArray(rows[0]) ? rows[0] : rows;
}

async function call(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return firstResultSet(rows);
}

module.exports = {
  authByUsuario: usuario => call('CALL usp_AuthObtenerPorUsuario(?)', [usuario]),
  registrarSolicitante: data => call('CALL usp_RegistroSolicitante(?, ?, ?, ?)', [data.usuario, data.passwordHash, data.nombre, data.email]),

  buscarEquipos: filtro => call('CALL usp_BuscarEquipos(?)', [filtro || null]),
  obtenerEquipo: id => call('CALL usp_ObtenerEquipoPorId(?)', [id]),
  listarCategoriasEquipo: () => call('CALL usp_CategoriasEquipoListar()'),
  listarEquiposGestion: (incluirInactivos, filtro) => call('CALL usp_EquiposListarGestion(?, ?)', [incluirInactivos ? 1 : 0, filtro || null]),
  obtenerEquipoGestion: id => call('CALL usp_EquipoObtenerGestion(?)', [id]),
  crearEquipo: data => call('CALL usp_EquipoCrear(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [data.codigo, data.nombre, data.marca, data.modelo, data.numeroSerie, data.categoriaId, data.estado, data.ubicacion, data.observaciones, data.activo]),
  actualizarEquipo: (id, data) => call('CALL usp_EquipoActualizar(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, data.codigo, data.nombre, data.marca, data.modelo, data.numeroSerie, data.categoriaId, data.estado, data.ubicacion, data.observaciones, data.activo]),
  eliminarEquipo: id => call('CALL usp_EquipoEliminar(?)', [id]),

  obtenerPrestamoSeguro: (id, cuentaId, rol) => call('CALL usp_ObtenerPrestamoSeguro(?, ?, ?)', [id, cuentaId, rol]),
  prestamosPorCuenta: cuentaId => call('CALL usp_ListarPrestamosPorCuenta(?)', [cuentaId]),
  listarPrestamosGestion: () => call('CALL usp_PrestamosListarGestion()'),
  listarCuentasPrestamo: () => call('CALL usp_CuentasPrestamoListar()'),
  crearPrestamo: data => call('CALL usp_PrestamoCrear(?, ?, ?, ?, ?, ?, ?)', [data.cuentaId, data.autorizadoPor, data.fechaCompromiso, data.estado, data.observaciones, data.equipoId, data.condicionSalida]),
  actualizarPrestamo: (id, data) => call('CALL usp_PrestamoActualizar(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, data.cuentaId, data.autorizadoPor, data.fechaCompromiso, data.fechaDevolucion, data.estado, data.observaciones, data.equipoId, data.condicionSalida, data.condicionEntrada]),
  eliminarPrestamo: (id, autorizadoPor) => call('CALL usp_PrestamoEliminar(?, ?)', [id, autorizadoPor]),

  crearReserva: (cuentaId, equipoId, fechaInicio, fechaFin, motivo) =>
    call('CALL usp_CrearReserva(?, ?, ?, ?, ?)', [cuentaId, equipoId, fechaInicio, fechaFin, motivo]),
  reservasPorCuenta: cuentaId => call('CALL usp_ListarReservasPorCuenta(?)', [cuentaId]),
  listarReservasGestion: () => call('CALL usp_ReservasListarGestion()'),
  cambiarEstadoReserva: (reservaId, estado) => call('CALL usp_ReservaCambiarEstado(?, ?)', [reservaId, estado]),
  convertirReservaAPrestamo: (reservaId, autorizadoPor, condicionSalida, observaciones) =>
    call('CALL usp_ReservaConvertirAPrestamo(?, ?, ?, ?)', [reservaId, autorizadoPor, condicionSalida, observaciones]),
  cancelarReserva: (reservaId, cuentaId, rol) => call('CALL usp_CancelarReserva(?, ?, ?)', [reservaId, cuentaId, rol]),

  registrarIncidencia: (cuentaId, equipoId, tipo, descripcion) =>
    call('CALL usp_RegistrarIncidencia(?, ?, ?, ?)', [cuentaId, equipoId, tipo, descripcion]),
  listarIncidenciasSeguras: (cuentaId, rol) => call('CALL usp_ListarIncidenciasSeguras(?, ?)', [cuentaId, rol]),

  listarAuditoria: () => call('CALL usp_AuditoriaListar()'),
  registrarAuditoria: (cuentaId, usuario, accion, detalle, ip, userAgent) =>
    call('CALL usp_AuditoriaRegistrar(?, ?, ?, ?, ?, ?)', [cuentaId, usuario, accion, detalle, ip, userAgent]),

  listarRoles: () => call('CALL usp_RolesListar()'),
  listarUsuarios: incluirInactivos => call('CALL usp_UsuariosListar(?)', [incluirInactivos ? 1 : 0]),
  obtenerUsuario: id => call('CALL usp_UsuarioObtenerPorId(?)', [id]),
  crearUsuario: data => call('CALL usp_UsuarioCrear(?, ?, ?, ?, ?, ?)', [data.usuario, data.passwordHash, data.nombre, data.email, data.rolId, data.activo]),
  actualizarUsuario: (id, data) => call('CALL usp_UsuarioActualizar(?, ?, ?, ?, ?, ?, ?)', [id, data.usuario, data.passwordHash, data.nombre, data.email, data.rolId, data.activo]),
  eliminarUsuario: id => call('CALL usp_UsuarioEliminar(?)', [id])
};
