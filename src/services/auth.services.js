import bcrypt from "bcrypt";
import { signupSchema,loginSchema } from "../validators/user.validate.js";

import {
  createUser,
  findUserByEmail,
} from "../repositories/user.repository.js";

export const registerUser = async ({
  name,
  email,
  password,
  confirmPassword,
}) => {
  console.log('data:', { name, email, password, confirmPassword });
  const validate = signupSchema.safeParse({
    name,
    email,
    password,
    confirmPassword,
  });
  if (!validate.success) {
    const firstError=validate.error.issues[0].message;
    throw new Error(firstError);

}
  const existing = await findUserByEmail(email);
  if (existing) throw new Error("An account with this email already exists");
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const user = await createUser({
    name,
    email,
    password: hashedPassword,
  });

  return user;
};

export const loginUser = async ({ email, password }) => {
  const validate=loginSchema.safeParse({email,password});
  if(!validate.success){
    const firstError=validate.error.issues[0].message;
  
    throw new Error(firstError);
  }
  const user = await findUserByEmail(email);
  if (!user) throw new Error("Invalid email or password");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid email or password");
  return user;
};
