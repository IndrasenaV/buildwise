## Buildwise - Build and Deploy Guide

### Overview
- Root serves the Marketing site.
- `/app` serves the Web App (hash-based routing: `/app/#/...`).
- `/api` serves the Node.js API.

### Prerequisites
- Node.js 18+ and npm
- PM2 on the VM: `npm i -g pm2`
- MongoDB URI available on the VM (env var `MONGODB_URI`)

### 1) Install dependencies (from repo root)

```bash
npm ci --prefix frontend
npm ci --prefix marketing
npm ci --prefix backend
```

### 2) Build both frontend projects into backend/public
- Outputs:
  - Marketing → `backend/public/marketing`
  - App → `backend/public/app`

```bash
npm run build:public --prefix backend
```

### 3) Package server only (no node_modules)
Creates `buildwise_server.zip` one level above `backend` containing backend code and built assets.

```bash
npm run package:zip --prefix backend
```

Alternatively (manual zip example, mirrors your style):
```bash
cd ..
zip -r buildwise_server.zip backend -x "backend/node_modules/*" "backend/node_modules/**"
cd buildwise
```

### 4) Copy to VM and deploy with PM2
Replace the key path, host, and destination folder as needed.

```bash
scp -i deployment/ubuntu.pem ./buildwise_server.zip ubuntu@18.220.232.228:~/buildwise

ssh -i deployment/ubuntu.pem ubuntu@18.220.232.228

cd ~/buildwise

pm2 stop buildwise-server || true
rm -rf backend
unzip buildwise_server.zip
cd backend
npm ci --omit=dev
```

Set environment and start with PM2 ecosystem (recommended; uses PORT=8888 by default):
```bash
export MONGODB_URI='YOUR_MONGODB_URI'
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

Or start without ecosystem (set PORT and MONGODB_URI explicitly):
```bash
export PORT=8888
pm2 start src/server.js --name buildwise-server
pm2 save
```

### 5) Verify
```bash
curl http://http://18.220.232.228:5051/api/health
```
Open:
- Marketing: `http://18.220.232.228:8888/`
- App: `http://18.220.232.228:8888/app/#/homes`

### 6) PM2 Operations
```bash
pm2 logs buildwise-server
pm2 reload buildwise-server
```
Optional log rotation:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 20M
pm2 set pm2-logrotate:retain 10
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:workerInterval 60
```

### Notes
- Frontend uses HashRouter; no server rewrite rules required.
- Static builds are served by the Node app from `backend/public`.
