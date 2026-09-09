export const notFound = (req, res) => {
  if (req.originalUrl.startsWith("/admin")) {
    return res.status(404).render("errors/admin-404");
  }

  return res.status(404).render("errors/404");
};

export const errorHandler = (err, req, res, next) => {
  const statusCode =
    err.status ||
    err.statusCode ||
    (res.statusCode >= 400 ? res.statusCode : 500);

  const isApiRequest =
    req.xhr ||
    req.headers.accept?.includes("json");

  if (isApiRequest) {
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Internal server error",
      errors: err.errors || null,
      code: err.code || null,
    });
  }

  if (statusCode === 404) {
    return res.status(404).render("errors/404", {
      message: err.message,
    });
  }

  return res.status(statusCode).send(`
    <h1>${statusCode} - Error</h1>
    <p>${err.message || "Something went wrong"}</p>
  `);
};
