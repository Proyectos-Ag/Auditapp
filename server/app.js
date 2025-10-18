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

// Configuración de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configuración CORS (DEBE IR PRIMERO)
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://localhost:3000',
    'http://192.168.100.30:3000',
    'https://192.168.100.30:3000',
    'https://auditapp-dqej.onrender.com',
    'http://192.168.1.71:3000',
    'https://192.168.0.75:3000',
    'https://192.168.100.30:3443'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware en el orden correcto
app.use(logger('dev'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware JWT: extrae cookie token y puebla req.user si existe
const jwtAuth = require('./middlewares/jwtAuth');
app.use(jwtAuth);

// Middleware to augment authenticated users with temporary grants (if any)
const temporaryGrantAuth = require('./middlewares/temporaryGrantAuth');
app.use(temporaryGrantAuth);

// Middleware para aceptar tokens de invitación (establece req.user con permisos readonly)
const invitacionAuth = require('./middlewares/invitacionAuth');
app.use(invitacionAuth);

// Bloquear métodos no-GET para usuarios readonly
const readonlyBlock = require('./middlewares/readonlyBlock');
app.use(readonlyBlock);

// Cache control
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Manejar la ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenido a la API de Aguida',
    version: '1.1',
    status: 'OK'
  });
});

// Configuración de rutas
app.use('/usuarios', usuariosRouter);
app.use('/', loginRoutes); 
app.use('/datos', datosRoutes);
app.use('/programas', programasRoutes);
app.use('/areas', areasRoutes);
app.use('/auth', authRoutes);
// Rutas de invitación
const invitacionRoutes = require('./routes/invitacionRoutes');
app.use('/invitacion', invitacionRoutes);
app.use('/ishikawa', ishikawa);
app.use('/evaluacion', evaluacionRoutes);
app.use('/programas-anuales', programarRoutes);
app.use('/api/objetivos', objetivosRoutes);
app.use('/api/gestion-cambio', gestionCambio);
app.use('/api/signatures', signatureRoutes);
app.use('/api/validaciones', validacionRoutes);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log('Ruta no encontrada:', req.method, req.path);
  next(createError(404));
});

// Error handler (UN SOLO MANEJADOR)
app.use(function(err, req, res, next) {
  // Log del error
  console.error('Error capturado:');
  console.error('- Status:', err.status || 500);
  console.error('- Message:', err.message);
  console.error('- Path:', req.path);
  console.error('- Method:', req.method);
  
  if (process.env.NODE_ENV === 'development') {
    console.error('- Stack:', err.stack);
  }
  
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Responder según el tipo de solicitud
  res.status(err.status || 500);
  
  // Si es una solicitud de API (JSON), responder con JSON
  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    res.json({
      error: err.message,
      status: err.status || 500,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  } else {
    // Si es una solicitud de navegador, renderizar la página de error
    res.render('error', {
      message: err.message,
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
});

module.exports = app;