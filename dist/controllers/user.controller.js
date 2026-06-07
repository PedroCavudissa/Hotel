import { UserService } from "../services/user.service.js";
export class UserController {
    static async getAll(req, res) {
        try {
            const users = await UserService.getAllUsers(req.user.role, req.query);
            return res.json(users);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async guests(req, res) {
        try {
            const guests = await UserService.getGuests(req.query);
            return res.json(guests);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async me(req, res) {
        try {
            const user = await UserService.getMe(req.user.id);
            return res.json(user);
        }
        catch (error) {
            return res.status(404).json({ error: error.message });
        }
    }
    static async updateMe(req, res) {
        try {
            const user = await UserService.updateMe(req.user.id, req.body);
            return res.json(user);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async getById(req, res) {
        try {
            const user = await UserService.getById(req.params.id, req.user.role);
            return res.json(user);
        }
        catch (error) {
            return res.status(404).json({ error: error.message });
        }
    }
    static async delete(req, res) {
        try {
            const result = await UserService.delete(req.params.id);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}
