const repo = require('../repositories/siprel.repository');

function clientIp(req) {
  return String(req.ip || req.socket?.remoteAddress || '').slice(0, 50);
}

async function audit(req, accion, detalle, identity = null) {
  try {
    const user = identity || req.user || {};
    await repo.registrarAuditoria(
      user.cuentaId || user.cuenta_id || null,
      user.usuario || null,
      String(accion || '').slice(0, 100),
      String(detalle || '').slice(0, 700),
      clientIp(req),
      String(req.get('user-agent') || '').slice(0, 300)
    );
  } catch (error) {
    console.error('No fue posible registrar auditoria:', error.message);
  }
}

module.exports = { audit, clientIp };
