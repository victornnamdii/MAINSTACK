import { Request, Response, NextFunction } from "express";
import Category from "../models/Category";
import { IProduct, Product } from "../models/Product";
import pipelineBuilder from "../lib/productPipelineBuilder";
import { HydratedDocument } from "mongoose";
import { dbConnection } from "../config/db";

const PAGE_SIZE = 20;

class CategoryController {
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, parentCategoryId } = req.body;

      let parentPath;

      if (parentCategoryId) {
        const parent = await Category.findById(parentCategoryId);
        if (parent === null) {
          return res.status(400).json({
            message: `${parentCategoryId} does not belong to any category`,
          });
        }
        parentPath = parent.parentPath;
      }

      const category = await Category.create({ name, parentPath });

      res.status(201).json({
        message: `${name} category successfully added`,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { include } = req.query;

      let category;

      if (include === "products") {
        const aggregation = await Category.aggregate([
          {
            $lookup: {
              from: "products",
              localField: "_id",
              foreignField: "categoryId",
              as: "category_products",
              pipeline: [{ $sort: { createdAt: 1 } }, { $limit: 5 }],
            },
          },
          { $match: { parentPath: { $regex: id } } },
        ]);

        if (!aggregation[0]) {
          return next();
        }

        for (
          let index = 1;
          index < aggregation.length &&
          aggregation[0].category_products.length < 5;
          index++
        ) {
          const value = aggregation[index];
          aggregation[0].category_products =
            aggregation[0].category_products.concat(value.category_products);
        }

        if (aggregation[0].category_products.length > 5) {
          aggregation[0].category_products =
            aggregation[0].category_products.slice(0, 5);
        }

        category = aggregation[0];
      } else {
        category = await Category.findById(id);
        if (category === null) {
          return next();
        }
      }

      res.status(200).json({ data: category });
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const pageParam = req.query.page as string;
      let page = Number.parseInt(pageParam, 10);
      if (isNaN(page) || page <= 0) {
        page = 1;
      }

      const skip = (page - 1) * PAGE_SIZE;
      const query = {};

      const aggregation = await Category.aggregate([
        {
          $match: query,
        },
        {
          $facet: {
            metadata: [{ $count: "totalCategories" }],
            categories: [
              {
                $sort: { name: 1 },
              },
              {
                $skip: skip,
              },
              {
                $limit: PAGE_SIZE,
              },
            ],
          },
        },
      ]);

      const totalCategories = aggregation[0].metadata[0]?.totalCategories || 0;
      const totalPages = Math.ceil(totalCategories / PAGE_SIZE);

      res.status(200).json({
        metadata: {
          totalCategories,
          page,
          pageSize: aggregation[0].categories.length,
          totalPages,
          previous:
            page === 1 || totalPages === 0
              ? null
              : page > totalPages
                ? totalPages
                : page - 1,
          next: page < totalPages && totalPages !== 0 ? page + 1 : null,
        },
        data: aggregation[0].categories,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategoryProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const pageParam = req.query.page as string;
      const { id } = req.params;
      let page = Number.parseInt(pageParam, 10);
      if (isNaN(page) || page <= 0) {
        page = 1;
      }

      const aggregation = await Category.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "categoryId",
            as: "category_products",
            pipeline: pipelineBuilder(page, req.query as { [keys: string]: string }),
          },
        },
        {
          $match: { parentPath: { $regex: id } },
        },
      ]);

      if (!aggregation[0]) {
        return next();
      }

      let allProducts: HydratedDocument<IProduct>[] = [];
      aggregation.forEach((aggregation) => {
        allProducts = allProducts.concat(
          aggregation.category_products[0].products
        );
      });
      allProducts.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
      allProducts = allProducts.slice(0, 20);

      let totalProducts = 0;
      aggregation.forEach((aggregation) => {
        totalProducts +=
          aggregation.category_products?.[0].metadata?.[0]?.totalProducts || 0;
      });

      const totalPages = Math.ceil(totalProducts / PAGE_SIZE);

      res.status(200).json({
        metadata: {
          totalProducts,
          categoryName: aggregation[0].name,
          page,
          pageSize: allProducts.length,
          totalPages,
          previous:
            page === 1 || totalPages === 0
              ? null
              : page > totalPages
                ? totalPages
                : page - 1,
          next: page < totalPages && totalPages !== 0 ? page + 1 : null,
        },
        data: allProducts,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, parentCategoryId } = req.body;

      const category = await Category.findByIdAndUpdate(
        id,
        {
          name,
          parentCategoryId,
        },
        { new: true }
      );

      if (category === null) {
        return next();
      }

      res.status(201).json({
        message: `${name} category successfully updated`,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { include } = req.query;

      let session;
      try {
        session = await dbConnection.startSession();
        session.startTransaction();

        const category = await Category.findByIdAndDelete(id);
        if (category === null) {
          await session.commitTransaction();
          await session.endSession();
          return next();
        }

        if (include === "products") {
          await Product.deleteMany({ categoryId: id });
        } else {
          await Product.updateMany({ categoryId: id }, { categoryId: null });
        }

        res
          .status(200)
          .json({ message: `${category.name} category successfully deleted` });
        
        await session.commitTransaction();
        await session.endSession();
      } catch (error) {
        if (session) {
          await session.abortTransaction();
        }
        next(error);
      }
    } catch (error) {
      next(error);
    }
  }
}

export default CategoryController;
