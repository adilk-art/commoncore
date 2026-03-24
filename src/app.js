const express = require("express");
const app = express();
const { notFound, errorHandler } = require("./middlewares/error.middleware");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
