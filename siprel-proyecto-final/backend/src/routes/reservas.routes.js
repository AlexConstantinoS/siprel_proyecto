const express = require('express');
const repo = require('../repositories/siprel.repository');
const { requireAuth, requireRole } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const { text, positiveInt } = require('../middleware/validate');

const router = express.Router();

router.get('/mias', requireAuth, async (req, res, next) => {
  try { return res.json(await repo.reservasPorCuenta(req.user.cuentaId)); }
  catch (error) { return next(error); }
});

router.get('/gestion', requireAuth, requireRole('ADMIN', 'ENCARGADO'), async (req, res, next) => {
  try { return res.json(await repo.listarReservasGestion()); }
  catch (error) { return next(error); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const equipoId = Number(req.body?.equipoId);
    const fechaInicio = String(req.body?.fechaInicio || '');
    const fechaFin = String(req.body?.fechaFin || '');
    const motivo = text(req.body?.motivo || '', 300);
    if (!positiveInt(equipoId) || !fechaInicio || !fechaFin) return res.status(400).json({ message: 'Equipo y fechas son obligatorios.' });
    if (Number.isNaN(Date.parse(fechaInicio)) || Number.isNaN(Date.parse(fechaFin))) return res.status(400).json({ message: 'Formato de fecha invalido.' });

    const rows = await repo.crearReserva(req.user.cuentaId, equipoId, fechaInicio, fechaFin, motivo || null);
    await audit(req, 'RESERVA_CREADA', `Reserva ${rows[0]?.nueva_reserva_id || ''} para equipo ${equipoId}`);
    return res.status(201).json(rows[0] || {});
  } catch (error) { return next(error); }
});

router.patch('/:id/estado', requireAuth, requireRole('ADMIN', 'ENCARGADO'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const estado = text(req.body?.estado, 20).toUpperCase();
    if (!positiveInt(id) || !['APROBADA', 'RECHAZADA'].includes(estado)) {
      return res.status(400).json({ message: 'Identificador o estado invalido.' });
    }
    const rows = await repo.cambiarEstadoReserva(id, estado);
    await audit(req, `RESERVA_${estado}`, `Reserva #${id} cambiada a ${estado}`);
    return res.json(rows[0] || {});
  } catch (error) { return next(error); }
});

router.post('/:id/convertir-prestamo', requireAuth, requireRole('ADMIN', 'ENCARGADO'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!positiveInt(id)) return res.status(400).json({ message: 'Identificador invalido.' });
    const condicionSalida = text(req.body?.condicionSalida || '', 300);
    const observaciones = text(req.body?.observaciones || '', 500);
    const rows = await repo.convertirReservaAPrestamo(id, req.user.cuentaId, condicionSalida || null, observaciones || null);
    const prestamoId = rows[0]?.prestamo_id;
    await audit(req, 'RESERVA_CONVERTIDA_PRESTAMO', `Reserva #${id} convertida al prestamo #${prestamoId || 'N/D'}`);
    return res.status(201).json(rows[0] || {});
  } catch (error) { return next(error); }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!positiveInt(req.params.id)) return res.status(400).json({ message: 'Identificador invalido' });
    const rows = await repo.cancelarReserva(Number(req.params.id), req.user.cuentaId, req.user.rol);
    if (!rows.length || !rows[0].filas_afectadas) return res.status(404).json({ message: 'Reserva no encontrada o no cancelable' });
    await audit(req, 'RESERVA_CANCELADA', `Reserva ${req.params.id} cancelada`);
    return res.json(rows[0]);
  } catch (error) { return next(error); }
});

module.exports = router;
