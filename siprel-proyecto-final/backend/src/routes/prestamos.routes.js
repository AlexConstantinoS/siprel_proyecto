const express = require('express');
const repo = require('../repositories/siprel.repository');
const { requireAuth, requireRole } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const { text, positiveInt } = require('../middleware/validate');

const router = express.Router();
const ESTADOS = new Set(['PENDIENTE', 'ENTREGADO', 'DEVUELTO', 'VENCIDO', 'CANCELADO']);

function sqlDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function payload(body = {}) {
  return {
    cuentaId: Number(body.cuentaId),
    equipoId: Number(body.equipoId),
    fechaCompromiso: sqlDate(body.fechaCompromiso),
    fechaDevolucion: sqlDate(body.fechaDevolucion),
    estado: text(body.estado, 20).toUpperCase(),
    observaciones: text(body.observaciones, 500),
    condicionSalida: text(body.condicionSalida, 300),
    condicionEntrada: text(body.condicionEntrada, 300)
  };
}

router.get('/mios', requireAuth, async (req, res, next) => {
  try { return res.json(await repo.prestamosPorCuenta(req.user.cuentaId)); }
  catch (error) { return next(error); }
});

router.get('/gestion', requireAuth, requireRole('ADMIN', 'ENCARGADO'), async (req, res, next) => {
  try { return res.json(await repo.listarPrestamosGestion()); }
  catch (error) { return next(error); }
});

router.get('/cuentas', requireAuth, requireRole('ADMIN', 'ENCARGADO'), async (req, res, next) => {
  try { return res.json(await repo.listarCuentasPrestamo()); }
  catch (error) { return next(error); }
});

router.post('/', requireAuth, requireRole('ADMIN', 'ENCARGADO'), async (req, res, next) => {
  try {
    const data = payload(req.body);
    if (!positiveInt(data.cuentaId) || !positiveInt(data.equipoId) || !data.fechaCompromiso || !['PENDIENTE', 'ENTREGADO'].includes(data.estado)) {
      return res.status(400).json({ message: 'Datos de prestamo invalidos.' });
    }
    const rows = await repo.crearPrestamo({ ...data, autorizadoPor: req.user.cuentaId });
    const id = rows[0]?.prestamo_id;
    await audit(req, 'PRESTAMO_CREADO', `Se creo el prestamo #${id || 'N/D'} para la cuenta #${data.cuentaId}`);
    return res.status(201).json(rows[0] || null);
  } catch (error) { return next(error); }
});

router.put('/:id', requireAuth, requireRole('ADMIN', 'ENCARGADO'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!positiveInt(id)) return res.status(400).json({ message: 'Identificador invalido' });
    const existentes = await repo.obtenerPrestamoSeguro(id, req.user.cuentaId, req.user.rol);
    if (!existentes.length) return res.status(404).json({ message: 'Prestamo no encontrado' });
    const data = payload(req.body);
    if (!positiveInt(data.cuentaId) || !positiveInt(data.equipoId) || !data.fechaCompromiso || !ESTADOS.has(data.estado)) {
      return res.status(400).json({ message: 'Datos de prestamo invalidos.' });
    }
    const rows = await repo.actualizarPrestamo(id, { ...data, autorizadoPor: req.user.cuentaId });
    await audit(req, 'PRESTAMO_ACTUALIZADO', `Se actualizo el prestamo #${id} al estado ${data.estado}`);
    return res.json(rows);
  } catch (error) { return next(error); }
});

router.delete('/:id', requireAuth, requireRole('ADMIN', 'ENCARGADO'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!positiveInt(id)) return res.status(400).json({ message: 'Identificador invalido' });
    const existentes = await repo.obtenerPrestamoSeguro(id, req.user.cuentaId, req.user.rol);
    if (!existentes.length) return res.status(404).json({ message: 'Prestamo no encontrado' });
    const rows = await repo.eliminarPrestamo(id, req.user.cuentaId);
    await audit(req, 'PRESTAMO_CANCELADO', `Se cancelo logicamente el prestamo #${id}`);
    return res.json(rows[0] || { prestamo_id: id, operacion: 'CANCELACION_LOGICA' });
  } catch (error) { return next(error); }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!positiveInt(req.params.id)) return res.status(400).json({ message: 'Identificador invalido' });
    const rows = await repo.obtenerPrestamoSeguro(Number(req.params.id), req.user.cuentaId, req.user.rol);
    if (!rows.length) return res.status(404).json({ message: 'Prestamo no encontrado' });
    return res.json(rows);
  } catch (error) { return next(error); }
});

module.exports = router;
