import { Router } from "express";
import { ReservationController } from "../controllers/reservation.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const reservationRoutes = Router();

reservationRoutes.post("/", authMiddleware, ReservationController.create);
reservationRoutes.get("/", authMiddleware, ReservationController.findAll);
reservationRoutes.get("/:id", authMiddleware, ReservationController.findById);
reservationRoutes.put("/:id", authMiddleware, ReservationController.update);
reservationRoutes.delete("/:id", authMiddleware, ReservationController.delete);
reservationRoutes.patch("/:id/checkin", ReservationController.checkIn);
reservationRoutes.patch("/:id/checkout", ReservationController.checkOut);
// pagamento
reservationRoutes.patch("/:id/pay", authMiddleware, ReservationController.confirmPayment);

export default reservationRoutes;