import { type RequestHandler } from "express";
import jwt, {
  JsonWebTokenError,
  NotBeforeError,
  TokenExpiredError,
} from "jsonwebtoken";
import env from "../config/env";
import User from "../models/User";

const { SECRET_KEY } = env;

const verifyToken: RequestHandler = async (req, res, next) => {
  try {
    const authorization = req.header("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied" });
    }

    const decoded = jwt.verify(authorization.slice(7), SECRET_KEY) as {
      id: string;
    };

    const user = await User.findById(decoded.id);
    if (user === null) {
      return res.status(401).json({ error: "Access denied" });
    }

    req.user = { id: user.id };

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
