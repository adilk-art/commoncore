import {
  createAddress,
  getUserAddresses,
  updateAddressById,
  deleteAddressById,
  clearDefault,
} from "../../repositories/address.repository.js";

import { addressSchema } from "../../validators/address.validation.js";

export const addAddressService = async (userId, body) => {
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0].message);
  }

  const data = parsed.data;

  const isDefault = data.isDefault === "on" || data.isDefault === true;

  if (isDefault) {
    await clearDefault(userId);
  }

  return await createAddress({
    ...data,
    isDefault,
    userId,
  });
};

export const getAddressesService = (userId) => {
  return getUserAddresses(userId);
};

export const updateAddressService = async (id, userId, body) => {
  
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0].message);
  }

  const data = parsed.data;

  const isDefault = data.isDefault === "on" || data.isDefault === true;

  if (isDefault) {
    await clearDefault(userId);
  }

  return await updateAddressById(id, {
    ...data,
    isDefault,
  });
};

export const deleteAddressService = (id) => deleteAddressById(id);

export const setDefaultAddressService = async (id, userId) => {
  await clearDefault(userId);
  return await updateAddressById(id, { isDefault: true });
};
