import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import BrandController from "../controllers/brandController";
import { checkId } from "../middleware/paramsMiddleware";

const router = Router();

router.use(verifyToken);

router.get("/", BrandController.getBrands);
router.post("/", BrandController.createBrand);

router.put("/:id", checkId, BrandController.updateBrand);
router.delete("/:id", checkId, BrandController.deleteBrand);
router.get("/:id", checkId, BrandController.getBrand);
router.get("/:id/products", checkId, BrandController.getBrandProducts);

export default router;