const express = require('express');
const repo = require('../repositories/siprel.repository');
const { requireAuth } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const { text, positiveInt } = require('../middleware/validate');

const router = express.Router();
const TIPOS = new Set(['DANO', 'FALLA', 'PERDIDA', 'OTRO']);

router.get('/', requireAuth, async (req, res, next) => {
  try { return res.json(await repo.listarIncidenciasSeguras(req.user.cuentaId, req.user.rol)); }
  catch (error) { return next(error); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const equipoId = Number(req.body?.equipoId);
    const tipo = text(req.body?.tipo, 20).toUpperCase();
    const descripcion = text(req.body?.descripcion, 1000);
    if (!positiveInt(equipoId) || !TIPOS.has(tipo) || descripcion.length < 5) {
      return res.status(400).json({ message: 'Datos de incidencia invalidos.' });
    }
    const rows = await repo.registrarIncidencia(req.user.cuentaId, equipoId, tipo, descripcion);
    await audit(req, 'INCIDENCIA_CREADA', `Incidencia ${rows[0]?.nueva_incidencia_id || ''} sobre equipo ${equipoId}`);
    return res.status(201).json(rows[0] || {});
  } catch (error) { return next(error); }
});

module.exports = router;
