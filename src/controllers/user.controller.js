import { registerUser, loginUser,forgotPasswordService ,resetPasswordService} from "../services/auth.services.js";
import { resendOtpService,verifyOtpService,createAndSendOtp } from "../services/otp.service.js";
import { updateUserByEmail } from "../repositories/user.repository.js";
import { createUser } from "../repositories/user.repository.js";
import { success } from "zod";



const loadSignupPage = (req, res) => {
  res.render("user/signup.ejs", { error: null, formData: {} });
};

const loadLoginPage = (req, res) => {
  const successMessage=req.session.successMessage||null;
  res.render("user/login.ejs", { error: null, formData: {},successMessage });
};

const signup = async (req, res) => {
  let name, email, password, confirmPassword;
  try {
    ({ name, email, password, confirmPassword } = req.body);

    const {hashedPassword} = await registerUser({ name, email, password, confirmPassword });
    req.session.tempUser={name,email,password:hashedPassword}
    console.log(req.session.tempUser)
    await createAndSendOtp({email,purpose:'signup'})

    res.redirect(`/user/verify-otp?email=${encodeURIComponent(email)}&purpose=signup`)
  } catch (error) {
    res.render("user/signup.ejs", {
      error: error.message,
      formData: { name, email },
    });
  }
};

const loadOtpPage=async(req,res)=>{
  const {email,purpose}=req.query;
  res.render('user/otp.ejs',{email,purpose,error:null})

   
}
const resendOtp=async(req,res)=>{
  const {email,purpose}=req.body;
  try{
    await resendOtpService({email,purpose});
    res.json({success:true});



  }catch(err){
    res.json({success:false,message:err.message})
  }
  
}

const verifyOtp=async(req,res)=>{

  const {email,otp,purpose}=req.body;

  try{
    await verifyOtpService({email,otp,purpose});
    if(purpose==='signup'){
      const tempUser=req.session.tempUser;
      if(!tempUser || tempUser.email!==email){
        return res.json({success:false,message:'signup expired,Please signup again'})
      }
      await createUser({
        name:tempUser.name,
        email:tempUser.email,
        password:tempUser.password,

      })
      delete req.session.tempUser;
      res.json({success:true});


    }
    await updateUserByEmail(email,{isVerified:true});
    res.json({success:true});


  }catch(err){
   res.json({success:false,message:err.message})

  }
}
  


const login = async (req, res) => {
  let email, password;
  const successMessage=req.session.successMessage||null;
  try {
    ({ email, password } = req.body);
    const user = await loginUser({ email, password });
    // req.session.userId = user._id;
    res.redirect("/");
  } catch (err) {
    res.render("user/login.ejs", { error: err.message, formData: { email },successMessage });
  }
};

const loadForgotPasswordPage=(req,res)=>{
  res.render('user/forgot-password.ejs',{error:null})

}

const forgotPassword=async (req,res)=>{
  const {email}=req.body
  try{
    await forgotPasswordService(email)
    req.session.resetEmail=email;
    res.redirect(`/user/verify-otp?email=${encodeURIComponent(email)}&purpose=forgot-password`);

  }
  catch(err){
  res.render('user/forgot-password.ejs', { error: err.message });
  }
}

const loadResetPasswordPage = (req, res) => {
  const email = req.session.resetEmail;
  

  if (!email) return res.redirect('/user/forgot-password');
  
  res.render('user/reset-password.ejs', { error: null, email }); // ← email passed here
};

const resetPassword=async(req,res)=>{
  const {email,password,confirmPassword}=req.body;
try{
  await resetPasswordService({email,password,confirmPassword});
  delete req.session.resetEmail;
  req.session.successMessage="Password reset successfully..Please login with your new password"
  res.redirect('/user/login');
}catch(err){
  res.render('user/reset-password.ejs',{error:err.message,email})

}
}

export default { loadSignupPage, loadLoginPage, signup, loadOtpPage,resendOtp,verifyOtp,login,loadForgotPasswordPage,forgotPassword,loadResetPasswordPage,resetPassword };
