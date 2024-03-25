import dotenv from "dotenv";

dotenv.config();

const env = {
  PORT: process.env.PORT as string,
  MONGO_URI: process.env.MONGO_URI as string,
  SECRET_KEY: process.env.SECRET_KEY as string
};

export default env;