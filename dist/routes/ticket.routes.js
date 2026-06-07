import { Router } from "express";
import { TicketController } from "../controllers/ticket.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
const router = Router();
router.post("/", authMiddleware, TicketController.create);
router.get("/", authMiddleware, TicketController.findAll);
router.patch("/:id", authMiddleware, roleMiddleware(["ADMIN", "MANAGER", "RECEPTION"]), TicketController.update);
export default router;
