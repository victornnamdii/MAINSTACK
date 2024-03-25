import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import CategoryController from "../controllers/categoryController";
import { checkId } from "../middleware/paramsMiddleware";

const router = Router();

router.use(verifyToken);

router.get("/", CategoryController.getCategories);
router.post("/", CategoryController.createCategory);

router.get("/:id", checkId, CategoryController.getCategory);
router.get("/:id/products", checkId, CategoryController.getCategoryProducts);
router.put("/:id", checkId, CategoryController.updateCategory);
router.delete("/:id", checkId, CategoryController.deleteCategory);

export default router;