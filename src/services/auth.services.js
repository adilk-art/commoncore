import bcrypt from "bcrypt";

import { createUser } from "../repositories/user.repository.js";

export const registerUser = async ({ name, email, password }) => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const user = await createUser({
    name,
    email,
    password: hashedPassword,
  });

  return user;
};
