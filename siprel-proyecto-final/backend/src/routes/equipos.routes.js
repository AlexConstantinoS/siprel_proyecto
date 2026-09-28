const express = require('express');
const repo = require('../repositories/siprel.repository');
const { requireAuth, requireRole } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const { searchLimiter } = require('../middleware/rate-limit');
const { text, positiveInt } = require('../middleware/validate');

const router = express.Router();
const ESTADOS = new Set(['DISPONIBLE', 'RESERVADO', 'PRESTADO', 'MANTENIMIENTO', 'BAJA']);

function equipoPayload(body = {}) {
  return {
    codigo: text(body.codigo, 30).toUpperCase(),
    nombre: text(body.nombre, 150),
    marca: text(body.marca, 80),
    modelo: text(body.modelo, 80),
    numeroSerie: text(body.numeroSerie, 100),
    categoriaId: Number(body.categoriaId),
    estado: text(body.estado, 20).toUpperCase(),
    ubicacion: text(body.ubicacion, 120),
    observaciones: text(body.observaciones, 500),
    activo: body.activo === false ? 0 : 1
  };
}

function equipoValido(data) {
  return data.codigo.length >= 2 && data.nombre.length >= 3 && positiveInt(data.categoriaId) && ESTADOS.has(data.estado);
}

router.get('/categorias', requireAuth, async (req, res, next) => {
  try { return res.json(await repo.listarCategoriasEquipo()); }
  catch (error) { return next(error); }
});

router.get('/gestion', requireAuth, requireRole('ADMIN'), searchLimiter, async (req, res, next) => {
  try {
    const filtro = text(req.query.buscar || '', 100);
    const incluirInactivos = String(req.query.incluirInactivos || '') === 'true';
    return res.json(await repo.listarEquiposGestion(incluirInactivos, filtro || null));
  } catch (error) { return next(error); }
});

router.get('/', requireAuth, searchLimiter, async (req, res, next) => {
  try {
    const buscar = text(req.query.buscar || '', 100);
    return res.json(await repo.buscarEquipos(buscar || null));
  } catch (error) { return next(error); }
});

router.post('/', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const data = equipoPayload(req.body);
    if (!equipoValido(data)) return res.status(400).json({ message: 'Datos de equipo invalidos.' });
    const rows = await repo.crearEquipo(data);
    await audit(req, 'EQUIPO_CREADO', `Se creo el equipo ${data.codigo}`);
    return res.status(201).json(rows[0] || null);
  } catch (error) { return next(error); }
});

router.put('/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!positiveInt(id)) return res.status(400).json({ message: 'Identificador invalido' });
    const existentes = await repo.obtenerEquipoGestion(id);
    if (!existentes.length) return res.status(404).json({ message: 'Equipo no encontrado' });
    const data = equipoPayload(req.body);
    if (!equipoValido(data)) return res.status(400).json({ message: 'Datos de equipo invalidos.' });
    const rows = await repo.actualizarEquipo(id, data);
    await audit(req, 'EQUIPO_ACTUALIZADO', `Se actualizo el equipo ${data.codigo} (#${id})`);
    return res.json(rows[0] || null);
  } catch (error) { return next(error); }
});

router.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!positiveInt(id)) return res.status(400).json({ message: 'Identificador invalido' });
    const existentes = await repo.obtenerEquipoGestion(id);
    if (!existentes.length) return res.status(404).json({ message: 'Equipo no encontrado' });
    const rows = await repo.eliminarEquipo(id);
    await audit(req, 'EQUIPO_DESACTIVADO', `Se dio de baja el equipo ${existentes[0].codigo} (#${id})`);
    return res.json(rows[0] || { equipo_id: id, operacion: 'BAJA_LOGICA' });
  } catch (error) { return next(error); }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!positiveInt(req.params.id)) return res.status(400).json({ message: 'Identificador invalido' });
    const rows = await repo.obtenerEquipo(Number(req.params.id));
    if (!rows.length) return res.status(404).json({ message: 'Equipo no encontrado' });
    return res.json(rows[0]);
  } catch (error) { return next(error); }
});

module.exports = router;
