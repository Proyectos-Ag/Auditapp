const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const createError = require('http-errors');
const dotenv = require('dotenv');

// Cargar variables de entorno PRIMERO
dotenv.config();

// Conectar a MongoDB
const mongo = require('./config/dbconfig');

// Archivo que usa cron
require('./tarea_config/notificacionIsh');

// Sistema de auto-actualización Git
const GitAutoUpdate = require('./util/gitAutoUpdate');

// Rutas
const usuariosRouter = require('./routes/usuarioRoutes');
const loginRoutes = require('./routes/loginRoutes');
const datosRoutes = require('./routes/datosRoutes');
const areasRoutes = require('./routes/areasRoutes');
const programasRoutes = require('./routes/programaRoutes');
const authRoutes = require('./routes/authRoutes');
const ishikawa = require('./routes/ishikawaRoutes');
const evaluacionRoutes = require('./routes/evaluacionRoutes');
const programarRoutes = require('./routes/programar-audiRoutes');
const objetivosRoutes = require("./routes/ObjetivosRoutes");
const gestionCambio = require("./routes/gestionCambioRoutes");
const signatureRoutes = require('./routes/signatureRoutes');
const validacionRoutes = require('./routes/validacionRoutes');

const app = express();

// ======================= Vistas =======================
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ======================= CORS (DEBE IR ANTES DE RUTAS) =======================
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
    credentials: true,
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

// HEAD aún más barato (sin cuerpo)
app.head(HEALTH_PATHS, (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.status(200).end();
});

//====================================================================================

// ======================= Middlewares generales =======================
app.use(logger('dev'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ======================= Auth middlewares =======================
const jwtAuth = require('./middlewares/jwtAuth');
app.use(jwtAuth);

const temporaryGrantAuth = require('./middlewares/temporaryGrantAuth');
app.use(temporaryGrantAuth);

// Acepta tokens de invitación (readonly)
const invitacionAuth = require('./middlewares/invitacionAuth');
app.use(invitacionAuth);

// Bloquear métodos no-GET para usuarios readonly
const readonlyBlock = require('./middlewares/readonlyBlock');
app.use(readonlyBlock);

// Cache-Control global
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// ======================= Raíz =======================
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

// ======================= Rutas =======================
app.use('/usuarios', usuariosRouter);
app.use('/', loginRoutes);
app.use('/datos', datosRoutes);
app.use('/programas', programasRoutes);
app.use('/areas', areasRoutes);
app.use('/auth', authRoutes);
const invitacionRoutes = require('./routes/invitacionRoutes');
app.use('/invitacion', invitacionRoutes);
app.use('/ishikawa', ishikawa);
app.use('/evaluacion', evaluacionRoutes);
app.use('/programas-anuales', programarRoutes);
app.use('/api/objetivos', objetivosRoutes);
app.use('/api/gestion-cambio', gestionCambio);
app.use('/api/signatures', signatureRoutes);
app.use('/api/validaciones', validacionRoutes);

// ========================================
// Sistema de Auto-actualización Git
// ========================================
const autoUpdate = new GitAutoUpdate({
  gitUrl: process.env.GIT_REPO_URL || 'https://github.com/FredWard87/otravez.git',
  branch: process.env.GIT_BRANCH || 'Completo',
  checkInterval: parseInt(process.env.GIT_CHECK_INTERVAL) || 5 * 60 * 1000 // 5 minutos
});

if (process.env.GIT_AUTO_UPDATE === 'true') {
  autoUpdate.initialize().then(success => {
    if (success) {
      autoUpdate.startAutoUpdate();
    } else {
      console.log('⚠️  Sistema de auto-actualización no disponible');
      console.log('💡 Asegúrate de que el proyecto sea un repositorio Git');
    }
  });
}

// ======================= Endpoints de actualización =======================
app.get('/api/update-status', (req, res) => {
  if (req.user?.TipoUsuario !== 'administrador') {
    return res.status(403).json({ error: 'No autorizado' });
  }

  res.json({
    enabled: process.env.GIT_AUTO_UPDATE === 'true',
    repository: process.env.GIT_REPO_URL || 'No configurado',
    branch: process.env.GIT_BRANCH || 'No configurado',
    checkInterval: parseInt(process.env.GIT_CHECK_INTERVAL) || 300000,
    isUpdating: autoUpdate.isUpdating
  });
});

app.post('/api/force-update', async (req, res) => {
  if (req.user?.TipoUsuario !== 'administrador') {
    return res.status(403).json({ error: 'No autorizado' });
  }

  if (process.env.GIT_AUTO_UPDATE !== 'true') {
    return res.status(400).json({
      error: 'Auto-actualización deshabilitada',
      message: 'Habilita GIT_AUTO_UPDATE=true en .env'
    });
  }

  try {
    const success = await autoUpdate.forceUpdate();
    res.json({
      success,
      message: success ? 'Actualización iniciada. El servidor se reiniciará.' : 'Error al actualizar'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al forzar actualización',
      message: error.message
    });
  }
});

app.get('/api/check-updates', async (req, res) => {
  if (req.user?.TipoUsuario !== 'administrador') {
    return res.status(403).json({ error: 'No autorizado' });
  }

  if (process.env.GIT_AUTO_UPDATE !== 'true') {
    return res.status(400).json({
      error: 'Auto-actualización deshabilitada'
    });
  }

  try {
    const hasUpdates = await autoUpdate.hasUpdates();
    const currentCommit = await autoUpdate.getCurrentCommit();
    const latestCommit = await autoUpdate.fetchLatestCommit();

    res.json({
      hasUpdates,
      currentCommit: currentCommit || 'Desconocido',
      latestCommit: latestCommit || 'Desconocido',
      upToDate: !hasUpdates
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al verificar actualizaciones',
      message: error.message
    });
  }
});

// ======================= 404 y Handler de errores =======================
app.use(function(req, res, next) {
  console.log('Ruta no encontrada:', req.method, req.path);
  next(createError(404));
});

app.use(function(err, req, res, next) {
  console.error('Error capturado:');
  console.error('- Status:', err.status || 500);
  console.error('- Message:', err.message);
  console.error('- Path:', req.path);
  console.error('- Method:', req.method);
  if (process.env.NODE_ENV === 'development') {
    console.error('- Stack:', err.stack);
  }

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
    res.render('error', {
      message: err.message,
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
});

module.exports = app;
