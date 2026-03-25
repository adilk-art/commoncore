import express from "express";
const router = express.Router();

router.get("/signup", (req, res) => {
  res.status(200).json({
    success: true,
    message: "page rendered success",
  });
});

export default router;
