import { type RequestHandler } from "express";
import jwt, {
  JsonWebTokenError,
  NotBeforeError,
  TokenExpiredError,
} from "jsonwebtoken";
import env from "../config/env";

const { SECRET_KEY } = env;

const verifyToken: RequestHandler = (req, res, next) => {
  try {
    const authorization = req.header("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied" });
    }

    const user = jwt.verify(authorization.slice(7), SECRET_KEY) as {
      id: string;
    };
    req.user = user;

    next();
  } catch (error) {
    if (
      error instanceof JsonWebTokenError ||
      error instanceof NotBeforeError ||
      error instanceof TokenExpiredError
    ) {
      return res.status(401).json({ error: "Access denied" });
    }
    next(error);
  }
};

export { verifyToken };
