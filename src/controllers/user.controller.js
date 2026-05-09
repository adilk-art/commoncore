import {
  registerUser,
  loginUser,
  forgotPasswordService,
  resetPasswordService,
  prepareSignup,
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
import {
  updateProfileService,
  verifyPasswordService,
  verifyNewEmailService,
  updateEmailService,
  changePasswordService,
} from "../services/user.service.js";
import generateOtp from "../utils/generateOtp.js";

const loadHomePage = (req, res, next) => {
  try {
    res.render("user/home.ejs");
  } catch (error) {
    next(error);
  }
};

const loadSignupPage = (req, res, next) => {
  try {
    res.render("user/signup.ejs", { error: null, formData: {} });
  } catch (error) {
    next(error);
  }
};

const loadLoginPage = (req, res) => {
  const successMessage = req.session.successMessage || null;
  req.session.successMessage = null;

  res.render("user/login.ejs", {
    error: null,
    formData: {},
    successMessage,
  });
};

const initialSignup = async (req, res) => {
  //passwordhashing and validation
  try {
    const { name, email, password, confirmPassword } = req.body;
    const userData = await prepareSignup({
      name,
      email,
      password,
      confirmPassword,
    });

    req.session.tempUser = userData; //email,password,hashedPassword
    req.session.signupEmail = email;

    await createAndSendOtp({ email, purpose: "signup", session: req.session });
    return res.json({ success: true });
  } catch (error) {
    return res.status(400).json({
      errors: error.errors || { general: error.message },
    });
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { purpose, email } = req.body;

    let targetEmail;

    if (purpose === "signup") {
      targetEmail = req.session.signupEmail || email;
    } else if (purpose === "forgot-password") {
      targetEmail = req.session.resetEmail || email;
    } else if (purpose === "email-change") {
      targetEmail = req.session.pendingEmail;
    }

    if (!targetEmail) {
      throw new Error("Session expired. Try again.");
    }

    await createAndSendOtp({
      email: targetEmail,
      purpose,
      session: req.session,
    });

    res.json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (err) {
    next(err);
  }
};

const verifyOtp = async (req, res) => {
  const { otp, purpose } = req.body;

  try {
    if (!otp || otp.length !== 6) {
      return res.status(400).json({
        message: "Enter a valid 6-digit OTP",
      });
    }

    await verifyOtpService({
      otp,
      purpose,
      session: req.session,
    });

    if (purpose === "signup") {
      const tempUser = req.session.tempUser;

      if (!tempUser) {
        throw { general: "Session expired. Please signup again." };
      }

      const newUser = await createUser({
        name: tempUser.name,
        email: tempUser.email,
        password: tempUser.password,
      });

      req.session.tempUser = null;
      req.session.userId = newUser._id;
      return res.json({ success: true, redirect: "/" });
    }

    if (purpose === "forgot-password") {
      const email = req.session.resetEmail;
      if (!email) {
        throw new Error("Session expired..try again");
      }

      return res.json({
        success: true,
        redirect: "/user/reset-password",
      });
    }

    if (purpose === "email-change") {
      await updateEmailService(req.session.userId, req.session.pendingEmail);
      req.session.pendingEmail = null;
      return res.json({
        success: true,
        redirect: "/user/profile",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      message: error.message || "OTP verification failed",
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
    if (err) {
      err.statusCode = 500;
      err.message = "Logout failed";
      return next(err);
    }

    res.clearCookie("user.sid");

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.redirect("/");
  });
};

const loadForgotPasswordPage = (req, res, next) => {
  res.render("user/forgot-password.ejs", { error: null });
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await forgotPasswordService(email);
    req.session.resetEmail = email;
    await createAndSendOtp({
      email,
      purpose: "forgot-password",
      session: req.session,
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
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

const loadEditProfile = async (req, res) => {
  res.render("user/edit-profile.ejs", { error: null });
};

const EditProfile = async (req, res, next) => {
  try {
    await updateProfileService(req.session.userId, req.body, req.file);
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

const verfifyPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const userId = req.session.userId;
    await verifyPasswordService(userId, password);
    res.json({ success: true });
  } catch (err) {
    res.status(400);
    next(err);
  }
};

const emailChange = async (req, res, next) => {
  try {
    const { email } = req.body;
    const userId = req.session.userId;
    await verifyNewEmailService(email, userId);
    req.session.pendingEmail = email;
    await createAndSendOtp({
      email,
      purpose: "email-change",
      session: req.session,
    });
    return res.json({ success: true });
  } catch (err) {
    res.status(400);
    return next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    await changePasswordService(
      req.session.userId,
      currentPassword,
      newPassword,
    );

    delete req.session.userId;

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    next(err);
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
  verfifyPassword,
  changePassword,
};
