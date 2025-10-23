// util/generateWebhookSecret.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('\n🔐 Generador de Secreto para GitHub Webhook\n');
console.log('='.repeat(50));

// Generar secreto
const secret = crypto.randomBytes(32).toString('hex');

console.log('\n✅ Secreto generado exitosamente:\n');
console.log('   ' + secret);
console.log('\n' + '='.repeat(50));

// Intentar agregar al .env automáticamente
const envPath = path.join(__dirname, '..', '.env');

try {
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Verificar si ya existe GITHUB_WEBHOOK_SECRET
    if (envContent.includes('GITHUB_WEBHOOK_SECRET=')) {
      // Reemplazar el valor existente
      envContent = envContent.replace(
        /GITHUB_WEBHOOK_SECRET=.*/,
        `GITHUB_WEBHOOK_SECRET=${secret}`
      );
      console.log('\n📝 Actualizando .env existente...');
    } else {
      // Agregar al final
      if (!envContent.endsWith('\n')) {
        envContent += '\n';
      }
      envContent += `\n# Secreto del webhook de GitHub\nGITHUB_WEBHOOK_SECRET=${secret}\n`;
      console.log('\n📝 Agregando secreto al .env...');
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env actualizado correctamente');
  } else {
    console.log('\n⚠️  Archivo .env no encontrado');
    console.log('💡 Crea un archivo .env y agrega esta línea:');
    console.log(`\n   GITHUB_WEBHOOK_SECRET=${secret}\n`);
  }
} catch (error) {
  console.error('\n❌ Error al actualizar .env:', error.message);
  console.log('\n💡 Agrega manualmente esta línea a tu .env:');
  console.log(`\n   GITHUB_WEBHOOK_SECRET=${secret}\n`);
}

console.log('\n' + '='.repeat(50));
console.log('\n📋 Próximos pasos:\n');
console.log('1. Copia el secreto de arriba');
console.log('2. Ve a GitHub → Tu repositorio → Settings → Webhooks');
console.log('3. Agrega un nuevo webhook con estos datos:');
console.log('   - Payload URL: http://192.168.0.35:3002/webhook/github');
console.log('   - Content type: application/json');
console.log('   - Secret: [pega el secreto copiado]');
console.log('   - Events: Just the push event');
console.log('4. Reinicia tu servidor');
console.log('\n' + '='.repeat(50) + '\n');