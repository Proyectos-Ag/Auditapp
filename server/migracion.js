require("dotenv").config(); // Cargar variables de entorno
const mongoose = require("mongoose");
const Datos = require("./models/datosSchema"); // Asegúrate de importar correctamente el modelo

const mongoUrl = process.env.MONGODB_URL; // Obtener URL desde .env

mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Conectado a MongoDB"))
  .catch(err => {
    console.error("Error al conectar a MongoDB:", err);
    process.exit(1);
  });

(async () => {
  try {
    const datos = await Datos.find();
    for (const dato of datos) {
      dato.Programa.forEach(programa => {
        programa.Descripcion.forEach(descripcion => {
          if (typeof descripcion.Hallazgo === "string") {
            descripcion.Hallazgo = [descripcion.Hallazgo]; // Convierte string a array
          }
        });
      });
      await dato.save();
    }
    console.log("Migración completada");
  } catch (err) {
    console.error("Error durante la migración:", err);
  } finally {
    mongoose.connection.close();
  }
})();
