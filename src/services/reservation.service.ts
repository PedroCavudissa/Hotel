import { prisma } from "../prisma/client.js";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type Viewer = {
  id: string;
  role?: string;
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  emailVerified: true,
  isActive: true,
  createdAt: true,
};

const reservationInclude = {
  room: true,
  user: {
    select: userSelect,
  },
};

export class ReservationService {
  private static isStaff(viewer?: Viewer) {
    return viewer?.role === "ADMIN" || viewer?.role === "RECEPTION";
  }

  private static parseReservationDates(checkIn: string, checkOut: string) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new AppError("Datas inválidas");
    }

    if (start >= end) {
      throw new AppError("A data de check-out deve ser posterior ao check-in");
    }

    return { checkIn: start, checkOut: end };
  }

  private static calculateNights(checkIn: Date, checkOut: Date) {
    const day = 1000 * 60 * 60 * 24;
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / day);
  }

  private static async assertNoDateConflict(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
    ignoreReservationId?: string
  ) {
    const now = new Date();

    const conflict = await prisma.reservation.findFirst({
      where: {
        roomId,
        id: ignoreReservationId ? { not: ignoreReservationId } : undefined,
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
        OR: [
          { status: "CONFIRMED" },
          {
            status: "PENDING",
            paymentStatus: "PENDING",
            expiresAt: { gt: now },
          },
        ],
      },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        status: true,
      },
    });

    if (conflict) {
      throw new AppError("Quarto indisponível para o intervalo selecionado", 409);
    }
  }

  private static assertCanRead(reservation: { userId: string }, viewer?: Viewer) {
    if (!viewer) throw new AppError("Não autenticado", 401);

    if (!this.isStaff(viewer) && reservation.userId !== viewer.id) {
      throw new AppError("Não tens permissão para aceder a esta reserva", 403);
    }
  }

  static async create(data: any, viewer?: Viewer) {
    if (!viewer) throw new AppError("Não autenticado", 401);

    const userId = this.isStaff(viewer) ? data.userId : viewer.id;

    if (!userId) {
      throw new AppError("Informe o cliente da reserva");
    }

    const { checkIn, checkOut } = this.parseReservationDates(data.checkIn, data.checkOut);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError("Cliente não encontrado ou inativo", 404);
    }

    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
    });

    if (!room) throw new AppError("Quarto não encontrado", 404);

    if (room.maintenance !== "NONE" || room.state === "MAINTENANCE") {
      throw new AppError("Quarto bloqueado por manutenção", 409);
    }

    await this.assertNoDateConflict(data.roomId, checkIn, checkOut);

    const nights = this.calculateNights(checkIn, checkOut);
    const totalPrice = room.pricePerNight * nights;

    return prisma.reservation.create({
      data: {
        userId,
        roomId: data.roomId,
        checkIn,
        checkOut,
        totalPrice,
        status: "PENDING",
        paymentStatus: "PENDING",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
      include: reservationInclude,
    });
  }

  static async findAll(viewer?: Viewer) {
    if (!viewer) throw new AppError("Não autenticado", 401);

    return prisma.reservation.findMany({
      where: this.isStaff(viewer) ? undefined : { userId: viewer.id },
      include: reservationInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  static async findById(id: string, viewer?: Viewer) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: reservationInclude,
    });

    if (!reservation) throw new AppError("Reserva não encontrada", 404);

    this.assertCanRead(reservation, viewer);

    return reservation;
  }

  static async update(id: string, data: any) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!reservation) {
      throw new AppError("Reserva não encontrada", 404);
    }

    if (reservation.status === "COMPLETED" || reservation.status === "CANCELLED") {
      throw new AppError("Reservas finalizadas ou canceladas não podem ser alteradas", 409);
    }

    const checkIn = data.checkIn ? new Date(data.checkIn) : reservation.checkIn;
    const checkOut = data.checkOut ? new Date(data.checkOut) : reservation.checkOut;

    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkIn >= checkOut) {
      throw new AppError("Datas inválidas");
    }

    await this.assertNoDateConflict(reservation.roomId, checkIn, checkOut, id);

    const nights = this.calculateNights(checkIn, checkOut);
    const totalPrice = reservation.room.pricePerNight * nights;

    return prisma.reservation.update({
      where: { id },
      data: {
        checkIn,
        checkOut,
        totalPrice,
      },
      include: reservationInclude,
    });
  }

  static async delete(id: string, viewer?: Viewer) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new AppError("Reserva não encontrada", 404);
    }

    this.assertCanRead(reservation, viewer);

    if (reservation.status === "COMPLETED") {
      throw new AppError("Reservas concluídas não podem ser canceladas", 409);
    }

    if (reservation.checkInReal && !this.isStaff(viewer)) {
      throw new AppError("Reserva com check-in só pode ser cancelada pela receção", 403);
    }

    return prisma.reservation.update({
      where: { id },
      data: {
        status: "CANCELLED",
        paymentStatus:
          reservation.paymentStatus === "PAID" ? "REFUNDED" : "CANCELLED",
        expiresAt: null,
      },
      include: reservationInclude,
    });
  }

  static async confirmPayment(id: string, method: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) throw new AppError("Reserva não encontrada", 404);

    if (reservation.status === "CANCELLED" || reservation.status === "COMPLETED") {
      throw new AppError("Esta reserva não pode receber pagamento", 409);
    }

    if (reservation.paymentStatus === "PAID") {
      throw new AppError("Pagamento já confirmado", 409);
    }

    if (reservation.expiresAt && reservation.expiresAt < new Date()) {
      await prisma.reservation.update({
        where: { id },
        data: {
          paymentStatus: "CANCELLED",
          status: "EXPIRED",
          expiresAt: null,
        },
      });

      throw new AppError("Reserva expirada: o tempo de pagamento terminou", 410);
    }

    return prisma.reservation.update({
      where: { id },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        paymentMethod: method,
        amountPaid: reservation.totalPrice,
        expiresAt: null,
      },
      include: reservationInclude,
    });
  }

  static async expireOldReservations() {
    return prisma.reservation.updateMany({
      where: {
        paymentStatus: "PENDING",
        expiresAt: { lt: new Date() },
      },
      data: {
        paymentStatus: "CANCELLED",
        status: "EXPIRED",
        expiresAt: null,
      },
    });
  }

  static async checkIn(reservationId: string) {
    const now = new Date();

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { room: true },
    });

    if (!reservation) {
      throw new AppError("Reserva não encontrada no sistema", 404);
    }

    if (reservation.checkInReal) {
      throw new AppError("Check-in já foi realizado para esta reserva", 409);
    }

    if (reservation.checkOutReal) {
      throw new AppError("Reserva já teve check-out", 409);
    }

    if (reservation.paymentStatus !== "PAID") {
      throw new AppError(
        "Check-in bloqueado: pagamento ainda não foi confirmado pela receção",
        403
      );
    }

    if (reservation.status !== "CONFIRMED") {
      throw new AppError("Reserva ainda não está confirmada para check-in", 409);
    }

    if (reservation.room.maintenance !== "NONE" || reservation.room.state === "MAINTENANCE") {
      throw new AppError("Quarto bloqueado por manutenção", 409);
    }

    if (reservation.room.state === "OCCUPIED") {
      throw new AppError("Quarto já está ocupado", 409);
    }

    return prisma.$transaction(async (tx) => {
      await tx.room.update({
        where: { id: reservation.roomId },
        data: {
          state: "OCCUPIED",
        },
      });

      return tx.reservation.update({
        where: { id: reservationId },
        data: {
          checkInReal: now,
        },
        include: reservationInclude,
      });
    });
  }

  static async checkOut(reservationId: string, reason?: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { room: true },
    });

    if (!reservation) {
      throw new AppError("Reserva não encontrada", 404);
    }

    if (!reservation.checkInReal) {
      throw new AppError("Check-out inválido: o cliente ainda não fez check-in", 409);
    }

    if (reservation.checkOutReal || reservation.status === "COMPLETED") {
      throw new AppError("Check-out já foi realizado para esta reserva", 409);
    }

    const now = new Date();
    const plannedCheckout = reservation.checkOut.getTime();
    const actualCheckout = now.getTime();

    let refundAmount = 0;
    let extraCharge = 0;

    const reservedHours =
      (reservation.checkOut.getTime() - reservation.checkIn.getTime()) /
      (1000 * 60 * 60);

    const ratePerHour = reservation.totalPrice / reservedHours;

    if (actualCheckout < plannedCheckout) {
      const unusedHours = (plannedCheckout - actualCheckout) / (1000 * 60 * 60);
      refundAmount = Number((unusedHours * ratePerHour).toFixed(2));
    }

    if (actualCheckout > plannedCheckout) {
      const extraHours = Math.ceil((actualCheckout - plannedCheckout) / (1000 * 60 * 60));
      extraCharge = Number((extraHours * ratePerHour).toFixed(2));
    }

    return prisma.$transaction(async (tx) => {
      await tx.room.update({
        where: { id: reservation.roomId },
        data: {
          state: "VACANT_DIRTY",
          inspection: "NOT_INSPECTED",
        },
      });

      return tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: "COMPLETED",
          checkOutReal: now,
          refundAmount,
          extraCharge,
          earlyCheckoutReason: actualCheckout < plannedCheckout ? reason : null,
        },
        include: reservationInclude,
      });
    });
  }
}
