import { Request, Response } from "express";
import { UserService } from "../services/user.service.js";

export class UserController {

  // listar users
  static async getAll(req: Request, res: Response) {
    try {

      const users = await UserService.getAllUsers();

      return res.json(users);

    } catch (error: any) {

      return res.status(500).json({
        error: error.message,
      });
    }
  }

  // user logado
  static async me(req: Request, res: Response) {
    try {

      const userId = (req as any).user.id;

      const user = await UserService.getMe(userId);

      return res.json(user);

    } catch (error: any) {

      return res.status(404).json({
        error: error.message,
      });
    }
  }

  // buscar user por id
  static async getById(req: Request, res: Response) {
    try {

      const id = req.params.id as string;

      const user = await UserService.getById(id);

      return res.json(user);

    } catch (error: any) {

      return res.status(404).json({
        error: error.message,
      });
    }
  }

  // deletar user
  static async delete(req: Request, res: Response) {
    try {

      const id = req.params.id as string;

      const result = await UserService.delete(id);

      return res.json(result);

    } catch (error: any) {

      return res.status(400).json({
        message: error.message,
      });
    }
  }

}