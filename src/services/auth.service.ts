import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client.js";
import { generateAccessToken, generateRefreshToken, generateToken } from "../utils/jwt.js";
import { EmailService } from "./email.service.js";

export enum StaffRole {
  ADMIN = "ADMIN",
  RECEPTION = "RECEPTION",
}

export class AuthService {
  private static publicUser(user: any) {
    const { password, resetToken, resetExpires, ...safeUser } = user;
    return safeUser;
  }

  private static buildSession(user: {
    id: string;
    email: string;
    role: string;
    tokenVersion: number;
  }) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      token: accessToken,
    };
  }

  private static hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  static async register(name: string, email: string, password: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error("Este email já está registado");

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: false,
        role: "CLIENT",
      },
    });

    const token = generateToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
        tokenType: "email-verification",
      },
      "24h"
    );

    await EmailService.sendVerificationEmail(user.email, token);

    return this.publicUser(user);
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        emailVerified: true,
        isActive: true,
        tokenVersion: true,
        createdAt: true,
      },
    });

    if (!user) throw new Error("Email ou senha inválidos");

    if (!user.isActive) {
      throw new Error("Esta conta está desativada. Contacte o administrador.");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error("Email ou senha inválidos");

    if (
      (user.role === "CLIENT" || user.role === "RECEPTION") &&
      !user.emailVerified
    ) {
      throw new Error(
        "Conta não verificada. Verifique o seu email para ativar a conta."
      );
    }

    const { password: _, ...safeUser } = user;

    return { user: safeUser, ...this.buildSession(user) };
  }

  static async refreshSession(refreshToken: string) {
    if (!refreshToken) throw new Error("Refresh token deve ser fornecido");

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
    } catch {
      throw new Error("Refresh token inválido ou expirado");
    }

    if (decoded.tokenType !== "refresh") {
      throw new Error("Token fornecido não é um refresh token");
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        tokenVersion: true,
      },
    });

    if (!user || !user.isActive) {
      throw new Error("Sessão inválida");
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      throw new Error("Sessão expirada por logout ou alteração de credenciais");
    }

    return this.buildSession(user);
  }

  static async createStaff(
    name: string,
    email: string,
    password: string,
    role: StaffRole
  ) {
    if (!Object.values(StaffRole).includes(role)) {
      throw new Error("Cargo inválido. Escolha entre ADMIN ou RECEPTION");
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error("Este email já está registado");

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        emailVerified: true,
      },
    });

    return this.publicUser(user);
  }

  static async verifyEmail(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (decoded.tokenType !== "email-verification") {
        throw new Error();
      }

      const user = await prisma.user.findUnique({ where: { email: decoded.email } });

      if (!user || user.tokenVersion !== decoded.tokenVersion) {
        throw new Error();
      }

      await prisma.user.update({
        where: { email: decoded.email },
        data: { emailVerified: true },
      });

      return { message: "Email verificado com sucesso" };
    } catch {
      throw new Error("Token inválido ou expirado");
    }
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Utilizador não encontrado");

    const token = crypto.randomBytes(32).toString("hex");

    await prisma.user.update({
      where: { email },
      data: {
        resetToken: this.hashToken(token),
        resetExpires: new Date(Date.now() + 1000 * 60 * 15),
      },
    });

    await EmailService.sendResetPasswordEmail(email, token);
    return { message: "Email de recuperação enviado com sucesso" };
  }

  static async resetPassword(token: string, newPassword: string) {
    if (!token) throw new Error("O token de autenticação deve ser fornecido");
    if (!newPassword || newPassword.length < 6) {
      throw new Error("A nova password deve ter pelo menos 6 caracteres");
    }

    const tokenHash = this.hashToken(token);

    const user = await prisma.user.findFirst({
      where: { resetToken: tokenHash },
    });

    if (!user) {
      throw new Error("Token inválido ou já utilizado");
    }

    if (!user.resetExpires || new Date() > user.resetExpires) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetExpires: null,
        },
      });

      throw new Error("Token expirado");
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetExpires: null,
        tokenVersion: { increment: 1 },
      },
    });

    return { message: "Password alterada com sucesso" };
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Utilizador não encontrado");

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new Error("Password atual incorreta");

    if (!newPassword || newPassword.length < 6) {
      throw new Error("A nova password deve ter pelo menos 6 caracteres");
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        tokenVersion: { increment: 1 },
      },
    });

    return { message: "Password alterada com sucesso" };
  }

  static async setUserStatus(userId: string, isActive: boolean) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Utilizador não encontrado");

    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive,
        ...(!isActive ? { tokenVersion: { increment: 1 } } : {}),
      },
    });

    return { message: `Conta ${isActive ? "ativada" : "desativada"} com sucesso` };
  }

  static async resendVerificationEmail(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) throw new Error("Utilizador não encontrado");

    if (user.emailVerified) {
      throw new Error("Conta já verificada");
    }

    const token = generateToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
        tokenType: "email-verification",
      },
      "24h"
    );

    await EmailService.sendVerificationEmail(email, token);

    return { message: "Email de verificação reenviado" };
  }

  static async resendResetPassword(email: string) {
    return this.forgotPassword(email);
  }

  static async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
    });

    return { message: "Logout realizado com sucesso" };
  }
}
