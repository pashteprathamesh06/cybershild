/* eslint-disable no-unused-vars */

const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value for field: ${field}`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Multer file size / type errors
  if (err.name === 'MulterError') {
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = { notFound, errorHandler };
