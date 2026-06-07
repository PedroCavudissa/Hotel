import { IntegrationService } from "../services/integration.service.js";
export class IntegrationController {
    static async syncAvailability(req, res) {
        try {
            const result = await IntegrationService.syncAvailability(req.params.platform);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async fetchReservations(req, res) {
        try {
            const result = await IntegrationService.fetchReservations(req.params.platform);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async pushReservation(req, res) {
        try {
            const result = await IntegrationService.pushReservation(req.params.platform, req.body.reservationId);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async cancelReservation(req, res) {
        try {
            const result = await IntegrationService.cancelReservation(req.params.platform, req.body.reservationId, req.body.reason);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async logs(req, res) {
        try {
            const result = await IntegrationService.logs();
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}
