require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { corsOrigins } = require('./config/security');
const { globalLimiter } = require('./middleware/rate-limit');

const authRoutes = require('./routes/auth.routes');
const equiposRoutes = require('./routes/equipos.routes');
const prestamosRoutes = require('./routes/prestamos.routes');
const reservasRoutes = require('./routes/reservas.routes');
const incidenciasRoutes = require('./routes/incidencias.routes');
const auditoriaRoutes = require('./routes/auditoria.routes');
const usuariosRoutes = require('./routes/usuarios.routes');

const app = express();
const port = Number(process.env.PORT || 3000);

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origen CORS no permitido'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 600
}));
app.use(express.json({ limit: '256kb', strict: true }));
app.use(globalLimiter);

app.get('/api/v1/health', (req, res) => res.json({ status: 'ok', version: '1.0', security: 'final' }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/equipos', equiposRoutes);
app.use('/api/v1/prestamos', prestamosRoutes);
app.use('/api/v1/reservas', reservasRoutes);
app.use('/api/v1/incidencias', incidenciasRoutes);
app.use('/api/v1/admin/auditoria', auditoriaRoutes);
app.use('/api/v1/admin/usuarios', usuariosRoutes);

app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

app.use((error, req, res, next) => {
  console.error({ message: error.message, code: error.code, stack: error.stack });

  if (error.message === 'Origen CORS no permitido') {
    return res.status(403).json({ message: 'Origen no permitido' });
  }
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Ya existe un registro con el mismo usuario, correo, codigo u otro valor unico.' });
  }
  if (error.sqlState === '45000') {
    return res.status(400).json({ message: String(error.sqlMessage || 'Operacion no valida').slice(0, 180) });
  }
  return res.status(500).json({ message: 'Ocurrio un error interno. Si persiste, contacta al administrador.' });
});

app.listen(port, '0.0.0.0', () => console.log(`SIPREL API segura escuchando en puerto ${port}`));
