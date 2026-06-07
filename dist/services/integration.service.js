import { prisma } from "../prisma/client.js";
import { BookingMockIntegration } from "../integrations/booking.mock.js";
export class IntegrationService {
    static getProvider(platform) {
        switch (platform.toLowerCase()) {
            case "booking":
            case "booking.com":
                return new BookingMockIntegration();
            default:
                throw new Error("Plataforma de reserva nao suportada");
        }
    }
    static async syncAvailability(platform) {
        const provider = this.getProvider(platform);
        await provider.syncAvailability();
        return prisma.channelSyncLog.create({
            data: {
                platform,
                action: "SYNC_AVAILABILITY",
                status: "SUCCESS",
                message: "Disponibilidade sincronizada",
            },
        });
    }
    static async fetchReservations(platform) {
        const provider = this.getProvider(platform);
        await provider.fetchReservations();
        return prisma.channelSyncLog.create({
            data: {
                platform,
                action: "FETCH_RESERVATIONS",
                status: "SUCCESS",
                message: "Reservas externas consultadas",
            },
        });
    }
    static async pushReservation(platform, reservationId) {
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
            include: { room: true, guest: true },
        });
        if (!reservation)
            throw new Error("Reserva nao encontrada");
        const provider = this.getProvider(platform);
        await provider.pushReservation(reservation);
        return prisma.channelSyncLog.create({
            data: {
                platform,
                action: "PUSH_RESERVATION",
                status: "SUCCESS",
                payload: reservation,
            },
        });
    }
    static async cancelReservation(platform, reservationId, reason) {
        const provider = this.getProvider(platform);
        await provider.cancelReservation(reservationId, reason);
        return prisma.channelSyncLog.create({
            data: {
                platform,
                action: "CANCEL_RESERVATION",
                status: "SUCCESS",
                message: reason,
            },
        });
    }
    static async logs() {
        return prisma.channelSyncLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 100,
        });
    }
}
