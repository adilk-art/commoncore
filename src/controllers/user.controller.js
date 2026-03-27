import { registerUser } from "../services/auth.services.js";

const loadSignupPage = (req, res) => {
  res.render("user/signup.ejs",{error:null});
};

const loadLoginPage = (req, res) => {
  res.render("user/login.ejs");
};

const signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if(password!==confirmPassword){
      throw new Error("passwords do not match")
    }
    const user = await registerUser({ name, email, password });
    req.session.userId = user._id;
    res.redirect("user/login");
  } catch (error) {
    res.render("user/signup.ejs", { error: error.message });
  }
};

export default { loadSignupPage, loadLoginPage, signup };
