const { rateLimit } = require('express-rate-limit');

function limiter(windowMs, limit, message) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message },
    skip: req => req.path === '/health'
  });
}

const globalLimiter = limiter(15 * 60 * 1000, 300, 'Demasiadas solicitudes. Intenta mas tarde.');
const loginLimiter = limiter(15 * 60 * 1000, 5, 'Demasiados intentos de acceso. Espera 15 minutos.');
const registerLimiter = limiter(60 * 60 * 1000, 5, 'Demasiados registros desde esta direccion. Intenta mas tarde.');
const searchLimiter = limiter(60 * 1000, 100, 'Limite de busquedas alcanzado. Intenta en un minuto.');

module.exports = { globalLimiter, loginLimiter, registerLimiter, searchLimiter };
