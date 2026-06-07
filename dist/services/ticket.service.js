import { prisma } from "../prisma/client.js";
export class TicketService {
    static async create(data, actor) {
        if (!data.subject || !data.message) {
            throw new Error("Assunto e mensagem sao obrigatorios");
        }
        const reservation = data.reservationId
            ? await prisma.reservation.findUnique({
                where: { id: data.reservationId },
                include: { guest: true },
            })
            : null;
        if (reservation && actor.role === "CLIENT" && reservation.userId !== actor.id) {
            throw new Error("Sem permissao para esta reserva");
        }
        return prisma.ticket.create({
            data: {
                type: data.type ?? "COMPLAINT",
                subject: data.subject,
                message: data.message,
                userId: actor.role === "CLIENT" ? actor.id : data.userId,
                guestId: data.guestId ?? reservation?.guestId,
                reservationId: data.reservationId,
                requestedCheckIn: data.requestedCheckIn
                    ? new Date(data.requestedCheckIn)
                    : undefined,
                requestedCheckOut: data.requestedCheckOut
                    ? new Date(data.requestedCheckOut)
                    : undefined,
                requestedRoomId: data.requestedRoomId,
            },
            include: {
                reservation: true,
                guest: true,
                user: { select: { id: true, name: true, email: true, role: true } },
            },
        });
    }
    static async findAll(filters = {}, actor) {
        const where = {};
        if (actor.role === "CLIENT")
            where.userId = actor.id;
        if (filters.status)
            where.status = filters.status;
        if (filters.type)
            where.type = filters.type;
        return prisma.ticket.findMany({
            where,
            include: {
                reservation: { include: { room: true } },
                guest: true,
                user: { select: { id: true, name: true, email: true, role: true } },
                assignedTo: { select: { id: true, name: true, email: true, role: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    static async update(id, data, actor) {
        const ticket = await prisma.ticket.findUnique({ where: { id } });
        if (!ticket)
            throw new Error("Ticket nao encontrado");
        return prisma.ticket.update({
            where: { id },
            data: {
                status: data.status,
                response: data.response,
                assignedToId: data.assignedToId ?? actor.id,
            },
        });
    }
}
