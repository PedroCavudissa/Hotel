import { TicketService } from "../services/ticket.service.js";
export class TicketController {
    static async create(req, res) {
        try {
            const ticket = await TicketService.create(req.body, req.user);
            return res.status(201).json(ticket);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async findAll(req, res) {
        try {
            const tickets = await TicketService.findAll(req.query, req.user);
            return res.json(tickets);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async update(req, res) {
        try {
            const ticket = await TicketService.update(req.params.id, req.body, req.user);
            return res.json(ticket);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}
