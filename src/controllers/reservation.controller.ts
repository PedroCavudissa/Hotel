import { Request, Response } from "express";
import { ReservationService } from "../services/reservation.service.js";

function sendError(res: Response, err: any) {
  return res.status(err.statusCode || 400).json({
    error: err.message || "Pedido invalido",
  });
}

export class ReservationController {
  static async create(req: Request, res: Response) {
    try {
      const result = await ReservationService.create(req.body, (req as any).user);
      return res.status(201).json(result);
    } catch (err: any) {
      return sendError(res, err);
    }
  }

  static async findAll(req: Request, res: Response) {
    try {
      const data = await ReservationService.findAll(req.query);
      return res.json(data);
    } catch (err: any) {
      return sendError(res, err);
    }
  }

  static async mine(req: Request, res: Response) {
    try {
      const data = await ReservationService.findMine((req as any).user.id);
      return res.json(data);
    } catch (err: any) {
      return sendError(res, err);
    }
  }

  static async findById(req: Request, res: Response) {
    try {
      const data = await ReservationService.findById(req.params.id as string);
      return res.json(data);
    } catch (err: any) {
      return sendError(res, err);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const data = await ReservationService.update(req.params.id as string, req.body);
      return res.json(data);
    } catch (err: any) {
      return sendError(res, err);
    }
  }

  static async reschedule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { checkIn, checkOut, reason } = req.body;
      
      const reservation = await ReservationService.reschedule(id, { checkIn, checkOut, reason });
      return res.json(reservation);
    } catch (err: any) {
      return sendError(res, err);
    }
  }

  static async changeRoom(req: Request, res: Response) {
    try {
      const data = await ReservationService.changeRoom(
        req.params.id as string,
        req.body.roomId
      );
      return res.json(data);
    } catch (err: any) {
      return sendError(res, err);
    }
  }

static async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: "Motivo do cancelamento é obrigatório" });
      }
      
      const reservation = await ReservationService.cancel(id, reason);
      return res.json(reservation);
    } catch (err: any) {
      return sendError(res, err);
    }
  }


  static async delete(req: Request, res: Response) {
    try {
      const data = await ReservationService.delete(req.params.id as string);
      return res.json(data);
    } catch (err: any) {
      return sendError(res, err);
    }
  }

  static async confirmPayment(req: Request, res: Response) {
    try {
      const result = await ReservationService.confirmPayment(
        req.params.id as string,
        req.body.method,
        req.body.amountPaid ? Number(req.body.amountPaid) : undefined
      );
      return res.json(result);
    } catch (err: any) {
      return sendError(res, err);
    }
  }

  static async uploadPaymentProof(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Arquivo nao enviado" });
      }

      const fileUrl = `http://localhost:3000/uploads/${req.file.filename}`;
      const result = await ReservationService.uploadPaymentProof(
        req.params.id as string,
        fileUrl
      );
      return res.json(result);
    } catch (err: any) {
      return sendError(res, err);
    }
  }

  static async checkIn(req: Request, res: Response) {
    try {
      const result = await ReservationService.checkIn(req.params.id as string);
      return res.json(result);
    } catch (err: any) {
      return sendError(res, err);
    }
  }

static async checkOut(req: Request, res: Response) {
    try {
   
      const { earlyCheckoutReason } = req.body || {};

      const result = await ReservationService.checkOut(
        req.params.id as string,
        earlyCheckoutReason
      );
      return res.json(result);
    } catch (err: any) {
      return sendError(res, err);
    }
  }

  static async myReservations(req: Request, res: Response) {
    try {
      const data = await ReservationService.myReservations((req as any).user.id);
      return res.json(data);
    } catch (err: any) {
      return sendError(res, err);
    }
}
}