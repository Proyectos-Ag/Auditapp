const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const createError = require('http-errors');
const dotenv = require('dotenv');

dotenv.config();

// Conectar a MongoDB
require('./config/dbconfig');

// Cron
require('./tarea_config/notificacionIsh');

// Auto-Update
const GitAutoUpdate = require('./util/gitAutoUpdate');

// Rutas
const loginRoutes       = require('./routes/loginRoutes');   
const authRoutes        = require('./routes/authRoutes'); 
const invitacionRoutes  = require('./routes/invitacionRoutes');
const usuariosRouter    = require('./routes/usuarioRoutes');
const datosRoutes       = require('./routes/datosRoutes');
const areasRoutes       = require('./routes/areasRoutes');
const programasRoutes   = require('./routes/programaRoutes');
const ishikawaRoutes    = require('./routes/ishikawaRoutes');
const evaluacionRoutes  = require('./routes/evaluacionRoutes');
const programarRoutes   = require('./routes/programar-audiRoutes');
const objetivosRoutes   = require('./routes/ObjetivosRoutes');
const gestionCambio     = require('./routes/gestionCambioRoutes');
const signatureRoutes   = require('./routes/signatureRoutes');
const validacionRoutes  = require('./routes/validacionRoutes');

const app = express();

// ======================= Vistas =======================
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ======================= CORS + Cookies (antes de rutas) =======================
app.set('trust proxy', 1);
app.use(cookieParser());

const allowlist = new Set([
  'https://auditapp-dqej.onrender.com',
  process.env.FRONTEND_ORIGIN_DEV, 
].filter(Boolean));

const corsOptionsDelegate = (req, cb) => {
  const origin = req.header('Origin');
  const isAllowed = origin && allowlist.has(origin);
  cb(null, {
    origin: isAllowed ? origin : false,
    credentials: false,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
    optionsSuccessStatus: 200,
  });
};

app.use(cors(corsOptionsDelegate));
app.options('*', cors(corsOptionsDelegate));

// ================================ HEALTH CHECK =================================
const mongoose = require('mongoose');
const HEALTH_PATHS = ['/health', '/api/health'];

app.get(HEALTH_PATHS, (req, res) => {
  const mongoState = mongoose?.connection?.readyState;
  const dbUp = mongoState === 1;

  res.set('Cache-Control', 'no-store');
  res.set('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    ok: true,
    service: 'api',
    status: 'up',
    time: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    db: { up: dbUp, state: mongoState }
  });
});

app.head(HEALTH_PATHS, (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.status(200).end();
});

// ======================= Middlewares generales =======================
app.use(logger('dev'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ======================= Rutas PÚBLICAS (antes de jwtAuth) =======================
app.use('/',        loginRoutes);
app.use('/auth',    authRoutes); 
app.use('/invitacion', invitacionRoutes);

// Endpoint raíz
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a la API de Aguida',
    version: '1.1',
    status: 'OK',
    autoUpdate: {
      enabled: process.env.GIT_AUTO_UPDATE === 'true',
      repository: process.env.GIT_REPO_URL || 'No configurado',
      branch: process.env.GIT_BRANCH || 'No configurado'
    }
  });
});

// ======================= Middlewares de AUTH (después de rutas públicas) =======================
const jwtAuth = require('./middlewares/jwtAuth');
app.use(jwtAuth);

// Grants temporales, invitación readonly y bloqueo de escritura
const temporaryGrantAuth = require('./middlewares/temporaryGrantAuth');
app.use(temporaryGrantAuth);

const invitacionAuth = require('./middlewares/invitacionAuth');
app.use(invitacionAuth);

const readonlyBlock = require('./middlewares/readonlyBlock');
app.use(readonlyBlock);

// Cache-Control global
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// ======================= Rutas PROTEGIDAS (después de auth middlewares) =======================
app.use('/usuarios',          usuariosRouter);
app.use('/datos',             datosRoutes);
app.use('/programas',         programasRoutes);
app.use('/areas',             areasRoutes);
app.use('/ishikawa',          ishikawaRoutes);
app.use('/evaluacion',        evaluacionRoutes);
app.use('/programas-anuales', programarRoutes);
app.use('/api/objetivos',     objetivosRoutes);
app.use('/api/gestion-cambio',gestionCambio);
app.use('/api/signatures',    signatureRoutes);
app.use('/api/validaciones',  validacionRoutes);

// ======================= Auto-Update =======================
const autoUpdate = new GitAutoUpdate({
  gitUrl: process.env.GIT_REPO_URL || 'https://github.com/FredWard87/otravez.git',
  branch: process.env.GIT_BRANCH || 'Completo',
  checkInterval: parseInt(process.env.GIT_CHECK_INTERVAL) || 5 * 60 * 1000
});

if (process.env.GIT_AUTO_UPDATE === 'true') {
  autoUpdate.initialize().then(success => {
    if (success) autoUpdate.startAutoUpdate();
    else {
      console.log('⚠️  Sistema de auto-actualización no disponible');
      console.log('💡 Asegúrate de que el proyecto sea un repositorio Git');
    }
  });
}

// ======================= 404 y Handler de errores =======================
app.use((req, res, next) => {
  console.log('Ruta no encontrada:', req.method, req.path);
  next(createError(404));
});

app.use((err, req, res, next) => {
  console.error('Error capturado:');
  console.error('- Status:', err.status || 500);
  console.error('- Message:', err.message);
  console.error('- Path:', req.path);
  console.error('- Method:', req.method);
  if (process.env.NODE_ENV === 'development') console.error('- Stack:', err.stack);

  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);

  if (req.xhr || req.headers.accept?.includes('json')) {
    res.json({
      error: err.message,
      status: err.status || 500,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  } else {
    res.render('error', { message: err.message, error: process.env.NODE_ENV === 'development' ? err : {} });
  }
});

module.exports = app;
