import Product from "../../models/product.model.js"


export const getAllProducts=async(limit,skip,filter)=>{

    return await Product.find(filter).skip(skip).limit(limit).populate("categoryId")
}

export const createProduct=async(data)=>{
    return await Product.create(data)
};

export const countProducts=async()=>{
    return await Product.countDocuments()
}

export const findProductByCategoryId=async(categoryId)=>{
    return await Product.find({categoryId})
}
export const getProductById=async(id)=>{
    return await Product.findById(id) 
}
export const updateProductById = (id, data) => {
  return Product.findByIdAndUpdate(id, data);
};