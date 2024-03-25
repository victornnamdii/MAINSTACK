import mongoose from "mongoose";
import env from "./env";

const connectToDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("MongoDB is Connected...");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

const dbConnection = mongoose.connection;

export { connectToDB, dbConnection };