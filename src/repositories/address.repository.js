import Address from "../models/address.model.js"

export const createAddress=(data)=>{
    Address.create(data)
}

export const getUserAddresses=(userId)=>{
    return Address.find({userId}).sort({createdAt:-1});
}

export const getAddressById=(id)=>Address.findById(id);

export const updateAddressById=(id,data)=>{
    return Address.findByIdAndUpdate(id,data,{new:true});
}

export const deleteAddressById=(id)=>Address.findByIdAndDelete(id);

export const clearDefault=(userId)=>{
    return Address.updateMany({userId},{isDefault:false});}
    
