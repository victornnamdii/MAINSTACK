import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { APIError } from "../lib/error";
import { isEmail, isAlpha } from "validator";
import HttpStatusCode from "../enum/httpStatusCode";
import env from "../config/env";
import errorHandler from "../lib/errorHandler";

const SECRET_KEY = env.SECRET_KEY;

interface IUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface UserModel extends mongoose.Model<IUser> {
  login(email: string, password: string): Promise<string>;
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please enter your email"],
      lowercase: true,
      trim: true,
      validate: [isEmail, "Please enter a valid email"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please enter a password"],
    },
    firstName: {
      type: String,
      required: [true, "Please enter your first name"],
      validate: [isAlpha, "First name should only contain alphabetic characters"],
    },
    lastName: {
      type: String,
      required: [true, "Please enter your last name"],
      validate: [isAlpha, "Last name should only contain alphabetic characters"],
    },
  },
  {
    timestamps: true, // Add timestamps option
  }
);

userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as IUser;
  if (update?.password) {
    const salt = await bcrypt.genSalt(10);
    update.password = await bcrypt.hash(update.password.toString(), salt);
  }
  if (update?.email) {
    if (!isEmail(update.email)) {
      throw new APIError(
        "Invalid Email",
        HttpStatusCode.BAD_REQUEST,
        "Please enter a valid email",
        true
      );
    }
  }
  if (update?.firstName) {
    if (!isAlpha(update.firstName)) {
      throw new APIError(
        "Invalid Name",
        HttpStatusCode.BAD_REQUEST,
        "First name should only contain alphabetic characters",
        true
      );
    }
  }
  if (update?.lastName) {
    if (!isAlpha(update.lastName)) {
      throw new APIError(
        "Invalid Name",
        HttpStatusCode.BAD_REQUEST,
        "Last name should only contain alphabetic characters",
        true
      );
    }
  }
});

userSchema.post("save", errorHandler);
userSchema.post("updateOne", errorHandler);
userSchema.post("findOneAndDelete", errorHandler);
userSchema.post("findOneAndUpdate", errorHandler);

userSchema.static("login", async function (email, password) {
  if (!email || !password) {
    throw new APIError(
      "Bad Request",
      HttpStatusCode.BAD_REQUEST,
      "Please enter your email and password",
      true
    );
  }

  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return await jwt.sign({ id: user.id }, SECRET_KEY, {
        expiresIn: "24h",
      });
    }
  }

  throw new APIError(
    "Invalid Credentials",
    HttpStatusCode.UNAUTHORIZED,
    "Email or password is incorrect",
    true
  );
});

const User = mongoose.model<IUser, UserModel>("User", userSchema);

export default User;
