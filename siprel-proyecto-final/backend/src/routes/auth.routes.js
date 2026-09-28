const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const repo = require('../repositories/siprel.repository');
const { jwtSecret, jwtExpiresIn, bcryptRounds } = require('../config/security');
const { audit } = require('../middleware/audit');
const { loginLimiter, registerLimiter } = require('../middleware/rate-limit');
const { text, validUser, validEmail, validPassword } = require('../middleware/validate');

const router = express.Router();
const DUMMY_HASH = '$2b$12$QWwiWVbRGWqiBeV.gCJgJekuDajm.xyGbxAzxKMuGVP8CRC2zAZJC';

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const usuario = text(req.body?.usuario, 30);
    const password = String(req.body?.password || '');

    if (!validUser(usuario) || !password) {
      await audit(req, 'LOGIN_FALLIDO', 'Intento de acceso con credenciales invalidas', { usuario });
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const rows = await repo.authByUsuario(usuario);
    const account = rows[0];
    const validHash = await bcrypt.compare(password, account?.password_hash || DUMMY_HASH);

    if (!account || !validHash) {
      await audit(req, 'LOGIN_FALLIDO', 'Credenciales incorrectas', { usuario });
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { cuentaId: account.cuenta_id, usuario: account.usuario, rol: account.rol },
      jwtSecret,
      { algorithm: 'HS256', expiresIn: jwtExpiresIn }
    );

    const usuarioPublico = {
      cuenta_id: account.cuenta_id,
      usuario: account.usuario,
      nombre: account.nombre,
      email: account.email,
      rol: account.rol
    };

    await audit(req, 'LOGIN_OK', 'Inicio de sesion exitoso', usuarioPublico);
    return res.json({ token, expiresIn: jwtExpiresIn, usuario: usuarioPublico });
  } catch (error) {
    return next(error);
  }
});

router.post('/registro', registerLimiter, async (req, res, next) => {
  try {
    const usuario = text(req.body?.usuario, 30);
    const password = String(req.body?.password || '');
    const nombre = text(req.body?.nombre, 120);
    const email = text(req.body?.email, 150).toLowerCase();

    if (!validUser(usuario)) return res.status(400).json({ message: 'Usuario invalido. Usa 4-30 caracteres: letras, numeros, punto, guion o guion bajo.' });
    if (!validPassword(password)) return res.status(400).json({ message: 'La contrasena debe tener 10-72 caracteres e incluir mayuscula, minuscula, numero y simbolo.' });
    if (nombre.length < 3) return res.status(400).json({ message: 'Nombre invalido.' });
    if (!validEmail(email)) return res.status(400).json({ message: 'Correo electronico invalido.' });

    const passwordHash = await bcrypt.hash(password, bcryptRounds);
    const rows = await repo.registrarSolicitante({ usuario, passwordHash, nombre, email });
    await audit(req, 'REGISTRO_USUARIO', `Registro publico de ${usuario}`, { cuenta_id: rows[0]?.cuenta_id, usuario });
    return res.status(201).json({ message: 'Cuenta registrada correctamente. Ya puedes iniciar sesion.' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
