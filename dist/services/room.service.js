import { prisma } from "../prisma/client.js";
export class RoomService {
    static async create(data) {
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
                floor: data.floor ? Number(data.floor) : undefined,
                imageUrl: data.imageUrl,
                amenities: data.amenities?.length
                    ? {
                        connect: data.amenities.map((id) => ({ id })),
                    }
                    : undefined,
            },
            include: {
                amenities: true,
            },
        });
        return room;
    }
    static async findAll(filters) {
        const { type, state, availability } = filters || {};
        const now = new Date();
        const where = {};
        if (type && type !== "all")
            where.type = type;
        if (state && state !== "all")
            where.state = state;
        if (availability === "free") {
            where.state = "VACANT_CLEAN";
            where.maintenance = "NONE";
            where.reservations = {
                none: {
                    status: { in: ["PENDING", "CONFIRMED"] },
                    checkIn: { lt: now },
                    checkOut: { gt: now },
                },
            };
        }
        if (availability === "occupied")
            where.state = "OCCUPIED";
        if (availability === "reserved") {
            where.reservations = {
                some: {
                    status: { in: ["PENDING", "CONFIRMED"] },
                    checkOut: { gt: now },
                },
            };
        }
        return prisma.room.findMany({
            where,
            include: {
                amenities: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }
    static async findById(id) {
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
    static async update(id, data) {
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
                capacity: data.capacity ? Number(data.capacity) : undefined,
                floor: data.floor ? Number(data.floor) : undefined,
                imageUrl: data.imageUrl,
                amenities: {
                    set: data.amenityIds?.map((id) => ({
                        id,
                    })),
                },
            },
            include: {
                amenities: true,
            },
        });
    }
    static async delete(id) {
        const room = await prisma.room.findUnique({
            where: { id },
            include: { reservations: true },
        });
        if (!room) {
            throw new Error("Quarto não encontrado");
        }
        const hasActiveReservation = room.reservations.some((reservation) => ["PENDING", "CONFIRMED"].includes(reservation.status));
        if (room.state === "OCCUPIED" || hasActiveReservation) {
            throw new Error("Quartos ocupados ou com reservas ativas nao podem ser eliminados");
        }
        await prisma.room.delete({
            where: { id },
        });
        return {
            message: "Quarto removido com sucesso",
        };
    }
    static async changeStatus(id, state) {
        const room = await prisma.room.findUnique({
            where: { id },
        });
        if (!room) {
            throw new Error("Quarto não encontrado");
        }
        return prisma.room.update({
            where: { id },
            data: {
                state,
            },
        });
    }
    // 🔥 INICIAR LIMPEZA
    static async startCleaning(roomId) {
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
    static async finishCleaning(roomId) {
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
    static async inspect(roomId) {
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
    static async startMaintenance(roomId, type) {
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room)
            throw new Error("Quarto não encontrado");
        return prisma.room.update({
            where: { id: roomId },
            data: {
                maintenance: type,
                state: "MAINTENANCE",
            },
        });
    }
    // 🔥 FINISH MAINTENANCE
    static async finishMaintenance(roomId) {
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room)
            throw new Error("Quarto não encontrado");
        return prisma.room.update({
            where: { id: roomId },
            data: {
                maintenance: "NONE",
                state: "VACANT_DIRTY",
            },
        });
    }
}
