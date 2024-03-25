import { Request, Response, NextFunction } from "express";
import { Product } from "../models/Product";
import pipelineBuilder from "../lib/productPipelineBuilder";

const PAGE_SIZE = 20;

class ProductController {
  static async addProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, variants, categoryId, brandId } = req.body;

      const product = await Product.create({
        name,
        description,
        variants,
        categoryId,
        brandId,
      });

      res.status(201).json({
        message: "Product successfully added",
        product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);
      if (product === null) {
        return next();
      }

      res.status(20).json({ data: product });
    } catch (error) {
      next(error);
    }
  }

  static async getProductVariant(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id, variantId } = req.params;

      const product = await Product.findOne(
        { _id: id, "variants._id": variantId },
        { name: 1, "variants.$": 1 }
      );
      if (product === null) {
        return next();
      }

      res.status(200).json({ data: product });
    } catch (error) {
      next(error);
    }
  }

  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const pageParam = req.query.page as string;
      let page = Number.parseInt(pageParam, 10);
      if (isNaN(page) || page <= 0) {
        page = 1;
      }

      const aggregation = await Product.aggregate(
        pipelineBuilder(page, req.query as { [keys: string]: string })
      );

      const totalProducts = aggregation[0].metadata[0]?.totalProducts || 0;
      const totalPages = Math.ceil(totalProducts / PAGE_SIZE);

      res.status(200).json({
        metadata: {
          totalProducts,
          page,
          pageSize: aggregation[0].products.length,
          totalPages,
          previous:
            page === 1 || totalPages === 0
              ? null
              : page > totalPages
                ? totalPages
                : page - 1,
          next: page < totalPages && totalPages !== 0 ? page + 1 : null,
        },
        data: aggregation[0].products,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, variants, categoryId, brandId } = req.body;

      const product = await Product.findByIdAndUpdate(
        id,
        {
          name,
          description,
          variants,
          categoryId,
          brandId,
        },
        { new: true }
      );
      if (product === null) {
        return next();
      }

      res.status(201).json({
        message: "Product successfully updated",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProductVariant(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id, variantId } = req.params;

      const { image, attribute, price, options, quantity } = req.body;

      const updates: {
        [keys: string]: [
          string | number | string[] | { [keys: string]: [number] }
        ];
      } = {};

      if (image) {
        updates["variants.$.image"] = image;
      }
      if (attribute) {
        updates["variants.$.attribute"] = attribute;
      }
      if (price) {
        updates["variants.$.price"] = price;
      }
      if (options) {
        updates["variants.$.options"] = options;
      }
      if (quantity) {
        updates["variants.$.quantity"] = quantity;
      }

      const product = await Product.findOneAndUpdate(
        { _id: id, "variants._id": variantId },
        { $set: updates },
        { new: true }
      );
      if (product === null) {
        return next();
      }

      res.status(201).json({
        message: "Product variant successfully updated",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const product = await Product.findByIdAndDelete(id);
      if (product === null) {
        return next();
      }

      res
        .status(200)
        .json({ message: `${product?.name} successfully deleted` });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProductVariant(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id, variantId } = req.params;

      const product = await Product.findOneAndUpdate(
        { _id: id, "variants._id": variantId },
        { $pull: { variants: { _id: variantId } } },
        { new: true }
      );
      if (product === null) {
        return next();
      }

      res.status(200).json({
        message: "Product successfully deleted",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ProductController;
