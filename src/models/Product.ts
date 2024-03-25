import mongoose from "mongoose";
import errorHandler from "../lib/errorHandler";
import variantValidator from "../lib/productVariantValidator";

interface IProductVariant {
  image: string;
  attribute: string;
  options: string[];
  price: number;
  quantity: { [keys: string]: [number] };
}

interface IProduct {
  name: string;
  description: string;
  variants: IProductVariant[];
  categoryId: mongoose.Schema.Types.ObjectId;
  brandId: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productVariant = new mongoose.Schema<IProductVariant>({
  image: {
    type: String,
    required: [true, "Please select an image for all product variants"],
  },
  price: {
    type: Number,
    required: [true, "Please enter the product's price"],
  },
  attribute: {
    type: String,
    trim: true,
    maxLength: [50, "Attribute value is too long"],
    required: true,
  },
  options: {
    type: [String],
    required: [true, "Please enter the options for all product variants"],
    default: undefined,
  },
  quantity: {
    required: [true, "Please enter the quantities for all product variants"],
    type: mongoose.Schema.Types.Mixed,
  },
});

const productSchema = new mongoose.Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Please enter the product's name"],
      unique: true,
      trim: true,
      maxLength: [255, "Name is too long"],
    },
    description: {
      type: String,
      required: [true, "Please enter the product description"],
      trim: true,
      maxLength: [500, "Description is too long"],
    },
    variants: {
      type: [productVariant],
      required: [true, "Please enter the product variants"],
      default: undefined,
      validate: variantValidator,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please select the product's category"],
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please enter the product's brand"],
    },
  },
  {
    timestamps: true, // Add timestamps option
  }
);

productSchema.pre("save", function (next) {
  const words = this.name.trim().split(" ");
  let formattedName = "";
  words.forEach((word) => {
    formattedName += `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`;
    if (words.indexOf(word) !== words.length - 1) {
      formattedName += " ";
    }
  });
  this.name = formattedName;

  next();
});

productSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate() as {
    name: string | undefined;
  };

  if (update?.name) {
    const words = update.name.trim().split(" ");
    let formattedName = "";
    words.forEach((word) => {
      formattedName += `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`;
      if (words.indexOf(word) !== words.length - 1) {
        formattedName += " ";
      }
    });
    update.name = formattedName;
  }
});

productSchema.post("save", errorHandler);
productSchema.post("updateOne", errorHandler);
productSchema.post("findOneAndDelete", errorHandler);
productSchema.post("findOneAndUpdate", errorHandler);

productSchema.index({ "variants._id": 1 });
productSchema.index({ "variants.price": 1 });
productSchema.index({ "variants.options": 1 });


const Product = mongoose.model<IProduct>("Product", productSchema);

export { Product, IProduct, IProductVariant };
