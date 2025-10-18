// routes/webhookRoutes.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Función para verificar la firma del webhook (seguridad)
function verifyGitHubSignature(req, secret) {
  if (!secret) return true; // Si no hay secreto configurado, permitir (solo para pruebas)
  
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
  
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Instancia global del autoUpdate (se establecerá desde app.js)
let autoUpdateInstance = null;

function setAutoUpdateInstance(instance) {
  autoUpdateInstance = instance;
}

// Endpoint para recibir webhooks de GitHub
router.post('/github', express.json(), async (req, res) => {
  console.log('\n🔔 Webhook recibido desde GitHub');
  
  try {
    // Verificar firma de seguridad
    const isValid = verifyGitHubSignature(req, process.env.GITHUB_WEBHOOK_SECRET);
    if (!isValid) {
      console.log('❌ Firma de webhook inválida');
      return res.status(401).json({ error: 'Firma inválida' });
    }

    // Obtener información del webhook
    const event = req.headers['x-github-event'];
    const payload = req.body;

    console.log('📋 Evento:', event);
    
    // Solo procesar eventos 'push'
    if (event !== 'push') {
      console.log('ℹ️  Evento ignorado (no es push)');
      return res.status(200).json({ message: 'Evento ignorado' });
    }

    // Verificar que el push sea en la rama que monitoreamos
    const branch = payload.ref?.replace('refs/heads/', '');
    const targetBranch = process.env.GIT_BRANCH || 'Completo';
    
    console.log('🌿 Rama del push:', branch);
    console.log('🎯 Rama objetivo:', targetBranch);

    if (branch !== targetBranch) {
      console.log('ℹ️  Push en rama diferente, ignorando');
      return res.status(200).json({ 
        message: 'Push en rama diferente',
        branch,
        targetBranch
      });
    }

    // Información del commit
    const commits = payload.commits || [];
    const pusher = payload.pusher?.name || 'Desconocido';
    const repository = payload.repository?.full_name || 'Desconocido';
    
    console.log('👤 Pusher:', pusher);
    console.log('📦 Repositorio:', repository);
    console.log('📝 Commits:', commits.length);
    
    if (commits.length > 0) {
      console.log('💬 Último mensaje:', commits[commits.length - 1].message);
    }

    // Verificar que el sistema de auto-actualización esté disponible
    if (!autoUpdateInstance) {
      console.log('⚠️  Sistema de auto-actualización no disponible');
      return res.status(503).json({ 
        error: 'Sistema de auto-actualización no disponible' 
      });
    }

    // Responder inmediatamente a GitHub (para no timeout)
    res.status(200).json({ 
      message: 'Webhook recibido, actualizando servidor...',
      branch,
      commits: commits.length,
      pusher
    });

    // Realizar la actualización en segundo plano
    console.log('🚀 Iniciando actualización por webhook...');
    
    // Pequeño delay para que la respuesta se envíe primero
    setTimeout(async () => {
      try {
        const success = await autoUpdateInstance.performUpdate();
        if (success) {
          console.log('✅ Actualización por webhook completada');
        } else {
          console.log('❌ Error en actualización por webhook');
        }
      } catch (error) {
        console.error('❌ Error al actualizar:', error.message);
      }
    }, 1000);

  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para probar el webhook manualmente
router.post('/test', async (req, res) => {
  console.log('\n🧪 Webhook de prueba recibido');
  
  if (!autoUpdateInstance) {
    return res.status(503).json({ 
      error: 'Sistema de auto-actualización no disponible' 
    });
  }

  res.status(200).json({ 
    message: 'Prueba iniciada, actualizando servidor...'
  });

  setTimeout(async () => {
    try {
      await autoUpdateInstance.performUpdate();
    } catch (error) {
      console.error('Error:', error.message);
    }
  }, 1000);
});

// Endpoint de salud para verificar que el webhook funciona
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    webhookReady: autoUpdateInstance !== null,
    timestamp: new Date().toISOString()
  });
});

module.exports = { router, setAutoUpdateInstance };