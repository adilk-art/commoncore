import { adminLoginService } from "../services/admin/auth.service.js";
import { getAllUsersService,toggleUserBlockService } from "../services/admin/admin.service.js";
import User from "../models/user.model.js";
import Admins from "../models/admin.model.js";


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
    return res.render("admin/dashboard", {
      stats: null,
      active: "dashboard",
      title: "Dashboard",
    });
  } catch (err) {
    return res.status(500).render("admin/login", {
      errors: { general: "Something went wrong" },
    });
  }
};


export const loadDashboardPage = (req, res) => {
  res.render("admin/dashboard.ejs", {
      stats: null,
      active: "dashboard",
      title: "Dashboard",
    });
};


export const loadUsersPage = async (req, res) => {
  const search = req.query.search || "";
  const page = parseInt(req.query.page) || 1;
  const sort = req.query.sort || "latest";

  const result = await getAllUsersService({
    search,
    page,
    sort
  });

  res.render("admin/users.ejs", {
    ...result,
    search,
    sort,
  });
};


export const blockUser=async(req,res)=>{
    const {id}=req.params;
    await toggleUserBlockService(id);
    res.redirect(req.get("Referrer") || "/admin/users");

}


export const logout = (req, res, next) => {
  delete req.session.adminId;
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  res.redirect("/");
};