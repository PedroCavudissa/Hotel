import { prisma } from "../prisma/client.js";
import { EmailService } from "./email.service.js";

type AuthUser = {
  id: string;
  role: string;
};

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const reservationInclude = {
  room: true,
  guest: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      isActive: true,
      createdAt: true,
    },
  },
} as const;

export class ReservationService {
  private static async getPolicy() {
    return prisma.hotelPolicy.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });
  }

  private static parseDate(value: string | Date, field: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new AppError(`${field} invalido`, 400);
    }
    return date;
  }

  private static sameCalendarDay(a: Date, b: Date) {
    return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
  }

  private static calculateNights(checkIn: Date, checkOut: Date) {
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) {
      throw new AppError("Datas da reserva invalidas", 400);
    }

    return nights;
  }

  private static async findRoomConflict(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
    excludeReservationId?: string
  ) {
    const now = new Date();

    return prisma.reservation.findFirst({
      where: {
        roomId,
        id: excludeReservationId ? { not: excludeReservationId } : undefined,
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
        OR: [
          { status: "CONFIRMED" },
          { status: "CHECKED_IN" },
          {
            status: "PENDING",
            paymentStatus: "PENDING",
            expiresAt: { gt: now },
          },
        ],
      },
    });
  }

  private static async suggestRoom(
    checkIn: Date,
    checkOut: Date,
    capacity?: number,
    excludeRoomId?: string
  ) {
    const now = new Date();

    const conflictingReservations = await prisma.reservation.findMany({
      where: {
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
        OR: [
          { status: "CONFIRMED" },
          { status: "CHECKED_IN" },
          {
            status: "PENDING",
            paymentStatus: "PENDING",
            expiresAt: { gt: now },
          },
        ],
      },
      select: { roomId: true },
    });

    const unavailableRoomIds = conflictingReservations.map((r) => r.roomId);
    if (excludeRoomId) {
      unavailableRoomIds.push(excludeRoomId);
    }

    return prisma.room.findFirst({
      where: {
        id: { notIn: unavailableRoomIds },
        maintenance: "NONE",
        capacity: capacity ? { gte: capacity } : undefined,
      },
      orderBy: [{ pricePerNight: "asc" }, { number: "asc" }],
    });
  }

  private static async assertRoomAvailable(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
    excludeReservationId?: string
  ) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });

    if (!room) throw new AppError("Quarto nao encontrado", 404);
    if (room.maintenance !== "NONE") {
      throw new AppError("Quarto em manutencao", 409);
    }

    const conflict = await this.findRoomConflict(
      roomId,
      checkIn,
      checkOut,
      excludeReservationId
    );

    if (conflict) {
      const suggestion = await this.suggestRoom(
        checkIn,
        checkOut,
        room.capacity,
        roomId
      );
      const message = suggestion
        ? `Quarto indisponivel. Sugestao: quarto ${suggestion.number}`
        : "Quarto indisponivel para estas datas";

      throw new AppError(message, 409);
    }

    return room;
  }

  private static validateGuestData(data: any, requireName = false) {
    if (requireName && !data?.name) {
      throw new AppError("Nome do hospede e obrigatorio", 400);
    }

    if (!data?.idDocument) {
      throw new AppError("Numero do bilhete ou passaporte e obrigatorio", 400);
    }

    if (!data?.province && !data?.country) {
      throw new AppError("Informe a provincia ou o pais do hospede", 400);
    }
  }

  private static async upsertGuestForUser(userId: string, guestInput: any) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("Utilizador nao encontrado", 404);

    const existingGuest = await prisma.guest.findUnique({ where: { userId } });

    const guestData = {
      name: guestInput?.name ?? user.name,
      email: guestInput?.email ?? user.email,
      phone: guestInput?.phone ?? existingGuest?.phone,
      idDocument: guestInput?.idDocument ?? existingGuest?.idDocument,
      province: guestInput?.province ?? existingGuest?.province,
      country: guestInput?.country ?? existingGuest?.country,
      isForeigner: guestInput?.isForeigner !== undefined ? Boolean(guestInput.isForeigner) : (existingGuest?.isForeigner ?? false),
    };

    this.validateGuestData(guestData, false);

    await prisma.user.update({
      where: { id: userId },
      data: {
        phone: guestData.phone,
        idDocument: guestData.idDocument,
        province: guestData.province,
        country: guestData.country,
        isForeigner: guestData.isForeigner,
      },
    });

    return prisma.guest.upsert({
      where: { userId },
      update: guestData,
      create: {
        ...guestData,
        userId,
      },
    });
  }

  private static async createWalkInGuest(data: any, staffId: string) {
    this.validateGuestData(data, true);

    return prisma.guest.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        idDocument: data.idDocument,
        province: data.province,
        country: data.country,
        isForeigner: Boolean(data.isForeigner),
        verifiedByStaff: true,
        createdById: staffId,
      },
    });
  }

  static async create(data: any, actor: AuthUser) {
    const checkIn = this.parseDate(data.checkIn, "checkIn");
    const checkOut = this.parseDate(data.checkOut, "checkOut");
    const nights = this.calculateNights(checkIn, checkOut);
    const room = await this.assertRoomAvailable(data.roomId, checkIn, checkOut);
    const policy = await this.getPolicy();

    const isStaff = ["ADMIN", "MANAGER", "RECEPTION"].includes(actor.role);
    let guest;
    let userId: string | undefined;

    if (isStaff && data.guest) {
      guest = await this.createWalkInGuest(data.guest, actor.id);
    } else {
      userId = isStaff && data.userId ? data.userId : actor.id;
      guest = await this.upsertGuestForUser(userId, data.guest ?? data);
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId,
        guestId: guest.id,
        roomId: data.roomId,
        checkIn,
        checkOut,
        totalPrice: room.pricePerNight * nights,
        status: "PENDING",
        paymentStatus: "PENDING",
        expiresAt: new Date(Date.now() + policy.paymentHoldMinutes * 60 * 1000),
        createdById: isStaff ? actor.id : undefined,
        externalPlatform: data.externalPlatform,
        externalReservationId: data.externalReservationId,
      },
      include: reservationInclude,
    });

    return reservation;
  }

  static async findAll(filters: any = {}) {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
    if (filters.active === "true") {
      where.status = { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] };
    }
    if (filters.history === "true") {
      where.status = { in: ["COMPLETED", "CANCELLED", "EXPIRED"] };
    }

    return prisma.reservation.findMany({
      where,
      include: reservationInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  static async myReservations(userId: string) {
    return prisma.reservation.findMany({
      where: { userId },
      include: reservationInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  static async findMine(userId: string) {
    return prisma.reservation.findMany({
      where: { userId },
      include: reservationInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  static async findById(id: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: reservationInclude,
    });

    if (!reservation) throw new AppError("Reserva nao encontrada", 404);
    return reservation;
  }

  static async reschedule(id: string, data: any) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!reservation) throw new AppError("Reserva nao encontrada", 404);

    if (["COMPLETED", "CANCELLED", "EXPIRED"].includes(reservation.status)) {
      throw new AppError("Esta reserva ja nao pode ser alterada", 409);
    }

    const checkIn = data.checkIn
      ? this.parseDate(data.checkIn, "checkIn")
      : reservation.checkIn;
    const checkOut = data.checkOut
      ? this.parseDate(data.checkOut, "checkOut")
      : reservation.checkOut;

    const roomId = data.roomId ?? reservation.roomId;
    const isChangingRoom = roomId !== reservation.roomId;

    const nights = this.calculateNights(checkIn, checkOut);
    const room = await this.assertRoomAvailable(roomId, checkIn, checkOut, id);
    const policy = await this.getPolicy();

    if (isChangingRoom && reservation.room) {
      const currentGuests = (reservation.adults ?? 0) + (reservation.children ?? 0);
      if (currentGuests > room.capacity) {
        throw new AppError(
          `O novo quarto #${room.number} tem capacidade para ${room.capacity} hóspedes, mas a reserva tem ${currentGuests}.`,
          409
        );
      }
    }

    const newTotalPrice = room.pricePerNight * nights;
    const currentPaid = reservation.amountPaid ?? 0;
    const needsAdditionalPayment = newTotalPrice > currentPaid;

    return prisma.reservation.update({
      where: { id },
      data: {
        roomId,
        checkIn,
        checkOut,
        totalPrice: newTotalPrice,
        status: needsAdditionalPayment ? "PENDING" : reservation.status,
        paymentStatus: needsAdditionalPayment ? "PENDING" : reservation.paymentStatus,
        expiresAt: needsAdditionalPayment
          ? new Date(Date.now() + policy.paymentHoldMinutes * 60 * 1000)
          : reservation.expiresAt,
      },
      include: reservationInclude,
    });
  }

  static async changeRoom(id: string, roomId: string) {
    if (!roomId) throw new AppError("Informe o novo quarto", 400);
    return this.reschedule(id, { roomId });
  }

  static async cancel(id: string, reason: string) {
    if (!reason?.trim()) {
      throw new AppError("Informe o motivo do cancelamento", 400);
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: reservationInclude,
    });
    
    if (!reservation) throw new AppError("Reserva nao encontrada", 404);
    if (["COMPLETED", "CANCELLED", "EXPIRED"].includes(reservation.status)) {
      throw new AppError("Esta reserva ja esta encerrada", 409);
    }

    const policy = await this.getPolicy();
    const paidAmount = reservation.amountPaid ?? 0;
    const percentFee = reservation.totalPrice * (policy.cancellationFeePercent / 100);
    
    const cancellationFee = paidAmount > 0
      ? Math.min(paidAmount, Math.max(policy.minCancellationFee, percentFee))
      : 0;
    const refundAmount = Math.max(paidAmount - cancellationFee, 0);

    await prisma.room.update({
      where: { id: reservation.roomId },
      data: { 
        state: "VACANT_CLEAN",
        inspection: "INSPECTED"
      },
    });

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: {
        status: "CANCELLED",
        paymentStatus: "CANCELLED",
        cancellationReason: reason.trim(),
        cancellationFee,
        refundAmount,
      },
      include: reservationInclude,
    });

    const email = updatedReservation.guest?.email ?? updatedReservation.user?.email;
    if (email) {
      try {
        await EmailService.sendReservationCancellation(email, updatedReservation);
      } catch (err) {
        console.error("Erro ao enviar e-mail de cancelamento:", err);
      }
    }

    return updatedReservation;
  }

  static async delete(id: string) {
    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new AppError("Reserva nao encontrada", 404);
    if (!["COMPLETED", "CANCELLED", "EXPIRED"].includes(reservation.status)) {
      throw new AppError("Reservas ativas nao podem ser eliminadas", 409);
    }

    await prisma.reservation.delete({ where: { id } });
    return { message: "Reserva eliminada com sucesso" };
  }

  static async confirmPayment(id: string, method: string, amountPaid?: number) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: reservationInclude,
    });

    if (!reservation) throw new AppError("Reserva nao encontrada", 404);
    
    if (reservation.status === "EXPIRED" || (reservation.expiresAt && reservation.expiresAt < new Date())) {
      throw new AppError("Reserva expirada. E necessario refazer a reserva", 410);
    }

    const currentPaid = reservation.amountPaid ?? 0;
    const incomingPayment = amountPaid ?? (reservation.totalPrice - currentPaid);
    const finalAmountPaid = currentPaid + incomingPayment;

    const isFullyPaid = finalAmountPaid >= reservation.totalPrice;

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        amountPaid: finalAmountPaid,
        paymentStatus: isFullyPaid ? "PAID" : "PENDING",
        status: isFullyPaid ? "CONFIRMED" : "PENDING",
        paymentMethod: method,
        expiresAt: isFullyPaid ? null : reservation.expiresAt,
      },
      include: reservationInclude,
    });

    const email = updated.guest?.email ?? updated.user?.email;
    if (isFullyPaid && email) {
      await EmailService.sendReservationConfirmation(email, updated);
    }

    return updated;
  }

  static async uploadPaymentProof(id: string, paymentProofUrl: string) {
    await this.findById(id);

    return prisma.reservation.update({
      where: { id },
      data: { paymentProofUrl },
      include: reservationInclude,
    });
  }

  static async expireOldReservations() {
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        paymentStatus: "PENDING",
        expiresAt: { lt: new Date() },
      },
    });

    let count = 0;
    for (const res of expiredReservations) {
      const paid = res.amountPaid ?? 0;
      const refund = paid; // Retém o montante anteriormente consolidado para auditoria/reembolso manual

      await prisma.reservation.update({
        where: { id: res.id },
        data: {
          status: "EXPIRED",
          paymentStatus: "CANCELLED",
          refundAmount: refund,
          cancellationReason: paid > 0 
            ? "Expirou automaticamente por falta de pagamento do valor adicional após reajuste."
            : "Expirou por falta de pagamento do sinal inicial.",
        },
      });

      await prisma.room.update({
        where: { id: res.roomId },
        data: { state: "VACANT_CLEAN" },
      });
      
      count++;
    }

    return { expiredCount: count };
  }

  static async checkIn(reservationId: string) {
    const now = new Date();

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { room: true },
    });

    if (!reservation) throw new AppError("Reserva nao encontrada", 404);
    if (reservation.paymentStatus !== "PAID") {
      throw new AppError("Pagamento ainda nao confirmado integralmente", 403);
    }
    if (reservation.expiresAt && reservation.expiresAt < now) {
      throw new AppError("Reserva expirada. E necessario refazer a reserva", 410);
    }
    if (reservation.status !== "CONFIRMED") {
      throw new AppError("Reserva ainda nao confirmada", 409);
    }
    if (reservation.checkInReal) {
      throw new AppError("Check-in ja realizado", 409);
    }
    if (!this.sameCalendarDay(now, reservation.checkIn)) {
      throw new AppError("Check-in permitido apenas no dia agendado", 403);
    }
    if (reservation.room.state !== "VACANT_CLEAN") {
      throw new AppError("Quarto ainda nao esta pronto para entrada", 409);
    }

    await prisma.room.update({
      where: { id: reservation.roomId },
      data: { state: "OCCUPIED" },
    });

    await prisma.reservation.update({
      where: { id: reservationId },
      data: { checkInReal: now, status: "CHECKED_IN" },
    });

    return prisma.reservation.findUnique({
      where: { id: reservationId },
      include: reservationInclude,
    });
  }

  static async checkOut(reservationId: string, earlyCheckoutReason?: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { room: true },
    });

    if (!reservation) throw new AppError("Reserva nao encontrada", 404);
    
    if (["COMPLETED", "CANCELLED", "EXPIRED"].includes(reservation.status)) {
      throw new AppError("Esta reserva já se encontra encerrada", 409);
    }

    const now = new Date();
    const policy = await this.getPolicy();
    let refundAmount = 0;
    let extraCharge = 0;

    const isForcedCheckout = !reservation.checkInReal;

    if (!isForcedCheckout && reservation.checkInReal) {
      if (now < reservation.checkOut && policy.earlyCheckoutRefundPercent > 0) {
        if (!earlyCheckoutReason?.trim()) {
          throw new AppError("Informe o motivo da saida antecipada", 400);
        }

        const totalHours =
          (reservation.checkOut.getTime() - reservation.checkIn.getTime()) /
          (1000 * 60 * 60);
        const unusedHours =
          (reservation.checkOut.getTime() - now.getTime()) / (1000 * 60 * 60);
        const unusedValue = (reservation.totalPrice / totalHours) * unusedHours;
        refundAmount = unusedValue * (policy.earlyCheckoutRefundPercent / 100);
      }

      const graceEnd = new Date(
        reservation.checkOut.getTime() + policy.lateCheckoutGraceMinutes * 60 * 1000
      );
      if (now > graceEnd) {
        const extraHours = Math.ceil(
          (now.getTime() - graceEnd.getTime()) / (1000 * 60 * 60)
        );
        extraCharge = extraHours * policy.lateCheckoutHourlyFee;
      }
    }

    await prisma.room.update({
      where: { id: reservation.roomId },
      data: {
        state: "VACANT_DIRTY",
        inspection: "NOT_INSPECTED",
      },
    });

    const completedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: "COMPLETED",
        checkOutReal: now,
        refundAmount,
        extraCharge,
        earlyCheckoutReason: isForcedCheckout 
          ? "Check-out forçado pelo sistema/staff (Hóspede não compareceu ou regularização)."
          : earlyCheckoutReason,
      },
      include: reservationInclude,
    });

    const email = completedReservation.guest?.email ?? completedReservation.user?.email;
    if (email) {
      try {
        await EmailService.reservationFinished(email, completedReservation);
      } catch (err) {
        console.error("Erro ao enviar e-mail de encerramento:", err);
      }
    }

    return completedReservation;
  }
}