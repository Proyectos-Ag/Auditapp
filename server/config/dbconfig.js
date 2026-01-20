const mongoose = require('mongoose');
const EmpleadoCapacitacionSchema = require('../models/EmpleadoCapacitacionSchema');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;
if (!MONGODB_URI) throw new Error('Falta MONGODB_URI (o MONGODB_URL)');

mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', false);

// Conexión principal (aguida)
let cached = global.mongooseConn || { conn: null, promise: null, seeded: false };
global.mongooseConn = cached;

// Conexiones secundarias
const secondaryConnections = new Map();

async function dbConnect() {
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;
  if (cached.promise) return cached.promise;

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
    cached.promise = null;
    throw err;
  });

  return cached.promise;
}

// Nueva función para conectar a base de datos secundaria
async function connectToDatabase(dbName) {
  // Si es la base de datos principal, usa la conexión normal
  if (dbName === 'aguida') {
    return dbConnect();
  }

  // Si ya existe una conexión cacheada para esta BD, la retornamos
  if (secondaryConnections.has(dbName)) {
    const cachedConn = secondaryConnections.get(dbName);
    if (cachedConn.conn && cachedConn.conn.readyState === 1) {
      return cachedConn.conn;
    }
    if (cachedConn.promise) {
      return cachedConn.promise;
    }
  }

  // Crear nueva conexión para la BD secundaria
  const connectionString = MONGODB_URI.replace(/\/[^/?]+(\?|$)/, `/${dbName}$1`);
  
  const promise = mongoose.createConnection(connectionString, {
    maxPoolSize: 2,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 30000,
    autoIndex: false,
  })
  .asPromise()
  .then((conn) => {
    const cachedConn = secondaryConnections.get(dbName);
    if (cachedConn) {
      cachedConn.conn = conn;
      cachedConn.promise = null;
    }
    console.log(`✅ Conectado a base de datos secundaria: ${dbName}`);
    return conn;
  })
  .catch((err) => {
    secondaryConnections.delete(dbName);
    console.error(`❌ Error conectando a ${dbName}:`, err.message);
    throw err;
  });

  // Cachear la promesa de conexión
  secondaryConnections.set(dbName, {
    conn: null,
    promise: promise
  });

  return promise;
}

// Función para obtener modelo de una BD específica
function getModelForDB(dbName, modelName, schema) {
  return async function() {
    const connection = await connectToDatabase(dbName);
    // Si el modelo ya existe en esta conexión, lo retornamos
    if (connection.models[modelName]) {
      return connection.models[modelName];
    }
    // Si no existe, lo creamos
    return connection.model(modelName, schema);
  };
}

// Cerrar conexiones secundarias (opcional, para cleanup)
function closeSecondaryConnection(dbName) {
  if (secondaryConnections.has(dbName)) {
    const cachedConn = secondaryConnections.get(dbName);
    if (cachedConn.conn) {
      cachedConn.conn.close();
    }
    secondaryConnections.delete(dbName);
    console.log(`🔌 Conexión cerrada: ${dbName}`);
  }
}

// 🔥 NUEVAS FUNCIONES PARA BDCAPACITACION
async function getEmpleadoCapacitacionByNombre(nombre) {
  try {
    const connection = await connectToDatabase('BDCAPACITACION');
    const EmpleadoCapacitacion = connection.model('Empleado', EmpleadoCapacitacionSchema);
    
    const empleado = await EmpleadoCapacitacion.findOne({ 
      nombre: new RegExp(nombre, 'i') 
    }).lean();
    
    return empleado;
  } catch (error) {
    console.error('Error obteniendo empleado de capacitación:', error);
    return null;
  }
}

// Función para mapear cursos de capacitación al formato de evaluación
function mapearCursosCapacitacion(cursosCapacitacion) {
  const cursosEvaluacion = {
    'Auditor interno en el SGI': { calificacion: '', aprobado: false },
    'BPM´s': { calificacion: '', aprobado: false },
    'HACCP': { calificacion: '', aprobado: false },
    'PPR´s': { calificacion: '', aprobado: false },
    'Microbiología básica': { calificacion: '', aprobado: false },
  };

  // Mapeo de nombres de cursos entre los dos sistemas
  const mapeoCursos = {
    'induccion': 'BPM´s',
    'documentos': 'PPR´s',
    'limpieza y sanidad (aib)': 'BPM´s',
    'poes': 'PPR´s',
    'ppr´s': 'PPR´s',
    'haccp aib ano': 'HACCP',
    'haccp ruben y/o unilever': 'HACCP',
    'alergenos': 'HACCP',
    'defensa alimentaria': 'HACCP',
    'control de plagas aib': 'BPM´s',
    'prevencion de accidentes': 'Auditor interno en el SGI',
    'epp': 'Auditor interno en el SGI',
    'codigo etica': 'Auditor interno en el SGI',
    'control doctos qis consul': 'Auditor interno en el SGI',
    'microbiología': 'Microbiología básica',
    'microbiologia': 'Microbiología básica'
  };

  if (cursosCapacitacion && Array.isArray(cursosCapacitacion)) {
    cursosCapacitacion.forEach(curso => {
      if (curso && curso.name) {
        const cursoMapeado = mapeoCursos[curso.name.toLowerCase()];
        if (cursoMapeado && cursosEvaluacion[cursoMapeado]) {
          if (curso.status === 'completado') {
            cursosEvaluacion[cursoMapeado] = {
              calificacion: '100',
              aprobado: true
            };
          }
        }
      }
    });
  }

  return cursosEvaluacion;
}

// Semilla opcional (solo para BD principal)
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
      Contraseña: pwd,
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

module.exports = { 
  dbConnect, 
  ensureRootUser, 
  mongoose,
  connectToDatabase,
  getModelForDB,
  closeSecondaryConnection,
  getEmpleadoCapacitacionByNombre,
  mapearCursosCapacitacion
};