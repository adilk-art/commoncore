const loadSignupPage = (req, res) => {
  res.render("user/signup.ejs");
};
const loadLoginPage = (req, res) => {
  res.render("user/login.ejs");
};

export default { loadSignupPage, loadLoginPage };
