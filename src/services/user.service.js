import { updateUserById,findUserById } from "../repositories/user.repository.js";
import fs from "fs";
import path from "path"

export const updateProfileService=async(userId,body,file)=>{
    const {name,phone}=body;
    if(!name){
        throw new Error("Name is required")
    }
    if(phone && !/^[0-9]\d{9}$/.test(phone)){
        throw new Error("Invalid phone number")
    }

    const updateData={
        name,phone
    }
    if(file){
        const user=await findUserById(userId)
         if (user.profileImage && user.profileImage !== "/images/default.png") {
         const oldPath = path.join("public", user.profileImage);

      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
        updateData.profileImage="/uploads/"+file.filename;

    }
    return await updateUserById(userId,updateData)
}


