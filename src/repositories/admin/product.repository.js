import Product from "../../models/product.model.js"


export const getAllProducts=async()=>{
    return await Product.find().populate("categoryId")
}

export const createProduct=async(data)=>{
    return await Product.create(data)
};

