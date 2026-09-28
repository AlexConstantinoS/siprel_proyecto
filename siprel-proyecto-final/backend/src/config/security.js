function envList(name, fallback = '') {
  return String(process.env[name] || fallback)
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
}

const jwtSecret = process.env.JWT_SECRET || '';
if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres. Revisa el archivo .env.');
}

module.exports = {
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  corsOrigins: envList('CORS_ORIGINS', 'https://localhost:8443'),
  bcryptRounds: Math.max(10, Number(process.env.BCRYPT_ROUNDS || 12))
};
