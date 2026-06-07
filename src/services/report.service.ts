import { prisma } from "../prisma/client.js";

function rangeFromPeriod(period: string) {
  const now = new Date();
  const start = new Date(now);

  if (period === "monthly") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
  }

  return { start, end: now };
}

export class ReportService {
  static async occupancyAndRevenue(period = "weekly") {
    const { start, end } = rangeFromPeriod(period);

    const [roomsCount, reservations, activeReservations] = await Promise.all([
      prisma.room.count(),
      prisma.reservation.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
      }),
      prisma.reservation.count({
        where: {
          status: "CONFIRMED",
          checkIn: { lte: end },
          checkOut: { gte: start },
        },
      }),
    ]);

    const revenue = reservations.reduce(
      (sum, reservation) =>
        sum +
        (reservation.amountPaid ?? reservation.totalPrice) +
        (reservation.extraCharge ?? 0) -
        (reservation.refundAmount ?? 0),
      0
    );

    const predictedRevenue = await prisma.reservation.aggregate({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        checkIn: { gte: end },
      },
      _sum: { totalPrice: true },
    });

    return {
      period,
      start,
      end,
      roomsCount,
      activeReservations,
      occupancyRate: roomsCount ? Number(((activeReservations / roomsCount) * 100).toFixed(2)) : 0,
      reservationsCount: reservations.length,
      revenue,
      predictedRevenue: predictedRevenue._sum.totalPrice ?? 0,
    };
  }
}
