import { getFeaturedProducts } from "../../repositories/home.repository.js";

export const getFeaturedProductsService = async () => {
  const products = await getFeaturedProducts(4);
 
  return products.map((product) => ({
    _id: product._id,
    name: product.name,
    basePrice: product.basePrice,
    defaultImage: product.images?.[0] ?? null,
    categoryId: product.categoryId,
  }));
};