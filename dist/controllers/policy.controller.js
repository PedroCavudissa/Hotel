import { PolicyService } from "../services/policy.service.js";
export class PolicyController {
    static async get(req, res) {
        try {
            const policy = await PolicyService.get();
            return res.json(policy);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async update(req, res) {
        try {
            const policy = await PolicyService.update(req.body);
            return res.json(policy);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}
