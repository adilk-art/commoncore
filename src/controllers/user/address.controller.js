
import {
  addAddressService,
  getAddressesService,
  deleteAddressService,
  setDefaultAddressService,
  updateAddressService,
} from "../../services/user/address.service.js";

const getAddressPage = async (req, res, next) => {
  try {
    const addresses = await getAddressesService(req.session.userId);
    res.render("user/address", { addresses });
  } catch (err) {
    next(err);
  }
};

const addAddress = async (req, res, next) => {
  try {
    await addAddressService(req.session.userId, req.body);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const deleteAddress = async (req, res, next) => {
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

const updateAddress = async (req, res, next) => {
  try {
    await updateAddressService(
      req.params.id,
      req.session.userId,
      req.body
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

export default {
  getAddressPage,
  addAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
};

