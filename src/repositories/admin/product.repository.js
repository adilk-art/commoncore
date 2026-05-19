import Product from "../../models/product.model.js";

export const getAllProducts = async (limit, skip, filter, sortOrder) => {
  return await Product.aggregate([
    { $match: filter },

    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },

    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: "variants",
        localField: "_id",
        foreignField: "productId",
        as: "variants",
      },
    },

    {
      $addFields: {
        category: {
          name: "$category.name",
          fit: "$category.fit",
        },

        totalVariants: { $size: "$variants" },
        activeVariants: {
          $size: {
            $filter: {
              input: "$variants",
              as: "variant",
              cond: { $eq: ["$$variant.isActive", true] },
            },
          },
        },

        totalStock: {
          $sum: {
            $map: {
              input: "$variants",
              as: "v",
              in: "$$v.stock",
            },
          },
        },

        defaultImage: {
          $let: {
            vars: {
              firstVariant: { $arrayElemAt: ["$variants", 0] },
            },
            in: {
              $arrayElemAt: ["$$firstVariant.images.url", 0],
            },
          },
        },
      },
    },

    { $sort: sortOrder },
    { $skip: skip },
    { $limit: limit },
  ]);
};

export const createProduct = async (data) => {
  return await Product.create(data);
};

export const countProducts = async (filter) => {
  return await Product.countDocuments(filter);
};

export const findProductByCategoryId = async (categoryId) => {
  return await Product.find({ categoryId });
};
export const getProductById = async (id) => {
  return await Product.findById(id).populate("categoryId");
};

export const updateProductById = (id, data) => {
  return Product.findByIdAndUpdate(id, data);
};

export const getTotalProductsCount = async () => {
  return await Product.countDocuments();
};
export const getActiveProductsCount = async () => {
  return await Product.countDocuments({ isActive: true });
};
export const getHiddenProductsCount = async () => {
  return await Product.countDocuments({ isActive: false });
};
