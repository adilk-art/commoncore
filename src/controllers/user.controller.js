import {
  registerUser,
  loginUser,
  forgotPasswordService,
  resetPasswordService,
  prepareSignup
} from "../services/auth.services.js";
import {
  resendOtpService,
  verifyOtpService,
  createAndSendOtp,
} from "../services/otp.service.js";
import {
  findUserByEmail,
  findUserById,
  updateUserByEmail,
  updateUserById,
} from "../repositories/user.repository.js";
import { createUser } from "../repositories/user.repository.js";
import { success } from "zod";
import {updateProfileService} from "../services/user.service.js"

const loadHomePage = (req, res) => {
  try {
    res.render("user/home.ejs");
  } catch (error) {
    next(error);
  }
};

const loadSignupPage = (req, res) => {
  res.render("user/signup.ejs", { error: null, formData: {} });
};

const loadLoginPage = (req, res) => {
  const successMessage = req.session.successMessage || null;
  res.render("user/login.ejs", { error: null, formData: {}, successMessage });
};

const initialSignup = async (req, res) => {                //passwordhashing and validation
try{
  const {name,email,password,confirmPassword}=req.body;
    const userData = await prepareSignup({
      name,
      email,
      password,
      confirmPassword,
    });

    req.session.tempUser = userData

    await createAndSendOtp({ 
      email:userData.email,
      purpose: "signup" });
    return res.status(200).json({
      success:true
    })
}    
catch (error) {
    return res.status(400).json({
      errors:error.errors||{general:error.message}

    })
    
  }
};



const loadOtpPage = async (req, res) => {
  const { email, purpose } = req.query;
  res.render("user/otp.ejs", { email, purpose, error: null });
};
const resendOtp = async (req, res) => {
  const { email, purpose } = req.body;
  try {
    await resendOtpService({ email, purpose });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp, purpose } = req.body;

  try {
    if (purpose === "email-change") {
      const userId = req.session.userId;

      if (!req.session.pendingEmail) {
        return res.json({
          success: false,
          message: "Session expired",
        });
      }

      const existing = await findUserByEmail(req.session.pendingEmail);

      if (existing) {
        return res.json({
          success: false,
          message: "Email already taken",
        });
      }

      await verifyOtpService({ email, otp, purpose });

      await updateUserById(userId, {
        email: req.session.pendingEmail,
      });

      req.session.pendingEmail = null;

      return res.json({ success: true });
    }

    if (purpose === "signup") {
      //signup

      const tempUser = req.session.tempUser;

      if (!tempUser || tempUser.email !== email) {
        return res.json({
          success: false,
          message: "Signup expired, please signup again",
        });
      }

      await verifyOtpService({ email, otp, purpose });

      await createUser({
        name: tempUser.name,
        email: tempUser.email,
        password: tempUser.password,
      });

      delete req.session.tempUser;

      return res.json({ success: true });
    }

   if (purpose === "forgot-password") {
       const user = await findUserByEmail(email);

      if (!user) {
        return res.json({
          success: false,
          message: "User not found",
        });
      }

      await verifyOtpService({ email, otp, purpose });

      // store email temporarily to allow password reset
      req.session.resetEmail = email;

      return res.json({
        success: true,
        redirect: "/user/reset-password",
      });
    }


    return res.status(400).json({
      success: false,
      message: "Invalid OTP purpose",
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const login = async (req, res) => {
  let email, password;
  const successMessage = req.session.successMessage || null;
  try {
    ({ email, password } = req.body);
    const user = await loginUser({ email, password });
    req.session.userId = user._id;
    res.redirect("/");
  } catch (err) {
    res.render("user/login.ejs", {
      error: err.message,
      formData: { email },
      successMessage,
    });
  }
};

const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.redirect("/");
  });
};

const loadForgotPasswordPage = (req, res) => {
  res.render("user/forgot-password.ejs", { error: null });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    await forgotPasswordService(email);
    req.session.resetEmail = email;
    res.redirect(
      `/user/verify-otp?email=${encodeURIComponent(email)}&purpose=forgot-password`,
    );
  } catch (err) {
    res.render("user/forgot-password.ejs", { error: err.message });
  }
};

const loadResetPasswordPage = (req, res) => {
  const email = req.session.resetEmail;

  if (!email) return res.redirect("/user/forgot-password");

  res.render("user/reset-password.ejs", { error: null, email }); // ← email passed here
};

const resetPassword = async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  try {
    await resetPasswordService({ email, password, confirmPassword });
    delete req.session.resetEmail;
    req.session.successMessage =
      "Password reset successfully..Please login with your new password";
    res.redirect("/user/login");
  } catch (err) {
    res.render("user/reset-password.ejs", { error: err.message, email });
  }
};
const loadProfilePage = (req, res, next) => {
  res.render("user/profile.ejs");
};

const loadEditProfile = async(req, res) => {
  res.render("user/edit-profile.ejs",{error:null});
};

const EditProfile=async(req,res,next)=>{
  try{
    await updateProfileService(
      req.session.userId,
      req.body,
      req.file
    );
    res.redirect("/user/profile")

    
  }catch(error){
    res.render("user/edit-profile.ejs",{
      error:error.message
    })
  }
}



const emailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.json({ success: false, message: "Email required" });
    }

    const existing = await findUserByEmail(newEmail);

    if (existing) {
      return res.json({
        success: false,
        message: "Email already exists",
      });
    }

    req.session.pendingEmail = newEmail;

    await createAndSendOtp({
      email: newEmail,
      purpose: "email-change",
    });

    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

const loadSetPassword = async (req, res, next) => {
  try {
    const user = await findUserById(req.session.userId);
    if (!user) {
      return res.redirect("/user/login");
    }

    if (!user.googleId || user.password) {
      return res.redirect("/user/profile");
    }

    res.render("user/set-password.ejs");
  } catch (err) {
    next(err);
  }
};

export default {
  loadSignupPage,
  loadLoginPage,
  prepareSignup,
  initialSignup,
  loadOtpPage,
  resendOtp,
  verifyOtp,
  login,
  loadForgotPasswordPage,
  forgotPassword,
  loadResetPasswordPage,
  resetPassword,
  loadHomePage,
  loadProfilePage,
  logout,
  loadSetPassword,
  loadEditProfile,
  EditProfile,
  emailChange,
};
