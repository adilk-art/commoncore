import { adminLoginService } from "../services/admin/auth.service.js";

export const loadLoginPage = async (req, res) => {
  res.render("admin/login.ejs", { errors: null });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await adminLoginService(email, password);
    if (!result.success) {
      return res.render("admin/login", { errors: result.errors });
    }
    req.session.adminId = result.admin._id;
    return res.render("admin/dashboard",{
        stats:null,
        active:"dashboard",
        title:"Dashboard"
    });
  } catch (err) {
    return res.status(500).render("admin/login", {
      errors: { general: "Something went wrong" },
    });
  }
};

export const loadDashboardPage = (req, res) => {
  res.send("admin dashboard");
};
