import mongoose from "mongoose";
import errorHandler from "../lib/errorHandler";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter the brand's name"],
      unique: true,
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true, // Add timestamps option
  }
);

brandSchema.post("save", errorHandler);
brandSchema.post("updateOne", errorHandler);
brandSchema.post("findOneAndDelete", errorHandler);
brandSchema.post("findOneAndUpdate", errorHandler);

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;
