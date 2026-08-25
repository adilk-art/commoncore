import { contactSchema } from "../../validators/contact.validation.js";
import { sendContactEmail } from "./email.service.js";

export const submitContactService = async (data) => {
  const validation = contactSchema.safeParse(data);

  if (!validation.success) {
    const error = new Error("Please check the entered details");

    error.status = 400;
    error.errors = validation.error.issues;

    throw error;
  }

  await sendContactEmail(validation.data);

  return {
    success: true,
    message: "Message sent successfully",
  };
};
