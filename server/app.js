const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const createError = require('http-errors');
const dotenv = require('dotenv');

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

dotenv.config();

const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());


const mongo = require('./config/dbconfig');

const corsOptions = {
  origin: ['http://localhost:3000', 'https://auditapp-dqej.onrender.com', 'https://otravez-1.onrender.com/'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Configura las rutas
app.use('/usuarios', usuariosRouter);
app.use('/', loginRoutes); 
app.use('/datos', datosRoutes);
app.use('/programas', programasRoutes);
app.use('/areas', areasRoutes);
app.use('/auth', authRoutes);
app.use('/ishikawa', ishikawa);
app.use('/evaluacion', evaluacionRoutes);
app.use('/programas-anuales', programarRoutes);
app.use('/api/objetivos', objetivosRoutes);

// Manejar la ruta raíz
app.get('/', (req, res) => {
  res.send('Bienvenido a la API de Aguida');
});

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Error handler
app.use(function(err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;