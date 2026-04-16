import {
  addAddressService,
  getAddressesService,
  deleteAddressService,
  setDefaultAddressService,
  updateAddressService
} from "../services/address.service.js";

import { getAddressById } from "../repositories/address.repository.js";


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
  await deleteAddressService(req.params.id);
  res.redirect("/user/address");
};

const setDefaultAddress = async (req, res) => {
  await setDefaultAddressService(req.params.id, req.session.userId);
  res.redirect("/user/address");
};


const getEditAddressPage = async (req, res) => {
  const address = await getAddressById(req.params.id);
  res.render("user/editAddress.ejs", { address });
};

const updateAddress = async (req, res) => {
  try {
    await updateAddressService(
      req.params.id,
      req.session.userId,
      req.body
    );
    res.redirect("/user/address");
  } catch (err) {
    res.render("user/editAddress", {
      error: err.message,
      address: req.body
    });
  }
};

export default {getAddressPage,addAddress,deleteAddress,setDefaultAddress,getEditAddressPage,updateAddress}