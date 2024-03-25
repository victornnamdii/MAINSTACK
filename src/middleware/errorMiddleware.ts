import { ErrorRequestHandler, RequestHandler } from "express";

const errorRequestHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      error: "Invalid JSON syntax",
    });
  }

  if (err.isOperational) {
    return res.status(err.httpCode).json({ error: err.description });
  }

  console.log(err);
  res.status(500).json({ error: "Internal Server Error" });
};

const pageNotFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: "Resource not found",
  });
};

export { errorRequestHandler, pageNotFoundHandler };
