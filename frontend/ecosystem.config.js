module.exports = {
  apps: [
    {
      name: 'payroll-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
      wait_ready: true,
      // Log rotation
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Health monitoring
      health_check_grace_period: 3000,
    },
  ],
};
