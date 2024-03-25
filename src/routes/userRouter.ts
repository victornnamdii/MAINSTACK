import { Router } from "express";
import UserController from "../controllers/userController";
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();

router.post("/signup", UserController.signUp);
router.post("/login", UserController.logIn);

router.use(verifyToken);

router.get("/user", UserController.profile);
router.delete("/user", UserController.deleteAccount);
router.patch("/user", UserController.updateUser);

export default router;