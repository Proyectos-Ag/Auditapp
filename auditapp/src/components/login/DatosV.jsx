import React from 'react';
import './css/datosv.css'; // Archivo CSS importado para los estilos

const DatosV = () => {

  return (
    <div className="modal-body">

      <h1>Versión 2.1.0 (Beta)</h1>
        
        <ul>
          <h3 className="modal-title">Nueva barra de navegación</h3>
          <li>Se agrego una nueva barra de navegación la cual es activable presionando la tecla “Tab” y en dispositivos móviles desplazando el dedo de izquierda a derecha.</li>
        </ul>
  
        <ul>
          <h3 className="modal-title">Cambio en la navegación entre roles </h3>
          <li>Se cambio el estilo de los apartados para desplazarse entre roles.</li>
        </ul>
  
        <ul>
          <h3 className="modal-title">Ishikawa vacío</h3>
          <li>Se  agrego un nuevo apartado para navegar a ishikawas vacíos sin la necesidad de abrir otro enlace </li>
        </ul>
        
        <ul>
          <h3 className="modal-title">Cambio en las estadísticas</h3>
          <li>Se ajustaron las estadísticas para que, también salieran las realizadas, y Terminadas, 
            ya que solo salían las finalizadas y los hallazgos no concordaban con las auditorías 
            mostradas.</li>
            <br />
          <li>Se agregaron los filtros para que funcionara y contara de mejor manera.</li>
          <br />
          <li>Se modifico un poco el diseño para hacerlo más agradable.</li>
        </ul>
  
        <ul>
          <h3 className="modal-title">Se realizo el programa anual de auditorías</h3>
          <li>Se creo un nuevo componente llamado programa anual de auditorias.</li>
          <br />
          <li>Se asigno a la base de datos y termino para su utilización.</li>
          <br />
          <li>Se continúa trabajando en los correos.</li>
          <br />
          <li>Se agrego un diseño acorde con colores.</li>
        </ul>
        <br />
        <br />

        <h1>Versión 2.0 (Beta)</h1>
        
      <ul>
        <h3 className="modal-title">¡Un solo login!</h3>
        <li>Se han unificado los login de Administrador, Auditor y Auditado en uno solo llamado “Auditorias”, esto con el fin de optimizar el tiempo requerido para cierta acciones y mayor comodidad para el usuario.</li>
      </ul>

      <ul>
        <h3 className="modal-title">Navegación entre roles</h3>
        <li>Ahora es posible acceder a las funcionalidades de Administrador, Auditor y Auditado en la misma sesión, utilizando los botones correspondientes en la parte superior en el inicio.</li>
      </ul>

      <ul>
        <h3 className="modal-title">Icono de Usuario</h3>
        <li>Se a agregado un icono de usuario en la esquina superior derecha de la aplicación, dicho icono despliega funcionalidades como cerrar sesión, mi cuenta y volver a inicio.</li>
      </ul>

      <ul>
        <h3 className="modal-title">Eliminación de barra de navegación</h3>
        <li>La barra de navegación se a retirado por temas estéticos y de funcionalidad, se implementara una nueva en posteriores actualizaciones.</li>
      </ul>

      <ul>
        <h3 className="modal-title">Migas de pan</h3>
        <li>Se han implementado migas de pan en la parte superior derecha de la aplicación para facilitar la navegación. </li>
      </ul>
      
      <ul>
        <h3 className="modal-title">Corrección de estadísticas</h3>
        <li>Se ajustaron las estadísticas para que, también salieran las realizadas, y Terminadas, 
          ya que solo salían las finalizadas y los hallazgos no concordaban con las auditorías 
          mostradas.</li>
          <br />
        <li>Se cambiaron todas las palabras de observaciones por hallazgos.</li>
        <br />
        <li>Se le quito el año innecesario a los títulos de las tablas.</li>
      </ul>

      <ul>
        <h3 className="modal-title">Cambio en calendarios de Auditorías</h3>
        <li>Se rehízo los calendarios de auditorías para optimizar mejor y tener los dos juntos para una mejor vista.</li>
        <br />
        <li>Se actualizo el diseño de los calendarios para hacerlo ver de mejor manera y más tranquilo.</li>
        <br />
        <li>Se arreglaron los status, ya que salían aun excelente etc y se ajustó a los valores que son.</li>
      </ul>

      <ul>
        <h3 className="modal-title">Modificación en cards de usuarios</h3>
        <li>Por parte de administrador, se modifico el diseño del componente usuarios, ya que el color amarillo no quedaba con el resto de las aplicaciones.</li>
      </ul>

      <ul>
        <h3 className="modal-title">Calendario</h3>
        <li>Se soluciono el problema en calendarios que ocasionaba el no poder visualizar las auditorias</li>
      </ul>
    </div>
  );
};

export default DatosV;
