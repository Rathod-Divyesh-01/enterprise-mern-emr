const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // MongoDB duplicate key error (handling double booking concurrency fallback)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Slot double-booking conflict: This time slot has already been booked by another user.',
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;