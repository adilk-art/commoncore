import Category from "../models/category.model.js";
import Variant from "../models/variant.model.js";
import Product from "../models/product.model.js";

export const getShopProducts = async (
  filter,
  sort,
  skip,
  limit
) => {

  return await Product.aggregate([

    {
      $match: filter,
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
        activeVariants: {
          $filter: {
            input: "$variants",
            as: "variant",
            cond: {
              $eq: ["$$variant.isActive", true],
            },
          },
        },
      },
    },

    {
      $match: {
        "activeVariants.0": { $exists: true },
      },
    },

    {
      $addFields: {
        inStockVariants: {
          $filter: {
            input: "$activeVariants",
            as: "variant",
            cond: {
              $gt: ["$$variant.stock", 0],
            },
          },
        },
      },
    },

    {
      $addFields: {
        previewVariant: {
          $cond: {
            if: {
              $gt: [
                { $size: "$inStockVariants" },
                0,
              ],
            },
            then: {
              $arrayElemAt: [
                "$inStockVariants",
                0,
              ],
            },
            else: {
              $arrayElemAt: [
                "$activeVariants",
                0,
              ],
            },
          },
        },
      },
    },

    {
      $addFields: {
        defaultImage: {
          $arrayElemAt: [
            "$previewVariant.images.url",
            0,
          ],
        },

        inStock: {
          $gt: [
            { $size: "$inStockVariants" },
            0,
          ],
        },
      },
    },

    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "categoryId",
      },
    },

    {
  $unwind: "$categoryId",
    },

    {
      $match: {
        "categoryId.isActive": true,
      },
    },

    {
      $project: {
        variants: 0,
      },
    },

    {
      $sort: sort,
    },

    {
      $skip: skip,
    },

    {
      $limit: limit,
    },

  ]);

};

export const countShopProducts = async (filter) => {
  return await Product.countDocuments(filter);
};

export const getShopCategories = async () => {
  return await Category.find({ isActive: true }).sort({ name: 1 });
};


export const findProductDetail = async (productId) => {
  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  })
    .populate("categoryId")
    .lean();

  if (!product) return null;

  const variants = await Variant.find({
    productId: product._id,
    isActive: true,
  })
    .sort({
      isDefault: -1,
      createdAt: 1,
    })
    .lean();

  product.variants = variants;

  return product;
};


export const findRelatedProducts = async (categoryId, currentProductId) => {
  return await Product.aggregate([
    {
      $match: {
        categoryId: categoryId,
        isActive: true,
        _id: {
          $ne: currentProductId,
        },
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
        activeVariants: {
          $filter: {
            input: "$variants",
            as: "variant",
            cond: {
              $eq: ["$$variant.isActive", true],
            },
          },
        },
      },
    },

    {
      $match: {
        "activeVariants.0": {
          $exists: true,
        },
      },
    },

    {
      $addFields: {
        defaultImage: {
          $let: {
            vars: {
              firstVariant: {
                $arrayElemAt: ["$activeVariants", 0],
              },
            },

            in: {
              $arrayElemAt: ["$$firstVariant.images.url", 0],
            },
          },
        },
      },
    },

    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "categoryId",
      },
    },

    {
      $unwind: "$categoryId",
    },

    {
      $project: {
        variants: 0,
      },
    },

    {
      $limit: 4,
    },
  ]);
};

