import mongoose from "mongoose";
import errorHandler from "../lib/errorHandler";
import { APIError } from "../lib/error";
import HttpStatusCode from "../enum/httpStatusCode";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter the category name"],
      unique: true,
      trim: true,
    },
    parentPath: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true, // Add timestamps option
  }
);

categorySchema.pre("save", function (next) {
  this.name = `${this.name[0].toUpperCase()}${this.name
    .slice(1)
    .toLowerCase()}`;


  if (this.parentPath) {
    this.parentPath += this.id + "/";
  } else {
    this.parentPath = this.id + "/";
  }

  next();
});

categorySchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as {
    name: string | undefined;
    parentCategoryId: string | undefined;
    parentPath: string | undefined;
  };
  if (update?.name) {
    update.name = `${update.name[0].toUpperCase()}${update.name
      .slice(1)
      .toLowerCase()}`;
  }

  if (update.parentCategoryId) {
    const parent = await this.model.findById(update.parentCategoryId);
    if (parent === null) {
      throw new APIError(
        "Invalid Parent Category Id",
        HttpStatusCode.BAD_REQUEST,
        `${update.parentCategoryId} does not belong to any category`,
        true
      );
    }

    const child = await this.model.findOne(this.getQuery());

    update.parentPath = parent.parentPath + child._id.toString() + "/";
  }
});

categorySchema.post("save", errorHandler);
categorySchema.post("updateOne", errorHandler);
categorySchema.post("findOneAndDelete", errorHandler);
categorySchema.post("findOneAndUpdate", errorHandler);

const Category = mongoose.model("Category", categorySchema);

export default Category;
