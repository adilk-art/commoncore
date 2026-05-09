import User from "../models/user.model.js";

export const createUser = async (userData) => {
  const user = new User(userData);
  const savedUser = await user.save();
  return savedUser;
};

export const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};
export const findUserById = async (id) => {
  return await User.findById(id);
};

export const updateUserByEmail = async (email, updateData) => {
  return await User.findOneAndUpdate(
    { email },
    { $set: updateData },
    { new: true },
  );
};

export const updateUserById = async (userId, data) => {
  return await User.findByIdAndUpdate(userId, data, { new: true });
};

export const findUserByGoogleId = async (googleId) => {
  return await User.findOne({ googleId });
};


export const saveUser = (user) => {
  return user.save();
};