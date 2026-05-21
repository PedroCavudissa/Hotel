import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET as string;

export function generateToken(payload: Record<string, any>, expiresIn = "1h") {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function generateAccessToken(payload: Record<string, any>) {
  return generateToken({ ...payload, tokenType: "access" }, process.env.JWT_EXPIRES_IN || "1h");
}

export function generateRefreshToken(payload: Record<string, any>) {
  return generateToken({ ...payload, tokenType: "refresh" }, process.env.JWT_REFRESH_EXPIRES_IN || "7d");
}
