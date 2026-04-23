import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt"

export const findAdminByEmail=async(email)=>{
    return await Admin.findOne({email})
}

export const getAllUsers = async ({ search, page, limit, sort }) => {
  const query = search
    ? { name: { $regex: `^${search}`, $options: "i" } }
    : {};

  const sortOption =
    sort === "oldest"
      ? { createdAt: 1 }
      : { createdAt: -1 };

  const users = await User.find(query)
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit);

  const totalUsers = await User.countDocuments(query);

  return {
    users,
    totalUsers,
    totalPages: Math.ceil(totalUsers / limit)
  };
};

export const blockUserToggle=async(userId)=>{
    const user=await User.findById(userId)
    user.isBlocked=!user.isBlocked;
    return await user.save()
}