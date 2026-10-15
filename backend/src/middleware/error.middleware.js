export const errorHandler = (err, req, res, next) => {
  console.error('[UNCAUGHT_SERVER_ERROR]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  const statusCode = err.status || err.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected internal error occurred on the server.',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
};

export default errorHandler;
