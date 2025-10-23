import api from "../services/api";
import React from 'react';

// Método para eliminar un registro y los Ishikawas asociados
export const eliminarRegistro = async (id) => {
    try {
      const idRep = id;
      let responseIshikawa;
  
      // Intentar eliminar los Ishikawas
      try {
        responseIshikawa = await api.delete(`/ishikawa/eliminar/${idRep}`);
        if (responseIshikawa.status === 404) {
          console.log('No se encontraron Ishikawas para eliminar, procediendo con la eliminación del reporte.');
        } else {
          const dataIshikawa = await responseIshikawa.data;
          console.log('Ishikawas eliminados:', dataIshikawa);
        }
      } catch (ishikawaError) {
        // Si ocurre un error 404, no lanzamos una excepción, solo mostramos el mensaje
        if (ishikawaError.response && ishikawaError.response.status === 404) {
          console.log("No se encontraron Ishikawas para eliminar.");
        } else {
          // Si es otro tipo de error (por ejemplo, 500 o 403), lo lanzamos
          throw ishikawaError;
        }
      }
  
      // Eliminar el reporte
      const responseReporte = await api.delete(`/datos/eliminar/${id}`);
  
      if (responseReporte.status !== 200) {
        console.error('Error al eliminar el reporte:', responseReporte.data);
        throw new Error(responseReporte.data.error || 'Error al eliminar el reporte');
      }
      
      const dataReporte = await responseReporte.data;
      console.log('Reporte eliminado:', dataReporte);
  
      return { success: true, message: 'Reporte e Ishikawas eliminados exitosamente' };
    } catch (error) {
      console.error('Error al conectar con el servidor:', error);
      return { success: false, message: error.message || 'Error al conectar con el servidor' };
    }
  };  

// Componente que puedes usar si necesitas un botón directamente en este archivo
export const BotonEliminar = ({ id, onSuccess, onError }) => {
  const handleEliminar = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este reporte y los Ishikawas asociados?')) {
      const result = await eliminarRegistro(id);
      if (result.success) {
        alert(result.message);
        if (onSuccess) onSuccess(); // Llama a un callback si se proporciona
      } else {
        alert(result.message);
        if (onError) onError(); // Llama a un callback si ocurre un error
      }
    }
  };

  return <button onClick={handleEliminar}>Eliminar Registro</button>;
};