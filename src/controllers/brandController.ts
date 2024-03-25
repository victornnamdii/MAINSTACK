import { Request, Response, NextFunction } from "express";
import Brand from "../models/Brand";
import { Product } from "../models/Product";
import { dbConnection } from "../config/db";
import mongoose from "mongoose";
import pipelineBuilder from "../lib/productPipelineBuilder";

const PAGE_SIZE = 20;

class BrandController {
  static async createBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;

      const brand = await Brand.create({ name });

      res.status(201).json({
        message: `${name} brand successfully added`,
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBrands(req: Request, res: Response, next: NextFunction) {
    try {
      const pageParam = req.query.page as string;
      let page = Number.parseInt(pageParam, 10);
      if (isNaN(page) || page <= 0) {
        page = 1;
      }

      const skip = (page - 1) * PAGE_SIZE;
      const query = {};

      const aggregation = await Brand.aggregate([
        {
          $match: query,
        },
        {
          $facet: {
            metadata: [{ $count: "totalBrands" }],
            brands: [
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

      const totalBrands = aggregation[0].metadata[0]?.totalBrands || 0;
      const totalPages = Math.ceil(totalBrands / PAGE_SIZE);

      res.status(200).json({
        metadata: {
          totalBrands,
          page,
          pageSize: aggregation[0].brands.length,
          totalPages,
          previous:
            page === 1 || totalPages === 0
              ? null
              : page > totalPages
                ? totalPages
                : page - 1,
          next: page < totalPages && totalPages !== 0 ? page + 1 : null,
        },
        data: aggregation[0].brands,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { include } = req.query;

      let brand;

      if (include === "products") {
        const aggregation = await Brand.aggregate([
          {
            $lookup: {
              from: "products",
              localField: "_id",
              foreignField: "brandId",
              as: "brand_products",
              pipeline: [{ $sort: { createdAt: 1 } }, { $limit: 5 }],
            },
          },
          { $match: { _id: new mongoose.Types.ObjectId(id) } },
        ]);

        if (!aggregation[0]) {
          return next();
        }

        brand = aggregation[0];
      } else {
        brand = await Brand.findById(id);
        if (brand === null) {
          return next();
        }
      }

      res.status(200).json({ data: brand });
    } catch (error) {
      next(error);
    }
  }

  static async getBrandProducts(
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

      const aggregation = await Brand.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "brandId",
            as: "brand_products",
            pipeline: pipelineBuilder(page, req.query as { [keys: string]: string }),
          },
        },
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
      ]);

      if (!aggregation[0]) {
        return next();
      }

      const totalProducts =
        aggregation[0].brand_products[0].metadata[0]?.totalProducts || 0;
      const totalPages = Math.ceil(totalProducts / PAGE_SIZE);

      res.status(200).json({
        metadata: {
          totalProducts,
          brandName: aggregation[0].name,
          page,
          pageSize: aggregation[0].brand_products[0].products.length,
          totalPages,
          previous:
            page === 1 || totalPages === 0
              ? null
              : page > totalPages
                ? totalPages
                : page - 1,
          next: page < totalPages && totalPages !== 0 ? page + 1 : null,
        },
        data: aggregation[0].brand_products[0].products,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const brand = await Brand.findByIdAndUpdate(id, { name }, { new: true });
      if (brand === null) {
        return next();
      }

      res.status(201).json({
        message: `${name} brand successfully updated`,
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { include } = req.query;

      let session;
      try {
        session = await dbConnection.startSession();
        session.startTransaction();

        const brand = await Brand.findByIdAndDelete(id);
        if (brand === null) {
          await session.commitTransaction();
          await session.endSession();
          return next();
        }

        if (include === "products") {
          await Product.deleteMany({ brandId: id });
        } else {
          await Product.updateMany({ brandId: id }, { brandId: null });
        }

        res
          .status(200)
          .json({ message: `${brand.name} brand successfully deleted` });
        
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

export default BrandController;
