import { ReservationService } from "../services/reservation.service.js";
function sendError(res, err) {
    return res.status(err.statusCode || 400).json({
        error: err.message || "Pedido invalido",
    });
}
export class ReservationController {
    static async create(req, res) {
        try {
            const result = await ReservationService.create(req.body, req.user);
            return res.status(201).json(result);
        }
        catch (err) {
            return sendError(res, err);
        }
    }
    static async findAll(req, res) {
        try {
            const data = await ReservationService.findAll(req.query);
            return res.json(data);
        }
        catch (err) {
            return sendError(res, err);
        }
    }
    static async mine(req, res) {
        try {
            const data = await ReservationService.findMine(req.user.id);
            return res.json(data);
        }
        catch (err) {
            return sendError(res, err);
        }
    }
    static async findById(req, res) {
        try {
            const data = await ReservationService.findById(req.params.id);
            return res.json(data);
        }
        catch (err) {
            return sendError(res, err);
        }
    }
    static async update(req, res) {
        try {
            const data = await ReservationService.update(req.params.id, req.body);
            return res.json(data);
        }
        catch (err) {
            return sendError(res, err);
        }
    }
    static async reschedule(req, res) {
        try {
            const data = await ReservationService.reschedule(req.params.id, req.body);
            return res.json(data);
        }
        catch (err) {
            return sendError(res, err);
        }
    }
    static async changeRoom(req, res) {
        try {
            const data = await ReservationService.changeRoom(req.params.id, req.body.roomId);
            return res.json(data);
        }
        catch (err) {
            return sendError(res, err);
        }
    }
    static async cancel(req, res) {
        try {
            const data = await ReservationService.cancel(req.params.id, req.body.reason);
            return res.json(data);
        }
        catch (err) {
            return sendError(res, err);
        }
    }
    static async delete(req, res) {
        try {
            const data = await ReservationService.delete(req.params.id);
            return res.json(data);
        }
        catch (err) {
            return sendError(res, err);
        }
    }
    static async confirmPayment(req, res) {
        try {
            const result = await ReservationService.confirmPayment(req.params.id, req.body.method, req.body.amountPaid ? Number(req.body.amountPaid) : undefined);
            return res.json(result);
        }
        catch (err) {
            return sendError(res, err);
        }
    }
    static async uploadPaymentProof(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "Arquivo nao enviado" });
            }
            const fileUrl = `http://localhost:3000/uploads/${req.file.filename}`;
            const result = await ReservationService.uploadPaymentProof(req.params.id, fileUrl);
            return res.json(result);
        }
        catch (err) {
            return sendError(res, err);
        }
    }
    static async checkIn(req, res) {
        try {
            const result = await ReservationService.checkIn(req.params.id);
            return res.json(result);
        }
        catch (err) {
            return sendError(res, err);
        }
    }
    static async checkOut(req, res) {
        try {
            const result = await ReservationService.checkOut(req.params.id, req.body.earlyCheckoutReason);
            return res.json(result);
        }
        catch (err) {
            return sendError(res, err);
        }
    }
}
