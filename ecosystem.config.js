module.exports = {
  apps: [
    {
      name: 'backend',
      script: './server.js',
      instances: '4',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      autorestart: true,
    },
  ],
};
