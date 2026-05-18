import { Router } from "express";

import { RoomController } from "../controllers/room.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  RoomController.findAll
);

router.get(
  "/:id",
  RoomController.findById
);

router.post(
  "/",
  upload.single("image"),
  roleMiddleware(["ADMIN", "RECEPTION"]),
  RoomController.create
);

router.patch(
  "/:id",
  roleMiddleware(["ADMIN", "RECEPTION"]),
  RoomController.update
);

router.patch(
  "/:id/status",
  roleMiddleware(["ADMIN", "RECEPTION"]),
  RoomController.changeStatus
);

router.delete(
  "/:id",
  roleMiddleware(["ADMIN"]),
  RoomController.delete
);


router.patch("/:id/cleaning/start", roleMiddleware(["ADMIN"]), RoomController.startCleaning);

router.patch("/:id/cleaning/finish", roleMiddleware(["ADMIN"]), RoomController.finishCleaning);

router.patch("/:id/inspect", roleMiddleware(["ADMIN"]), RoomController.inspect);
router.patch("/:id/maintenance/start", roleMiddleware(["ADMIN"]), RoomController.startMaintenance);
router.patch("/:id/maintenance/finish", roleMiddleware(["ADMIN"]), RoomController.finishMaintenance);
export default router;