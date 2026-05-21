import { Request, Response } from "express";
import { ReservationService } from "../services/reservation.service.js";

export class ReservationController {

  static async create(req:Request, res:Response) {
    try {
      const result = await ReservationService.create(req.body);
      return res.status(201).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async findAll(req: Request, res: Response) {
    const data = await ReservationService.findAll();
    return res.json(data);
  }

  static async findById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const data = await ReservationService.findById(id);
      return res.json(data);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const data = await ReservationService.update(id, req.body);
      return res.json(data);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const data = await ReservationService.delete(id);
      return res.json(data);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
  static async confirmPayment(req:Request, res:Response) {
    try {
      const { id } = req.params as { id: string };
      const { method } = req.body;

      const result = await ReservationService.confirmPayment(id, method);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
    static async checkIn(req:Request, res:Response) {
    try {
      const result = await ReservationService.checkIn(req.params.id as string);
      return res.json(result);
    } catch (err) {
      return  res.status(err.statusCode || 400).json({ error: err.message });
    }
  }

  static async checkOut(req: Request, res: Response) {
    try {
      const result = await ReservationService.checkOut(req.params.id as string);
      return res.json(result);
    } catch (err) {
      return res.status(err.statusCode || 400).json({ error: err.message });
    }
  }
}