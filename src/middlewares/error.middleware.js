const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found ${req.url}`));
};

const errorHandler = (err, req, res, next) => {
  let statusCode;

  if (res.statusCode !== 200) {
    statusCode = res.statusCode;
  } else {
    statusCode = 500;
  }
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error"
  });
};

module.exports = { notFound, errorHandler };
