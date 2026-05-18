import { prisma } from "../prisma/client.js";

export class UserService {

  // listar utilizadores
  static async getAllUsers() {

    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  // utilizador logado
  static async getMe(userId: string) {

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error("Utilizador não encontrado");
    }

    return user;
  }

  // buscar por id
  static async getById(id: string) {

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error("Utilizador não encontrado");
    }

    return user;
  }

  // eliminar user
  static async delete(id: string) {

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error("Utilizador não encontrado");
    }

    await prisma.user.delete({
      where: { id },
    });

    return {
      message: "Utilizador eliminado com sucesso",
    };
  }

  
}