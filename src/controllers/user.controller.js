import { registerUser, loginUser } from "../services/auth.services.js";

const loadSignupPage = (req, res) => {
  res.render("user/signup.ejs", { error: null, formData: {} });
};

const loadLoginPage = (req, res) => {
  res.render("user/login.ejs", { error: null, formData: {} });
};

const signup = async (req, res) => {
  let name, email, password, confirmPassword;
  try {
    ({ name, email, password, confirmPassword } = req.body);
    const user = await registerUser({ name, email, password, confirmPassword });
    res.redirect("/user/login");
  } catch (error) {
    res.render("user/signup.ejs", {
      error: error.message,
      formData: { name, email },
    });
  }
};

const login = async (req, res) => {
  let email, password;
  try {
    ({ email, password } = req.body);
    const user = await loginUser({ email, password });
    // req.session.userId = user._id;
    res.redirect("/");
  } catch (err) {
    res.render("user/login.ejs", { error: err.message, formData: { email } });
  }
};

export default { loadSignupPage, loadLoginPage, signup, login };
