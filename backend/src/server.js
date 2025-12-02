require('express-async-errors');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
dotenv.config();
const path = require('path');
const fs = require('fs');

const { connectToDatabase } = require('./config/db');
const homesRouter = require('./routes/homes');
const peopleRouter = require('./routes/people');
const onboardingRouter = require('./routes/onboarding');
const authRouter = require('./routes/auth');
const myRouter = require('./routes/my');
const templatesRouter = require('./routes/templates');
const messagesRouter = require('./routes/messages');
const fileStorageRouter = require('./routes/uploadToFileStorage');
const aiRouter = require('./routes/ai');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
// If running behind a load balancer or proxy, trust X-Forwarded-* headers
app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));
// CORS for API routes only (allow all origins for now)
app.use('/api', cors());
app.options('/api/*', cors());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRouter);
app.use('/api/homes', homesRouter);
app.use('/api/people', peopleRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/my', myRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/homes', messagesRouter);
app.use('/api/file-storage', fileStorageRouter);
app.use('/api/ai', aiRouter);

// Static file hosting
const publicDir = path.resolve(__dirname, '../public');
const appDir = path.join(publicDir, 'app');
const marketingDir = path.join(publicDir, 'marketing');

// Serve frontend app at /app
if (fs.existsSync(appDir)) {
  app.use('/app', express.static(appDir, { index: false, extensions: ['html'] }));
  app.get(['/app', '/app/*'], (_req, res, next) => {
    // Do not intercept asset requests
    if (_req.path.startsWith('/app/assets/')) return next();
    const indexFile = path.join(appDir, 'index.html');
    if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
    return next();
  });
}

// Serve marketing site at /
if (fs.existsSync(marketingDir)) {
  app.use('/', express.static(marketingDir, { index: 'index.html', extensions: ['html'] }));
  // History fallback for marketing (non-API, non-/app)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/app')) return next();
    const indexFile = path.join(marketingDir, 'index.html');
    if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
    return next();
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 5051;

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('Uncaught Exception:', err);
});

(async () => {
  await connectToDatabase();
  app.listen(port, () => {
    console.log(`CustomHome API listening on http://localhost:${port}`);
  });
})();


