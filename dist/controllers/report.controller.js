import { ReportService } from "../services/report.service.js";
export class ReportController {
    static async occupancy(req, res) {
        try {
            const report = await ReportService.occupancyAndRevenue(String(req.query.period ?? "weekly"));
            return res.json(report);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}
