

export const generateReferralCode = (name = "USER") => {
  const cleanName = String(name)
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 5);

  const randomPart = Math.random()
    .toString(36)
    .substring(2, 7)
    .toUpperCase();

  return `${cleanName || "USER"}${randomPart}`;
};