import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOtpEmail = async ({ email, otp, purpose }) => {

  await transporter.sendMail({
    from: `"Common Core" ${process.env.EMAIL_USER}`,
    to: email,
    subject: "Your OTP code",
    html: `
      <h2>Your OTP for ${purpose} is: <strong>${otp}</strong></h2>
      <p>This code expires in 1 minutes.</p>
    `,
  });
};
