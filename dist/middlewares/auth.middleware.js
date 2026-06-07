import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client.js";
export async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Token não enviado" });
    }
    const parts = authHeader.split(" ");
    if (parts.length !== 2) {
        return res.status(401).json({ message: "Token mal formatado" });
    }
    const [, token] = parts;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
        });
        if (!user) {
            return res.status(401).json({ message: "Utilizador não encontrado" });
        }
        if (user.tokenVersion !== decoded.tokenVersion) {
            return res.status(401).json({ message: "Sessão inválida (logout)" });
        }
        req.user = decoded;
        next();
    }
    catch {
        return res.status(401).json({ message: "Token inválido ou expirado" });
    }
}
