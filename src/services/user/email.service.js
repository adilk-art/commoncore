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
    from: `"Common Core" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP code",
    html: `
      <h2>Your OTP for ${purpose} is: <strong>${otp}</strong></h2>
      <p>This code expires in 15 minutes.</p>
    `,
  });
};

export const sendContactEmail = async ({
  name,
  email,
  subject,
  message,
}) => {
  await transporter.sendMail({
    from: `"Common Core Contact" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    replyTo: email,
    subject: `Contact Form: ${subject}`,
    html: `
      <h2>New Contact Message</h2>

      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>

      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  });
};
