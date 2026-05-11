import { createProduct,getAllProducts } from "../../repositories/admin/product.repository.js";
import { productSchema } from "../../validators/product.validation.js";
import { getAllCategories } from "../../repositories/category.repository.js";


export const getAllProductsService=async()=>{
    return await getAllProducts()

}

 export const getAllCategoriesService=async()=>{
    return await getAllCategories()
 }


export const addProductService=async(data)=>{
    const validated=productSchema.safeParse(data);

    if(!validated.success){
        const err=new Error(validated.error.errors[0].message);
        err.status=400;
        throw err;
    }
    const {name,description,category,fit,material,washCare,isActive,basePrice}=validated.data;

    await createProduct({
        name,
        description,
        fit,
        material,
        isActive:isActive==="true"||isActive===true,
        washCare,
        categoryId:category,
        basePrice
    })
}