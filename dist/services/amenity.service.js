// ====================================
// src/services/amenity.service.ts
// ====================================
import { prisma } from "../prisma/client.js";
export class AmenityService {
    static async create(data) {
        const exists = await prisma.amenity.findUnique({
            where: {
                name: data.name,
            },
        });
        if (exists) {
            throw new Error("Amenidade já existe");
        }
        return prisma.amenity.create({
            data,
        });
    }
    static async findAll() {
        return prisma.amenity.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });
    }
    static async update(id, data) {
        return prisma.amenity.update({
            where: { id },
            data,
        });
    }
    static async delete(id) {
        await prisma.amenity.delete({
            where: { id },
        });
        return {
            message: "Amenidade removida",
        };
    }
}
