import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import ProductController from "../controllers/productController";
import { checkId } from "../middleware/paramsMiddleware";

const router = Router();

router.use(verifyToken);

router.post("/", ProductController.addProduct);
router.get("/", ProductController.getProducts);

router.get("/:id", checkId, ProductController.getProduct);
router.patch("/:id", checkId, ProductController.updateProduct);
router.delete("/:id", checkId, ProductController.deleteProduct);

router.get("/:id/variants/:variantId", checkId, ProductController.getProductVariant);
router.patch("/:id/variants/:variantId", checkId, ProductController.updateProductVariant);
router.delete("/:id/variants/:variantId", checkId, ProductController.deleteProductVariant);

export default router;