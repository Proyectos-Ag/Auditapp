// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'aguida-backend',
    script: './bin/www',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'development',
      PORT: 3002,
      HTTPS_PORT: 3443
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3002,
      HTTPS_PORT: 3443
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true
  }]
};