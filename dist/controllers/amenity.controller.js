// ====================================
// src/controllers/amenity.controller.ts
// ====================================
import { AmenityService } from "../services/amenity.service.js";
export class AmenityController {
    static async create(req, res) {
        try {
            const amenity = await AmenityService.create(req.body);
            return res.status(201).json(amenity);
        }
        catch (error) {
            return res.status(400).json({
                error: error.message,
            });
        }
    }
    static async findAll(req, res) {
        try {
            const amenities = await AmenityService.findAll();
            return res.json(amenities);
        }
        catch (error) {
            return res.status(400).json({
                error: error.message,
            });
        }
    }
    static async update(req, res) {
        try {
            const amenity = await AmenityService.update(req.params.id, req.body);
            return res.json(amenity);
        }
        catch (error) {
            return res.status(400).json({
                error: error.message,
            });
        }
    }
    static async delete(req, res) {
        try {
            const result = await AmenityService.delete(req.params.id);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({
                error: error.message,
            });
        }
    }
}
