import {
  addAddressService,
  getAddressesService,
  deleteAddressService,
  setDefaultAddressService,
  updateAddressService,
} from "../services/address.service.js";

import { getAddressById } from "../repositories/address.repository.js";
import { success } from "zod";

const getAddressPage = async (req, res) => {
  const addresses = await getAddressesService(req.session.userId);
  res.render("user/address", { addresses });
};

const addAddress = async (req, res) => {
  try {
    await addAddressService(req.session.userId, req.body);
    res.redirect("/user/address");
  } catch (err) {
    res.render("user/address", { error: err.message, addresses: [] });
  }
};

const deleteAddress = async (req, res) => {
  try {
    await deleteAddressService(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

const setDefaultAddress = async (req, res, next) => {
  try {
    await setDefaultAddressService(req.params.id, req.session.userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

const getEditAddressPage = async (req, res) => {
  const address = await getAddressById(req.params.id);
  res.render("user/editAddress.ejs", { address });
};

const updateAddress = async (req, res, next) => {
  try {
    console.log(`${req.params.id} and ${req.session.userId} and ${req.body}`);
    await updateAddressService(req.params.id, req.session.userId, req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export default {
  getAddressPage,
  addAddress,
  deleteAddress,
  setDefaultAddress,
  getEditAddressPage,
  updateAddress,
};
