import Product from "../../models/product.model.js";
import Variant from "../../models/variant.model.js";
import Category from "../../models/category.model.js";


export const findInventoryProducts = async (
  limit,
  skip,
  filter,
  sortOrder,
  stockFilter,
) => {
  return await Product.aggregate([
    {
      $match: filter,
    },

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
        totalVariants: {
          $size: "$variants",
        },

        totalStock: {
          $sum: "$variants.stock",
        },

        lowStockVariants: {
          $size: {
            $filter: {
              input: "$variants",
              as: "variant",
              cond: {
                $and: [
                  {
                    $gt: ["$$variant.stock", 0],
                  },
                  {
                    $lte: ["$$variant.stock", 5],
                  },
                ],
              },
            },
          },
        },

        outOfStockVariants: {
          $size: {
            $filter: {
              input: "$variants",
              as: "variant",
              cond: {
                $eq: ["$$variant.stock", 0],
              },
            },
          },
        },

        defaultImage: {
          $let: {
            vars: {
              firstVariant: {
                $arrayElemAt: ["$variants", 0],
              },
            },

            in: {
              $arrayElemAt: [
                "$$firstVariant.images.url",
                0,
              ],
            },
          },
        },
      },
    },

    ...(stockFilter
      ? [
          {
            $match:
              stockFilter === "out"
                ? {
                    totalStock: 0,
                  }
                : stockFilter === "low"
                ? {
                    totalStock: {
                      $gt: 0,
                      $lte: 10,
                    },
                  }
                : {
                    totalStock: {
                      $gt: 10,
                    },
                  },
          },
        ]
      : []),

    {
      $sort: sortOrder,
    },

    {
      $skip: skip,
    },

    {
      $limit: limit,
    },
  ]);
};

export const countInventoryProducts = async (filter) => {
  return await Product.countDocuments(filter);
};

export const getInventoryStats = async () => {
  const [
    totalProducts,
    totalVariants,
    lowStockVariants,
    outOfStockVariants,
  ] = await Promise.all([
    Product.countDocuments(),

    Variant.countDocuments(),

    Variant.countDocuments({
      stock: {
        $gt: 0,
        $lte: 5,
      },
    }),

    Variant.countDocuments({
      stock: 0,
    }),
  ]);

  return {
    totalProducts,
    totalVariants,
    lowStockVariants,
    outOfStockVariants,
  };
};

export const findVariantsByProductId = async (productId) => {
  return await Variant.find({
    productId,
  }).sort({ createdAt: -1 });
};

export const findVariantById = async (variantId) => {
  return await Variant.findById(variantId);
};

export const saveVariant = async (variant) => {
  return await variant.save();
};

export const findAllCategories = async () => {
  return await Category.find({
    isActive: true,
  }).sort({
    name: 1,
  });
};