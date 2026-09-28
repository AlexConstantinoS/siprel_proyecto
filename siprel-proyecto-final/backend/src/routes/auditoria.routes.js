const express = require('express');
const repo = require('../repositories/siprel.repository');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.get('/', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try { return res.json(await repo.listarAuditoria()); }
  catch (error) { return next(error); }
});
module.exports = router;
