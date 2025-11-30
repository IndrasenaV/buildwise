function notFoundHandler(_req, res, _next) {
  res.status(404).json({ message: 'Not Found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  // Avoid leaking internals in production
  const status = err.status || 500;
  const message = err.expose ? err.message : 'Internal Server Error';
  if (process.env.NODE_ENV !== 'production') {
    // Log full error during development
    // eslint-disable-next-line no-console
    console.error(err);
  }
  res.status(status).json({ message });
}

module.exports = { notFoundHandler, errorHandler };


