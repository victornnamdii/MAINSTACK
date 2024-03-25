import { ErrorHandlingMiddlewareFunction } from "mongoose";
import HttpStatusCode from "../enum/httpStatusCode";
import { APIError } from "./error";

interface MongoError {
  name: string;
  code: number;
  errors: MongoError[];
  message: string;
  keyValue: { name: string };
  kind: string;
  path: string;
  properties: { message: string };
  value: string;
}

// @ts-expect-error: MongoError
const errorHandler: ErrorHandlingMiddlewareFunction = (error: MongoError, doc, next) => {

  if (error.code === 11000) {
    next(
      new APIError(
        "Unique Parameter",
        HttpStatusCode.BAD_REQUEST,
        `${error.keyValue.name} already exists`,
        true
      )
    );
  } else if (error.message.includes("validation failed")) {
    const err = Object.values(error.errors)[0];

    if (err.name === "CastError") {
      if (err.kind === "ObjectId") {
        return next(
          new APIError(
            "Validation Error",
            HttpStatusCode.BAD_REQUEST,
            "Invalid Id: " + err.value,
            true
          )
        );
      }

      return next(
        new APIError(
          "Validation Error",
          HttpStatusCode.BAD_REQUEST,
          `Invalid format for ${err.path}`,
          true
        )
      );
    }

    next(
      new APIError(
        "Validation Error",
        HttpStatusCode.BAD_REQUEST,
        Object.values(error.errors)[0].properties.message,
        true
      )
    );
  } else if (error.name === "CastError") {
    next(
      new APIError(
        "Validation Error",
        HttpStatusCode.BAD_REQUEST,
        "Invalid Id: " + error.value,
        true
      )
    );
  }

  next(error);
};

export default errorHandler;
