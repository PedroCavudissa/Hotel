import { RoomService } from "../services/room.service.js";
import { prisma } from "../prisma/client.js";
export class RoomController {
    static async create(req, res) {
        try {
            const imageUrl = req.file
                ? `http://localhost:3000/uploads/${req.file.filename}`
                : null;
            const room = await RoomService.create({
                ...req.body,
                imageUrl,
            });
            return res.status(201).json(room);
        }
        catch (error) {
            return res.status(400).json({
                error: error.message,
            });
        }
    }
    static async findAll(req, res) {
        try {
            const rooms = await RoomService.findAll(req.query);
            return res.json(rooms);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async findById(req, res) {
        try {
            const room = await RoomService.findById(req.params.id);
            return res.json(room);
        }
        catch (error) {
            return res.status(404).json({
                error: error.message,
            });
        }
    }
    static async update(req, res) {
        try {
            const room = await RoomService.update(req.params.id, req.body);
            return res.json(room);
        }
        catch (error) {
            return res.status(400).json({
                error: error.message,
            });
        }
    }
    static async delete(req, res) {
        try {
            const result = await RoomService.delete(req.params.id);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({
                error: error.message,
            });
        }
    }
    static async changeStatus(req, res) {
        try {
            const state = req.body.state ?? req.body.status;
            const room = await RoomService.changeStatus(req.params.id, state);
            return res.json(room);
        }
        catch (error) {
            return res.status(400).json({
                error: error.message,
            });
        }
    }
    static async startCleaning(req, res) {
        try {
            const room = await RoomService.startCleaning(req.params.id);
            return res.json(room);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async finishCleaning(req, res) {
        try {
            const room = await RoomService.finishCleaning(req.params.id);
            return res.json(room);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async inspect(req, res) {
        try {
            const { id } = req.params;
            const roomId = Array.isArray(id) ? id[0] : id;
            const room = await prisma.room.findUnique({
                where: { id: roomId },
            });
            if (!room) {
                return res.status(404).json({ error: "Quarto não encontrado" });
            }
            // ❌ só pode inspecionar se estiver limpo
            if (room.state !== "VACANT_CLEAN") {
                return res.status(400).json({
                    error: "Só quartos limpos podem ser inspecionados"
                });
            }
            const updated = await prisma.room.update({
                where: { id: roomId },
                data: {
                    inspection: "INSPECTED"
                }
            });
            return res.json(updated);
        }
        catch (err) {
            return res.status(500).json({ error: "Erro ao inspecionar quarto" });
        }
    }
    static async startMaintenance(req, res) {
        try {
            const result = await RoomService.startMaintenance(req.params.id, req.body.type);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async finishMaintenance(req, res) {
        try {
            const result = await RoomService.finishMaintenance(req.params.id);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}
