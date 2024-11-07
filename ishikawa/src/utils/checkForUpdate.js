// utils/checkForUpdate.js
export async function checkForUpdate(currentVersion) {
    try {
      const response = await fetch('/version.json', { cache: 'no-store' }); // Evita el caché para obtener siempre la versión más reciente
      if (!response.ok) throw new Error('No se pudo obtener la versión');
      const { version } = await response.json();
      return version !== currentVersion;
    } catch (error) {
      console.error('Error verificando la versión:', error);
      return false;
    }
  }
  