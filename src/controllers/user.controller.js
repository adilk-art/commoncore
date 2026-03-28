import { registerUser, loginUser } from "../services/auth.services.js";

const loadSignupPage = (req, res) => {
  res.render("user/signup.ejs", { error: null });
};

const loadLoginPage = (req, res) => {
  res.render("user/login.ejs", { error: null });
};

const signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    const user = await registerUser({ name, email, password });
    // req.session.userId = user._id;
    res.redirect("/user/login");
  } catch (error) {
    res.render("user/signup.ejs", { error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await loginUser({ email, password });
    // req.session.userId = user._id;
    res.redirect("/");
  } catch (err) {
    res.render("user/login.ejs", { error: err.message });
  }
};

export default { loadSignupPage, loadLoginPage, signup, login };
