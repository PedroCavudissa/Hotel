import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// listar users
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  UserController.getAll
);

// utilizador logado
router.get(
  "/me",
  authMiddleware,
  UserController.me
);

// buscar user por id
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  UserController.getById
);

// deletar user
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  UserController.delete
);


export default router;