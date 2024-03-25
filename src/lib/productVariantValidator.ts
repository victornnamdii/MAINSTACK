import { IProductVariant } from "../models/Product";
import HttpStatusCode from "../enum/httpStatusCode";
import { APIError } from "./error";


const variantValidator = (variants: IProductVariant[]) => {
  const attributes: string[] = [];

  variants.forEach((variant) => {
    // Check for duplicate attribute value
    const attribute = variant.attribute.toLowerCase().trim();

    if (attributes.includes(attribute)) {
      throw new APIError(
        "Duplicate attribute",
        HttpStatusCode.BAD_REQUEST,
        `Duplicate attribute: ${variant.attribute}`
      );
    } else {
      attributes.push(attribute);
    }

    // Check if quantity is an object
    if (
      variant.quantity === null ||
      Array.isArray(variant.quantity) ||
      typeof variant.quantity !== "object"
    ) {
      throw new APIError(
        "Invalid options and Quantity",
        HttpStatusCode.BAD_REQUEST,
        "One or more product variants have an invalid option/quantity combination"
      );
    }

    // Remove duplicate variant options
    const options = Array.from(new Set(variant.options));

    // Check if quantity object contains all the variant options
    const quantityOptions = Object.keys(variant.quantity).map((option) =>
      option.toUpperCase()
    );
    if (
      quantityOptions.length !== options.length ||
      options.some(
        (option) => !quantityOptions.includes(option.toUpperCase())
      )
    ) {
      throw new APIError(
        "Invalid options and Quantity",
        HttpStatusCode.BAD_REQUEST,
        "One or more product variants have an invalid option/quantity combination"
      );
    }

    // Check if quantity object has only numbers as the value
    const quantityValues = Object.values(variant.quantity);
    if (quantityValues.some((value) => typeof value !== "number")) {
      throw new APIError(
        "Invalid quantity value",
        HttpStatusCode.BAD_REQUEST,
        "One or more product variants have an invalid quantity value"
      );
    }

    // Make all options UpperCase
    variant.options = quantityOptions;
    Object.entries(variant.quantity).forEach(([key, value]) => {
      delete variant.quantity[key];
      variant.quantity[key.toUpperCase()] = value;
    });
  });
};

export default variantValidator;
