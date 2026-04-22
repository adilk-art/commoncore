import Admin from "../models/admin.model.js";
import bcrypt from "bcrypt"

export const findAdminByEmail=async(email)=>{
    return await Admin.findOne({email})
}

