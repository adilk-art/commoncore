// const signupInputValidator = ({ name, email, password, confirmPassword }) => {
//   if (password !== confirmPassword) throw new Error("Passwords do not match");

//   if (!name || name.trim().length < 3)
//     throw new Error("name must be atleast 3 characters");
//   if (!/^[A-Z][a-z]\s+$/.test(name))
//     throw new Error("Name can only contain letters");

//   if (!email) throw new Error("email is required");
// };
//implement with zod backend validation