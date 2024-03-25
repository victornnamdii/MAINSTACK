import { Request, Response, NextFunction } from "express";
import User from "../models/User";

class UserController {
  static async signUp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName } = req.body;

      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
      });

      user.password = "";

      res.status(201).json({
        message: "New user successfully created",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const token = await User.login(email, password);

      res.status(200).json({
        message: "Login successful",
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  static async profile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      const user = await User.findById(userId).select({ password: 0, __v: 0 });

      if (user !== null) {
        return res.status(200).json({ data: user });
      }

      res.status(401).json({ error: "Access Denied" });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      const { email, password, firstName, lastName } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        {
          email,
          password,
          firstName,
          lastName,
        },
        { new: true }
      );

      if (user === null) {
        return res.status(401).json({ error: "Access Denied" });
      }

      user.password = "";

      res.status(201).json({
        message: "User successfully updated",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      const user = await User.findByIdAndDelete(userId);

      if (user !== null) {
        return res
          .status(200)
          .json({ message: "Account successfully deleted" });
      }

      res.status(401).json({ error: "Access Denied" });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
