module.exports = {
  apps: [
    {
      name: 'lala-backend',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: true,
      max_memory_restart: '1024M',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
