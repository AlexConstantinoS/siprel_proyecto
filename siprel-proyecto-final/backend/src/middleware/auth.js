const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/security');
const { audit } = require('./audit');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Autenticacion requerida' });
  }

  try {
    req.user = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    return next();
  } catch (error) {
    void audit(req, 'TOKEN_INVALIDO', 'Se rechazo una solicitud con token invalido o expirado');
    return res.status(401).json({ message: 'Sesion invalida o expirada' });
  }
}

function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.rol)) {
      await audit(req, 'ACCESO_DENEGADO', `Intento de acceso a ${req.method} ${req.originalUrl}`);
      return res.status(403).json({ message: 'No tienes permisos para realizar esta operacion' });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
