import { prisma } from "../prisma/client.js";

export class RoomService {

static async create(data: any) {

  const exists = await prisma.room.findUnique({
    where: { number: data.number },
  });

  if (exists) {
    throw new Error("Já existe um quarto com este número");
  }

  const room = await prisma.room.create({
    data: {
      number: data.number,
      type: data.type,
      title: data.title,
      description: data.description,

      pricePerNight: Number(data.pricePerNight),
      capacity: Number(data.capacity),
      imageUrl: data.imageUrl,

      amenities: data.amenities?.length
        ? {
            connect: data.amenities.map((id: string) => ({ id })),
          }
        : undefined,
    },

    include: {
      amenities: true,
    },
  });

  return room;
}

 static async findAll(filters?: any) {
  const { type } = filters || {};

  return prisma.room.findMany({
    where: type && type !== "all"
      ? { type }
      : undefined,

    include: {
      amenities: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
}

  static async findById(id: string) {

    const room = await prisma.room.findUnique({
      where: { id },

      include: {
        amenities: true,
        reservations: true,
      },
    });

    if (!room) {
      throw new Error("Quarto não encontrado");
    }

    return room;
  }

  static async update(id: string, data: any) {

    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      throw new Error("Quarto não encontrado");
    }

    return prisma.room.update({
      where: { id },

      data: {
        number: data.number,
        type: data.type,
        title: data.title,
        description: data.description,
        pricePerNight: data.pricePerNight,
        capacity: data.capacity,
        imageUrl: data.imageUrl,

        amenities: {
          set: data.amenityIds?.map((id: string) => ({
            id,
          })),
        },
      },

      include: {
        amenities: true,
      },
    });
  }

  static async delete(id: string) {

    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      throw new Error("Quarto não encontrado");
    }

    await prisma.room.delete({
      where: { id },
    });

    return {
      message: "Quarto removido com sucesso",
    };
  }

  static async changeStatus(id: string, status: any) {

    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      throw new Error("Quarto não encontrado");
    }

    return prisma.room.update({
      where: { id },

      data: {
        status,
      },
    });
  }

   // 🔥 INICIAR LIMPEZA
  static async startCleaning(roomId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error("Quarto não encontrado");
    }

    if (room.state !== "VACANT_DIRTY") {
      throw new Error("Só quartos sujos podem iniciar limpeza");
    }

    return prisma.room.update({
      where: { id: roomId },
      data: {
        state: "CLEANING",
        inspection: "NOT_INSPECTED",
      },
    });
  }

  // 🔥 FINALIZAR LIMPEZA
  static async finishCleaning(roomId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error("Quarto não encontrado");
    }

    if (room.state !== "CLEANING") {
      throw new Error("O quarto não está em limpeza");
    }

    return prisma.room.update({
      where: { id: roomId },
      data: {
        state: "VACANT_CLEAN",
      },
    });
  }

  // 🔥 INSPEÇÃO DA SUPERVISORA
  static async inspect(roomId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error("Quarto não encontrado");
    }

    if (room.state !== "VACANT_CLEAN") {
      throw new Error("Só quartos limpos podem ser inspecionados");
    }

    return prisma.room.update({
      where: { id: roomId },
      data: {
        inspection: "INSPECTED",
      },
    });
  }


  // 🔥 START MAINTENANCE
  static async startMaintenance(
    roomId: string,
    type: "OUT_OF_ORDER" | "OUT_OF_SERVICE"
  ) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });

    if (!room) throw new Error("Quarto não encontrado");

    return prisma.room.update({
      where: { id: roomId },
      data: {
        maintenance: type,
        state: "MAINTENANCE",
      },
    });
  }

  // 🔥 FINISH MAINTENANCE
  static async finishMaintenance(roomId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });

    if (!room) throw new Error("Quarto não encontrado");

    return prisma.room.update({
      where: { id: roomId },
      data: {
        maintenance: "NONE",
        state: "VACANT_DIRTY",
      },
    });
  }
}