export const notFound = (req, res) => {
  return res.status(404).render("errors/404.ejs");
};

export const errorHandler = (err, req, res, next) => {
  const statusCode =
    err.statusCode ||
    res.statusCode ||
    500;

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

  return res.status(500).send(`
    <h1>500 - Internal Server Error</h1>
    <p>${err.message || "Something went wrong"}</p>
  `);
};
