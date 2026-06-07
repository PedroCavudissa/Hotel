import { Router } from "express";
import { ReservationController } from "../controllers/reservation.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const reservationRoutes = Router();
const staffRoles = ["ADMIN", "MANAGER", "RECEPTION"];

reservationRoutes.post("/", authMiddleware, ReservationController.create);
reservationRoutes.get("/mine", authMiddleware, ReservationController.mine);



reservationRoutes.get(
  "/",
  authMiddleware,
  roleMiddleware(staffRoles),
  ReservationController.findAll
);

reservationRoutes.get(
  "/:id",
  authMiddleware,
  roleMiddleware(staffRoles),
  ReservationController.findById
);

reservationRoutes.put(
  "/:id",
  authMiddleware,
  ReservationController.update
);

reservationRoutes.patch(
  "/:id/reschedule",
  authMiddleware,
  roleMiddleware(staffRoles),
  ReservationController.reschedule
);

reservationRoutes.patch(
  "/:id/change-room",
  authMiddleware,
  roleMiddleware(staffRoles),
  ReservationController.changeRoom
);

reservationRoutes.patch(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware(staffRoles),
  ReservationController.cancel
);

reservationRoutes.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  ReservationController.delete
);

reservationRoutes.patch(
  "/:id/checkin",
  authMiddleware,
  roleMiddleware(staffRoles),
  ReservationController.checkIn
);

reservationRoutes.patch(
  "/:id/checkout",
  authMiddleware,
  roleMiddleware(staffRoles),
  ReservationController.checkOut
);

reservationRoutes.patch(
  "/:id/pay",
  authMiddleware,
  roleMiddleware(staffRoles),
  ReservationController.confirmPayment
);

reservationRoutes.post(
  "/:id/payment-proof",
  authMiddleware,
  upload.single("proof"),
  ReservationController.uploadPaymentProof
);

export default reservationRoutes;
