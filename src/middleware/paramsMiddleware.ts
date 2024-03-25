import { type RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import { APIError } from "../lib/error";
import HttpStatusCode from "../enum/httpStatusCode";

const checkId: RequestHandler = (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      throw new APIError(
        "Invalid Id",
        HttpStatusCode.BAD_REQUEST,
        "Invalid Id",
        true
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

export { checkId };
