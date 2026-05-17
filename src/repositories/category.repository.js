import Category from "../models/category.model.js";

export const createCategory = async (data) => {
  return await Category.create(data);
};

export const findCategoryByName = async (name) => {
  return await Category.findOne({
    name: { $regex: `^${name}$`, $options: "i" },
  });
};

export const getAllCategories = async () => {
  return await Category.find().sort({ createdAt: -1 });
};



export const getPaginatedCategories = async (filter, skip, limit, sortOrder) => {
  return await Category.aggregate([
    { $match: filter },

    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "categoryId",
        as: "products"
      }
    },

    {
      $addFields: {
        productCount: { $size: "$products" }
      }
    },

    { $sort: { createdAt: sortOrder } },
    { $skip: skip },
    { $limit: limit }
  ]);
};

export const getCategoryCount = async (filter={}) => {
  return await Category.countDocuments(filter);
};

export const updateCategoryById = async (id, data) => {

  return Category.findByIdAndUpdate(
    id,
    data,
    { returnDocument: "after" }
  );
};

export const getCategoriesExceptCurrent=async(id,name)=>{
  return await Category.findOne({_id:{$ne:id},name:new RegExp(`^${name}$`,"i")});
}
export const getTotalCategoryCount = async () => {
  return await Category.countDocuments();
};

export const getActiveCategoryCount = async () => {
  return await Category.countDocuments({ isActive: true });
};

export const getHiddenCategoryCount = async () => {
  return await Category.countDocuments({ isActive: false });
};
