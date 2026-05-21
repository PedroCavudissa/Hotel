import { Router } from "express";
import { ReservationController } from "../controllers/reservation.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const reservationRoutes = Router();

reservationRoutes.post("/", authMiddleware, ReservationController.create);
reservationRoutes.get("/", authMiddleware, ReservationController.findAll);
reservationRoutes.get("/:id", authMiddleware, ReservationController.findById);
reservationRoutes.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "RECEPTION"]),
  ReservationController.update
);
reservationRoutes.delete("/:id", authMiddleware, ReservationController.delete);
reservationRoutes.patch(
  "/:id/checkin",
  authMiddleware,
  roleMiddleware(["ADMIN", "RECEPTION"]),
  ReservationController.checkIn
);
reservationRoutes.patch(
  "/:id/checkout",
  authMiddleware,
  roleMiddleware(["ADMIN", "RECEPTION"]),
  ReservationController.checkOut
);
// pagamento
reservationRoutes.patch(
  "/:id/pay",
  authMiddleware,
  roleMiddleware(["ADMIN", "RECEPTION"]),
  ReservationController.confirmPayment
);

export default reservationRoutes;
