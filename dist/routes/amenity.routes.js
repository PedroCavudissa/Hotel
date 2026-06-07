// ====================================
// src/routes/amenity.routes.ts
// ====================================
import { Router } from "express";
import { AmenityController } from "../controllers/amenity.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
const router = Router();
router.use(authMiddleware);
router.get("/", AmenityController.findAll);
router.post("/", roleMiddleware(["ADMIN"]), AmenityController.create);
router.patch("/:id", roleMiddleware(["ADMIN"]), AmenityController.update);
router.delete("/:id", roleMiddleware(["ADMIN"]), AmenityController.delete);
export default router;
