import { createProduct,getAllProducts,countProducts,findProductByCategoryId,getProductById,updateProductById } from "../../repositories/admin/product.repository.js";
import { productSchema } from "../../validators/product.validation.js";
import { getAllCategories } from "../../repositories/category.repository.js";


export const getAllProductsService=async(page,search)=>{
    const limit=5;
    const skip=limit*(page-1);
    const filter = search ? { name: { $regex: search, $options: "i" } } : {};
    const products= await getAllProducts(limit,skip,filter);
    const productCount=await countProducts();
    const totalPages=Math.ceil(productCount/limit);
    return {
        products,totalPages,productCount,skip,limit
    }
}

 export const getAllCategoriesService=async()=>{
    return await getAllCategories()
 }


export const addProductService=async(data)=>{
    data.name=data.name.trim().replace(/\s+/g," ")
    const validated=productSchema.safeParse(data);
    if(!validated.success){
        const err=new Error(validated.error.errors[0].message);
        err.status=400;
        throw err;
    }
    const {name,description,category,fit,material,washCare,isActive,basePrice}=validated.data;
    const normalizeName = (value) =>
    value.trim().toLowerCase().replace(/\s+/g, " ");

    const cleanName = normalizeName(name);

    const products = await findProductByCategoryId(category);

    const exists = products.some(
    (product) => normalizeName(product.name) === cleanName
    );

    if (exists) {
    const err = new Error("Product already exists in this category");
    err.status = 400;
    throw err;
    }

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

export const getProductByIdService=async(id)=>{
    return await getProductById(id)
}

export const editProductService = async (id, data) => {
  data.name = data.name.trim().replace(/\s+/g, " ");

  const validated = productSchema.safeParse(data);

  if (!validated.success) {
    const err = new Error(validated.error.errors[0].message);
    err.status = 400;
    throw err;
  }

  const {
    name,
    description,
    category,
    fit,
    material,
    washCare,
    isActive,
    basePrice,
  } = validated.data;

  const normalizeName = (value) =>
    value.trim().toLowerCase().replace(/\s+/g, " ");

  const cleanName = normalizeName(name);

  const products = await findProductByCategoryId(category);

  const exists = products.some(
    (product) =>
      product._id.toString() !== id &&
      normalizeName(product.name) === cleanName
  );

  if (exists) {
    const err = new Error("Product already exists in this category");
    err.status = 400;
    throw err;
  }

  await updateProductById(id, {
    name,
    description,
    fit,
    material,
    washCare,
    isActive: isActive === "true" || isActive === true,
    categoryId: category,
    basePrice,
  });
};
export const changeProductStatusService=async(id)=>{
    const product=await getProductById(id);
    if(!product){
        const err=new Error("Product not found");
        err.status=404;
        throw err;
    }
    const updatedStatus=!product.isActive;
    await updateProductById(id,{isActive:updatedStatus})
    return updatedStatus?"Product enabled successfully":"Product disabled successfully";
}