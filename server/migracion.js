const mongoose = require("mongoose");
const Datos = require("./models/datosSchema"); // Asegúrate de importar correctamente el modelo

mongoose.connect("mongodb://localhost:27017/tu_base_de_datos");

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
    mongoose.connection.close();
  } catch (err) {
    console.error("Error durante la migración:", err);
    mongoose.connection.close();
  }
})();
