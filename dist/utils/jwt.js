import jwt from "jsonwebtoken";
const secret = process.env.JWT_SECRET;
export function generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });
}
