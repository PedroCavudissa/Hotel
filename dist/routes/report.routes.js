import { Router } from "express";
import { ReportController } from "../controllers/report.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
const router = Router();
router.get("/occupancy", authMiddleware, roleMiddleware(["ADMIN", "MANAGER"]), ReportController.occupancy);
export default router;
