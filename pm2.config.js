module.exports = {
  apps: [
    {
      name: 'backend',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
    },
  ],
};
