const express = require('express');
const bcrypt = require('bcryptjs');
const repo = require('../repositories/siprel.repository');
const { requireAuth, requireRole } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const { bcryptRounds } = require('../config/security');
const { text, validUser, validEmail, validPassword, positiveInt } = require('../middleware/validate');

const router = express.Router();
router.use(requireAuth, requireRole('ADMIN'));

router.get('/roles', async (req, res, next) => {
  try { return res.json(await repo.listarRoles()); }
  catch (error) { return next(error); }
});

router.get('/', async (req, res, next) => {
  try { return res.json(await repo.listarUsuarios(String(req.query.incluirInactivos || '') === 'true')); }
  catch (error) { return next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!positiveInt(req.params.id)) return res.status(400).json({ message: 'Identificador invalido' });
    const rows = await repo.obtenerUsuario(Number(req.params.id));
    if (!rows.length) return res.status(404).json({ message: 'Usuario no encontrado' });
    return res.json(rows[0]);
  } catch (error) { return next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const usuario = text(req.body?.usuario, 30);
    const password = String(req.body?.password || '');
    const nombre = text(req.body?.nombre, 120);
    const email = text(req.body?.email, 150).toLowerCase();
    const rolId = Number(req.body?.rolId);
    const activo = req.body?.activo === false ? 0 : 1;

    if (!validUser(usuario) || !validPassword(password) || nombre.length < 3 || !validEmail(email) || !positiveInt(rolId)) {
      return res.status(400).json({ message: 'Datos de usuario invalidos. Verifica usuario, contrasena, nombre, correo y rol.' });
    }

    const passwordHash = await bcrypt.hash(password, bcryptRounds);
    const rows = await repo.crearUsuario({ usuario, passwordHash, nombre, email, rolId, activo });
    await audit(req, 'USUARIO_CREADO', `Se creo la cuenta ${usuario}`);
    return res.status(201).json(rows[0] || null);
  } catch (error) { return next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!positiveInt(id)) return res.status(400).json({ message: 'Identificador invalido' });

    const usuario = text(req.body?.usuario, 30);
    const password = String(req.body?.password || '');
    const nombre = text(req.body?.nombre, 120);
    const email = text(req.body?.email, 150).toLowerCase();
    const rolId = Number(req.body?.rolId);
    const activo = req.body?.activo === false ? 0 : 1;

    if (!validUser(usuario) || nombre.length < 3 || !validEmail(email) || !positiveInt(rolId)) {
      return res.status(400).json({ message: 'Datos de usuario invalidos.' });
    }
    if (password && !validPassword(password)) {
      return res.status(400).json({ message: 'La nueva contrasena no cumple la politica de seguridad.' });
    }
    if (id === req.user.cuentaId && !activo) {
      return res.status(400).json({ message: 'No puedes desactivar tu propia cuenta.' });
    }

    const existentes = await repo.obtenerUsuario(id);
    if (!existentes.length) return res.status(404).json({ message: 'Usuario no encontrado' });

    const passwordHash = password ? await bcrypt.hash(password, bcryptRounds) : null;
    const rows = await repo.actualizarUsuario(id, { usuario, passwordHash, nombre, email, rolId, activo });
    await audit(req, 'USUARIO_ACTUALIZADO', `Se actualizo la cuenta ${usuario} (#${id})`);
    return res.json(rows[0] || null);
  } catch (error) { return next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!positiveInt(id)) return res.status(400).json({ message: 'Identificador invalido' });
    if (id === req.user.cuentaId) return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta.' });
    const existentes = await repo.obtenerUsuario(id);
    if (!existentes.length) return res.status(404).json({ message: 'Usuario no encontrado' });
    const rows = await repo.eliminarUsuario(id);
    await audit(req, 'USUARIO_DESACTIVADO', `Se dio de baja la cuenta ${existentes[0].usuario} (#${id})`);
    return res.json(rows[0] || { cuenta_id: id, operacion: 'BAJA_LOGICA' });
  } catch (error) { return next(error); }
});

module.exports = router;
