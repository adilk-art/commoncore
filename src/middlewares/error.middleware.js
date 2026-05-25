export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found ${req.url}`));
};

export const errorHandler = (
  err,
  req,
  res,
  next,
) => {

  const statusCode =
    res.statusCode &&
    res.statusCode !== 200
      ? res.statusCode
      : err.statusCode || 500;

  const isApiRequest =
    req.xhr ||
    req.headers.accept?.includes("json");

  if (isApiRequest) {

    return res.status(statusCode).json({
      success: false,
      message:
        err.message ||
        "Internal server error",

      errors: err.errors || null,
    });
  }

  if (statusCode === 404) {

    return res
      .status(404)
      .render("errors/404", {
        message: err.message,
      });
  }

  return res
    .status(500)
    .render("errors/500");
};

