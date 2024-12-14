import React from 'react';
import './css/datosv.css'; // Archivo CSS importado para los estilos

const DatosV = () => {
  return (
    <div className="modal-body">

    <h1>Versión 2.1.2</h1>

    <ul>
      <h3 className="modal-title">Historial</h3>
      <li>Se agregó un historial en el apartado de generar auditoría que contiene la información del auditor, la fecha en que se realizó y el programa realizado.</li>
    </ul>

    <ul>
      <h3 className="modal-title">Solución de errores</h3>
      <li>Se solucionó el error al momento de finalizar el diagrama.</li>
      <li>Se solucionaron errores al generar auditorías.</li>
    </ul>

    <ul>
      <h3 className="modal-title">Nuevos estilos</h3>
      <li>Se modificaron estilos en general en la aplicación.</li>
    </ul>

    <ul>
      <h3 className="modal-title">Aviso de proceso</h3>
      <li>Se agregó un aviso en los Ishikawas asignados para dar a conocer que el diagrama está en proceso.</li>
    </ul>

    <h1>Versión 2.1.1 (Beta)</h1>
        
        <ul>
          <h3 className="modal-title">Carga de archivos</h3>
          <li>Se implementó la carga de archivos para la tabla de efectividad en la revisión de Ishikawas.</li>
        </ul>
    
        <ul>
          <h3 className="modal-title">Optimización de código</h3>
          <li>Se ha realizado una optimización general del código para consultas más rápidas y eficientes.</li>
          <br/>
          <li>Se optimizó la carga de imágenes y archivos mediante Firebase.</li>
        </ul>
    
        <ul>
          <h3 className="modal-title">Responsividad</h3>
          <li>Se ajustaron los valores de medida para un mejor ajuste gráfico en dispositivos pequeños.</li>
        </ul>
          
        <ul>
          <h3 className="modal-title">Eliminación en cascada</h3>
          <li>Ahora es posible eliminar reportes junto con los diagramas de Ishikawa relacionados al mismo reporte.</li>
        </ul>

        <ul>
          <h3 className="modal-title">Nombres en migas de pan</h3>
          <li>Las migas de pan se han actualizado para renombrar URLs extensas a nombres más amigables para el usuario.</li>
        </ul>
    
        <ul>
          <h3 className="modal-title">Nuevas Estadísticas Ishikawa Vacíos</h3>
          <li>Se optimizaron los filtros para las gráficas, evitando errores en los cálculos de los valores.</li>
          <br />
          <li>Se generaron nuevas estadísticas para el conteo y la administración de Ishikawas vacíos.</li>
          <br />
          <li>Se agregó una estadística para el top 10 de incumplimientos anuales.</li>
          <br />
          <li>Se incluyó una estadística para revisar a los participantes de los Ishikawas.</li>
        </ul>

        <ul>
          <h3 className="modal-title">Sistema de Correos</h3>
          <li>Se implementó un nuevo sistema de correos para la aplicación, aplicable a los apartados de auditorías, Ishikawas y usuarios.</li>
          <br />
          <li>Se actualizó el servicio de correo a Gmail para facilitar su uso y evitar conflictos.</li>
          <br />
          <li>Se optimizó toda la funcionalidad relacionada con los correos para un mejor desempeño.</li>
        </ul>
        <br />
        <br />

      <h1>Versión 2.1.0 (Beta)</h1>
        
      <ul>
        <h3 className="modal-title">Nueva barra de navegación</h3>
        <li>Se agregó una nueva barra de navegación, la cual es activable presionando la tecla “Tab” y en dispositivos móviles desplazando el dedo de izquierda a derecha.</li>
      </ul>
  
      <ul>
        <h3 className="modal-title">Cambio en la navegación entre roles</h3>
        <li>Se cambió el estilo de los apartados para desplazarse entre roles.</li>
      </ul>
  
      <ul>
        <h3 className="modal-title">Ishikawa vacío</h3>
        <li>Se agregó un nuevo apartado para navegar a Ishikawas vacíos sin la necesidad de abrir otro enlace.</li>
      </ul>
        
      <ul>
        <h3 className="modal-title">Cambio en las estadísticas</h3>
        <li>Se optimizaron los filtros para las gráficas y así evitar errores en los cálculos de los valores.</li>
        <br />
        <li>Se agregaron los filtros para que funcionaran y contabilizaran de mejor manera.</li>
        <br />
        <li>Se modificó un poco el diseño para hacerlo más agradable.</li>
      </ul>
  
      <ul>
        <h3 className="modal-title">Se realizó el programa anual de auditorías</h3>
        <li>Se creó un nuevo componente llamado programa anual de auditorías.</li>
        <br />
        <li>Se asignó a la base de datos y terminó para su utilización.</li>
        <br />
        <li>Se continúa trabajando en los correos.</li>
        <br />
        <li>Se agregó un diseño acorde con colores.</li>
      </ul>
      <br />
      <br />

      <h1>Versión 2.0 (Beta)</h1>
        
      <ul>
        <h3 className="modal-title">¡Un solo login!</h3>
        <li>Se han unificado los logins de Administrador, Auditor y Auditado en uno solo llamado “Auditorías”, esto con el fin de optimizar el tiempo requerido para ciertas acciones y brindar mayor comodidad al usuario.</li>
      </ul>

      <ul>
        <h3 className="modal-title">Navegación entre roles</h3>
        <li>Ahora es posible acceder a las funcionalidades de Administrador, Auditor y Auditado en la misma sesión, utilizando los botones correspondientes en la parte superior en el inicio.</li>
      </ul>

      <ul>
        <h3 className="modal-title">Ícono de usuario</h3>
        <li>Se ha agregado un ícono de usuario en la esquina superior derecha de la aplicación. Dicho ícono despliega funcionalidades como cerrar sesión, mi cuenta y volver a inicio.</li>
      </ul>

      <ul>
        <h3 className="modal-title">Eliminación de barra de navegación</h3>
        <li>La barra de navegación se ha retirado por temas estéticos y de funcionalidad. Se implementará una nueva en posteriores actualizaciones.</li>
      </ul>

      <ul>
        <h3 className="modal-title">Migas de pan</h3>
        <li>Se han implementado migas de pan en la parte superior derecha de la aplicación para facilitar la navegación.</li>
      </ul>
      
      <ul>
        <h3 className="modal-title">Corrección de estadísticas</h3>
        <li>Se ajustaron las estadísticas para que también incluyeran las realizadas y terminadas, ya que solo se mostraban las finalizadas y los hallazgos no concordaban con las auditorías mostradas.</li>
        <br />
        <li>Se cambiaron todas las palabras de observaciones por hallazgos.</li>
        <br />
        <li>Se le quitó el año innecesario a los títulos de las tablas.</li>
      </ul>

      <ul>
        <h3 className="modal-title">Cambio en calendarios de auditorías</h3>
        <li>Se rehizo el calendario de auditorías para optimizar mejor y tener los dos juntos para una mejor vista.</li>
        <br />
        <li>Se actualizó el diseño de los calendarios para que se vean mejor.</li>
        <br />
        <li>Se arreglaron los estatus, ya que salían con valores como "aún excelente", y se ajustaron a los valores correctos.</li>
      </ul>

      <ul>
        <h3 className="modal-title">Modificación en tarjetas de usuarios</h3>
        <li>Por parte del administrador, se modificó el diseño del componente usuarios ya que el color amarillo no quedaba con el resto de las aplicaciones.</li>
      </ul>

      <ul>
        <h3 className="modal-title">Calendario</h3>
        <li>Se solucionó el problema en los calendarios que ocasionaba la imposibilidad de visualizar las auditorías.</li>
      </ul>
    </div>
  );
};

export default DatosV;