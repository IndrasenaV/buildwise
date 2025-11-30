module.exports = {
  apps: [
    {
      name: 'buildwise-server',
      cwd: __dirname,
      script: 'src/server.js',
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 8888,
        // Set MONGODB_URI on the VM environment or uncomment and set here:
        // MONGODB_URI: 'mongodb+srv://user:pass@cluster/dbname'
      }
    }
  ]
}


