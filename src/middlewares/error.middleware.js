export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found ${req.url}`));
};

export const errorHandler = (err, req, res, next) => {
  const statusCode =
    res.statusCode && res.statusCode !== 200
      ? res.statusCode
      : err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    errors: err.errors || null
  });
};


