import bcrypt from "bcrypt";
import { emailSchema,signupSchema, loginSchema,resetPasswordSchema } from "../validators/user.validation.js";
import { createAndSendOtp } from "./otp.service.js";

import {createUser,findUserByEmail, updateUserByEmail} from "../repositories/user.repository.js";

export const prepareSignup = async ({ name, email, password, confirmPassword }) => {

  const validate = signupSchema.safeParse({ name, email, password, confirmPassword });

  if (!validate.success) {
    const errors = {};

    validate.error.issues.forEach(err => {
      const field = err.path[0];
      errors[field] = err.message;
    });

    throw { errors };
  }

  const existing = await findUserByEmail(email);

  if (existing) {
    if(!existing.password){}
    throw {
      errors: {
        email: "An account with this email already exists"
      }
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  return { name, email, password:hashedPassword };
};

export const registerUser = async ({name,email,password,confirmPassword,}) => {        //registeruser
  const validate = signupSchema.safeParse({ name,email,password,confirmPassword});
  if (!validate.success) {
  const errors = {};

  validate.error.issues.forEach(err => {
    const field = err.path[0];
    errors[field] = err.message;
  });

  throw { errors }; // error object for frontend 
}
  const existing = await findUserByEmail(email);
  if (existing) throw {
    errors: {
      email: "An account with this email already exists"
    }
  };
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return{name,email,hashedPassword}
};

export const loginUser = async ({ email, password }) => {
  const validate = loginSchema.safeParse({ email, password });
  if (!validate.success) {
    const firstError = validate.error.issues[0].message;

    throw new Error(firstError);
  }
  const user = await findUserByEmail(email);
  if (!user) throw new Error("Invalid email or password");
  if (user.isBlocked) throw new Error("Your acoount has been blocked by admin");
  if (!user.password) throw new Error('This account uses Google sign in. Please sign in with Google');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid email or password");
  return user;
};


export const forgotPasswordService=async(email)=>{
  const result=emailSchema.safeParse(email);
  if(!result.success){
    throw new Error(result.error.issues[0]?.message)
  }
 

  const user=await findUserByEmail(email);
  if(!user){ 
    throw new Error('No account found with this email'); 
}

if(!user.password){
  throw new Error('This account uses google sign-in')
} 

return true;
}

export const resetPasswordService=async({email,password,confirmPassword})=>{
  const result=resetPasswordSchema.safeParse({password,confirmPassword});
  if(!result.success){
    const firstError=result.error.issues[0]?.message;
    throw new Error(firstError)
  }
  const saltRounds=10
  const hashedPassword=await bcrypt.hash(password,saltRounds)
  await updateUserByEmail(email,{password:hashedPassword}); 

}
