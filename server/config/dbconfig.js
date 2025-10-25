// config/dbconfig.js  (CommonJS)
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;
if (!MONGODB_URI) throw new Error('Falta MONGODB_URI (o MONGODB_URL)');

mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', false);

let cached = global.mongooseConn || { conn: null, promise: null, seeded: false };
global.mongooseConn = cached;

async function dbConnect() {
  // Conexión viva
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;
  // Conectando
  if (cached.promise) return cached.promise;

  // Nueva conexión (pool pequeño para serverless)
  cached.promise = mongoose.connect(MONGODB_URI, {
    maxPoolSize: 3,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 20000,
    connectTimeoutMS: 20000,
    socketTimeoutMS: 45000,
    autoIndex: false,
    family: 4,
    retryWrites: true,
    w: 'majority',
  })
  .then((m) => {
    cached.conn = m;
    return m;
  })
  .catch((err) => {
    cached.promise = null; // ¡clave! no dejar promesa rota cacheada
    throw err;
  });

  return cached.promise;
}

// Semilla opcional, controlada por env y ejecutada una sola vez por proceso
async function ensureRootUser(Usuarios) {
  if (cached.seeded) return;
  if (!process.env.SEED_ROOT_ON_START) return;

  await dbConnect();

  const correo = process.env.ROOT_EMAIL || 'rubentest@gmail.com';
  const existe = await Usuarios.findOne({ Correo: correo }).lean();
  if (!existe) {
    const pwd = process.env.ROOT_PASSWORD || 'root321';
    await Usuarios.create({
      Nombre: process.env.ROOT_NAME || 'Rubén Cruces Paz',
      FechaIngreso: new Date(),
      Correo: correo,
      Contraseña: pwd, // ⚠️ en producción, hashea (bcrypt)
      Puesto: 'Global',
      Departamento: 'Calidad',
      Escolaridad: 'Ingenieria en Alimentos',
      TipoUsuario: 'administrador',
      area: 'Global'
    });
    console.log('[seed] Usuario root creado');
  } else {
    console.log('[seed] Usuario root ya existe');
  }
  cached.seeded = true;
}

module.exports = { dbConnect, ensureRootUser, mongoose };