
import generateOtp from "../utils/generateOtp.js";
import {saveOtp,findOtp,invalidateOtp,markOtpAsUsed} from "../repositories/otp.repository.js"
import { sendOtpEmail } from "./email.service.js";

export const createAndSendOtp=async({email,purpose})=>{
    await invalidateOtp({email,purpose})
    const otp=generateOtp();
    const expiresAt=new Date(Date.now()+1*60*1000)   //1minutes
    await saveOtp({email,otp,purpose,expiresAt});

    await sendOtpEmail({email,otp,purpose})
}

export const verifyOtpService=async({email,otp,purpose})=>{
    const otpRecord=await findOtp({email,purpose});
    if(!otpRecord) throw new Error("OTP not found,please request a new one")
    if(new Date()>otpRecord.expiresAt) throw new Error("OTP is expired,request a new one")
    if(otpRecord.otp!==otp) throw new Error("Invalid OTP.Please try again")
    markOtpAsUsed(otpRecord._id); //marked as used 
    return true;
    }
export const resendOtpService=async({email,purpose})=>{
    await createAndSendOtp({email,purpose})
}
