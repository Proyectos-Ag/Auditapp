// migrateToYear.js
// Ejecutar con: node migrateToYear.js

const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect('mongodb://aguidamaster:aguida123master@38.65.138.238:28936/aguida?authSource=admin')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error de conexión:', err));

async function migrarObjetivos() {
  try {
    console.log('🚀 Iniciando migración...');
    
    // Acceder directamente a la colección
    const db = mongoose.connection.db;
    const ObjetivoCollection = db.collection('objetivos');
    
    // Obtener todos los documentos
    const objetivos = await ObjetivoCollection.find({}).toArray();
    
    console.log(`📊 Encontrados ${objetivos.length} objetivos`);
    
    let migrados = 0;
    let yaActualizados = 0;
    let conDatos = 0;
    let sinDatos = 0;
    
    for (const objetivo of objetivos) {
      // Verificar si el campo añoActual existe REALMENTE en el documento
      if (objetivo.añoActual !== undefined && objetivo.añoActual !== null) {
        yaActualizados++;
        console.log(`✓ Objetivo ${objetivo._id} ya tiene año: ${objetivo.añoActual}`);
        continue;
      }
      
      console.log(`\n🔄 Procesando objetivo ${objetivo._id}...`);
      
      // Verificar si tiene datos
      const tieneDatos = verificarSiTieneDatos(objetivo);
      
      const updateData = {
        añoActual: 2026
      };
      
      if (tieneDatos) {
        conDatos++;
        console.log(`📦 Tiene datos del 2025 - Archivando...`);
        
        // Crear entrada de historial
        const historialEntry = {
          año: 2025,
          indicadores: {
            indicadorENEABR: objetivo.indicadorENEABR || { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorFEB: objetivo.indicadorFEB || { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorMAR: objetivo.indicadorMAR || { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorABR: objetivo.indicadorABR || { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorMAYOAGO: objetivo.indicadorMAYOAGO || { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorJUN: objetivo.indicadorJUN || { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorJUL: objetivo.indicadorJUL || { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorAGO: objetivo.indicadorAGO || { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorSEPDIC: objetivo.indicadorSEPDIC || { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorOCT: objetivo.indicadorOCT || { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorNOV: objetivo.indicadorNOV || { S1: "", S2: "", S3: "", S4: "", S5: "" },
            indicadorDIC: objetivo.indicadorDIC || { S1: "", S2: "", S3: "", S4: "", S5: "" }
          }
        };
        
        // Preparar historial
        const historialExistente = objetivo.historialAnual || [];
        historialExistente.push(historialEntry);
        updateData.historialAnual = historialExistente;
        
        // Resetear indicadores
        const indicadorVacio = { S1: "", S2: "", S3: "", S4: "", S5: "" };
        updateData.indicadorENEABR = indicadorVacio;
        updateData.indicadorFEB = indicadorVacio;
        updateData.indicadorMAR = indicadorVacio;
        updateData.indicadorABR = indicadorVacio;
        updateData.indicadorMAYOAGO = indicadorVacio;
        updateData.indicadorJUN = indicadorVacio;
        updateData.indicadorJUL = indicadorVacio;
        updateData.indicadorAGO = indicadorVacio;
        updateData.indicadorSEPDIC = indicadorVacio;
        updateData.indicadorOCT = indicadorVacio;
        updateData.indicadorNOV = indicadorVacio;
        updateData.indicadorDIC = indicadorVacio;
        
        console.log(`🔄 Reseteando indicadores para 2026`);
      } else {
        sinDatos++;
        console.log(`➕ Sin datos previos - Solo agregando año 2026`);
        // Inicializar historialAnual como array vacío si no existe
        if (!objetivo.historialAnual) {
          updateData.historialAnual = [];
        }
      }
      
      // Actualizar en la base de datos
      const result = await ObjetivoCollection.updateOne(
        { _id: objetivo._id },
        { $set: updateData }
      );
      
      if (result.modifiedCount > 0) {
        migrados++;
        console.log(`✅ Objetivo ${objetivo._id} migrado correctamente`);
      } else {
        console.log(`⚠️ No se pudo actualizar el objetivo ${objetivo._id}`);
      }
    }
    
    console.log('\n🎉 ¡Migración completada!');
    console.log(`   📊 Total de objetivos: ${objetivos.length}`);
    console.log(`   ✅ Migrados: ${migrados}`);
    console.log(`   ✓ Ya actualizados: ${yaActualizados}`);
    console.log(`   📦 Con datos del 2025: ${conDatos}`);
    console.log(`   📄 Sin datos: ${sinDatos}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Función para verificar si tiene datos
function verificarSiTieneDatos(objetivo) {
  const campos = [
    'indicadorENEABR', 'indicadorFEB', 'indicadorMAR', 'indicadorABR',
    'indicadorMAYOAGO', 'indicadorJUN', 'indicadorJUL', 'indicadorAGO',
    'indicadorSEPDIC', 'indicadorOCT', 'indicadorNOV', 'indicadorDIC'
  ];
  
  for (const campo of campos) {
    if (objetivo[campo]) {
      const semanas = ['S1', 'S2', 'S3', 'S4', 'S5'];
      for (const semana of semanas) {
        const valor = objetivo[campo][semana];
        if (valor !== undefined && valor !== null && valor !== "") {
          return true; // Tiene al menos un dato
        }
      }
    }
  }
  
  return false; // No tiene datos
}

// Esperar a que la conexión esté lista antes de ejecutar
mongoose.connection.once('open', () => {
  migrarObjetivos();
});