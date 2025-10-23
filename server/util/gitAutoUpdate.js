// util/gitAutoUpdate.js
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class GitAutoUpdate {
  constructor(options = {}) {
    this.gitUrl = options.gitUrl || 'https://github.com/FredWard87/otravez.git';
    this.branch = options.branch || 'Completo';
    this.checkInterval = options.checkInterval || 5 * 60 * 1000; // 5 minutos por defecto
    this.isUpdating = false;
    this.lastCommit = null;
  }

  async getCurrentCommit() {
    try {
      const { stdout } = await execAsync('git rev-parse HEAD');
      return stdout.trim();
    } catch (error) {
      console.error('❌ Error al obtener commit actual:', error.message);
      return null;
    }
  }

  async fetchLatestCommit() {
    try {
      await execAsync(`git fetch origin ${this.branch}`);
      const { stdout } = await execAsync(`git rev-parse origin/${this.branch}`);
      return stdout.trim();
    } catch (error) {
      console.error('❌ Error al obtener último commit remoto:', error.message);
      return null;
    }
  }

  async hasUpdates() {
    const currentCommit = await this.getCurrentCommit();
    const latestCommit = await this.fetchLatestCommit();

    if (!currentCommit || !latestCommit) {
      return false;
    }

    return currentCommit !== latestCommit;
  }

  async performUpdate() {
    if (this.isUpdating) {
      console.log('⏳ Actualización ya en progreso...');
      return false;
    }

    this.isUpdating = true;

    try {
      console.log('🔄 Iniciando actualización desde Git...');
      console.log(`📦 Repositorio: ${this.gitUrl}`);
      console.log(`🌿 Rama: ${this.branch}`);

      // 1. Guardar cambios locales (si los hay)
      console.log('💾 Guardando cambios locales...');
      try {
        await execAsync('git stash');
      } catch (err) {
        console.log('ℹ️  No hay cambios locales para guardar');
      }

      // 2. Hacer pull de los cambios
      console.log('⬇️  Descargando actualizaciones...');
      await execAsync(`git pull origin ${this.branch}`);

      // 3. Instalar dependencias nuevas
      console.log('📦 Verificando dependencias...');
      await execAsync('npm install');

      // 4. Aplicar cambios locales guardados
      try {
        await execAsync('git stash pop');
        console.log('✅ Cambios locales aplicados');
      } catch (err) {
        console.log('ℹ️  No había cambios locales guardados');
      }

      console.log('✅ ¡Actualización completada exitosamente!');
      console.log('🔄 El servidor se reiniciará en 3 segundos...');

      // Reiniciar el servidor después de 3 segundos
      setTimeout(() => {
        console.log('🔄 Reiniciando servidor...');
        process.exit(0); // PM2 o nodemon lo reiniciará automáticamente
      }, 3000);

      return true;
    } catch (error) {
      console.error('❌ Error durante la actualización:', error.message);
      console.error('Stack:', error.stack);
      return false;
    } finally {
      this.isUpdating = false;
    }
  }

  async checkForUpdates() {
    try {
      console.log('\n🔍 Verificando actualizaciones...');
      
      const hasUpdates = await this.hasUpdates();

      if (hasUpdates) {
        console.log('🆕 ¡Nueva versión disponible!');
        const success = await this.performUpdate();
        
        if (!success) {
          console.log('⚠️  La actualización falló. El servidor continuará con la versión actual.');
        }
      } else {
        console.log('✅ El servidor está actualizado');
      }
    } catch (error) {
      console.error('❌ Error al verificar actualizaciones:', error.message);
    }
  }

  startAutoUpdate() {
    console.log('\n=================================');
    console.log('🔄 Sistema de auto-actualización iniciado');
    console.log('=================================');
    console.log('📦 Repositorio:', this.gitUrl);
    console.log('🌿 Rama:', this.branch);
    console.log('⏱️  Intervalo:', Math.floor(this.checkInterval / 60000), 'minutos');
    console.log('=================================\n');

    // Verificar inmediatamente al iniciar
    this.checkForUpdates();

    // Programar verificaciones periódicas
    setInterval(() => {
      this.checkForUpdates();
    }, this.checkInterval);
  }

  async initialize() {
    try {
      // Verificar si es un repositorio Git
      const { stdout } = await execAsync('git rev-parse --is-inside-work-tree');
      if (stdout.trim() !== 'true') {
        throw new Error('No es un repositorio Git');
      }

      // Verificar que la rama existe
      const currentBranch = await this.getCurrentBranch();
      console.log('🌿 Rama actual:', currentBranch);

      // Configurar el remote si no existe
      try {
        await execAsync(`git remote add origin ${this.gitUrl}`);
      } catch (err) {
        // El remote ya existe
      }

      return true;
    } catch (error) {
      console.error('❌ Error al inicializar Git:', error.message);
      console.log('\n💡 Para inicializar el repositorio:');
      console.log('   1. git init');
      console.log(`   2. git remote add origin ${this.gitUrl}`);
      console.log(`   3. git fetch origin`);
      console.log(`   4. git checkout -b ${this.branch} origin/${this.branch}`);
      console.log('\n');
      return false;
    }
  }

  async getCurrentBranch() {
    try {
      const { stdout } = await execAsync('git branch --show-current');
      return stdout.trim();
    } catch (error) {
      return 'unknown';
    }
  }

  // Método para forzar actualización manual
  async forceUpdate() {
    console.log('🚨 Forzando actualización manual...');
    return await this.performUpdate();
  }
}

module.exports = GitAutoUpdate;