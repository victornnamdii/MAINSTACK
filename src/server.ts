import express, { Request, Response } from "express";
import env from "./config/env";
import { connectToDB } from "./config/db";
import authRouter from "./routes/userRouter";
import categoryRouter from "./routes/categoryRouter";
import brandRouter from "./routes/brandRouter";
import productRouter from "./routes/productRouter";
import { errorRequestHandler, pageNotFoundHandler } from "./middleware/errorMiddleware";


const app = express();
const PORT = env.PORT;

app.use(express.json());

connectToDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Server up and running");
    });
  });

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Product Manager");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/brands", brandRouter);
app.use("/api/v1/products", productRouter);

app.use(pageNotFoundHandler);
app.use(errorRequestHandler);

export default app;