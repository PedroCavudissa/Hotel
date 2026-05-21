import { prisma } from "../prisma/client.js";
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}
export class ReservationService {

  // =========================
  // CREATE (HOLD 15 MIN)
  // =========================
static async create(data: any) {
  const now = new Date();

  const room = await prisma.room.findUnique({
    where: { id: data.roomId },
  });

  if (!room) throw new Error("Quarto não encontrado");

  const canBook =
    room.state === "VACANT_CLEAN" &&
    room.maintenance === "NONE";

  if (!canBook) {
    throw new Error("Quarto não disponível");
  }

  const conflict = await prisma.reservation.findFirst({
    where: {
      roomId: data.roomId,
      OR: [
        { status: "CONFIRMED" },
        {
          paymentStatus: "PENDING",
          expiresAt: { gt: now },
        },
      ],
    },
  });

  if (conflict) {
    throw new Error("Quarto reservado temporariamente");
  }

  const nights = Math.ceil(
    (new Date(data.checkOut).getTime() -
      new Date(data.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (nights <= 0) {
    throw new Error("Datas inválidas");
  }

  const totalPrice = room.pricePerNight * nights;

  return prisma.reservation.create({
    data: {
      userId: data.userId,
      roomId: data.roomId,
      checkIn: new Date(data.checkIn),
      checkOut: new Date(data.checkOut),

      totalPrice,

      status: "PENDING",
      paymentStatus: "PENDING",

      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  include: {
  room: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      isActive: true,
      createdAt: true,
    }
  }
}
  });
}
  // =========================
  // FIND ALL
  // =========================
static async findAll() {
  return prisma.reservation.findMany({
   include: {
  room: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      isActive: true,
      createdAt: true,
    }
  }
},
    orderBy: { createdAt: "desc" },
  });
}

  // =========================
  // FIND BY ID
  // =========================
  static async findById(id: string) {
    return prisma.reservation.findUnique({
      where: { id },
    include: {
  room: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      isActive: true,
      createdAt: true,
    }
  }
}
    });
  }

  // =========================
  // UPDATE (ADMIN / RECEPTION)
  // =========================
  static async update(id: string, data: any) {

    const reservation = await prisma.reservation.findUnique({
      where: { id }
    });

    if (!reservation) {
      throw new Error("Reserva não encontrada");
    }

    return prisma.reservation.update({
      where: { id },
      data: {
        checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
        checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
        totalPrice: data.totalPrice,
      },
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            isActive: true,
            createdAt: true,
          }
        }
      }
    });
  }

  // =========================
  // DELETE (CANCELAR RESERVA)
  // =========================
  static async delete(id: string) {

    const reservation = await prisma.reservation.findUnique({
      where: { id }
    });

    if (!reservation) {
      throw new Error("Reserva não encontrada");
    }

    return prisma.reservation.update({
      where: { id },
      data: {
        status: "CANCELLED",
        paymentStatus: "CANCELLED"
      }
    });
  }

  // =========================
  // CONFIRM PAYMENT
  // =========================
static async confirmPayment(id: string, method: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id }
  });

  if (!reservation) throw new Error("Reserva não encontrada");

  return prisma.reservation.update({
    where: { id },
    data: {
      paymentStatus: "PAID",
      status: "CONFIRMED",
      paymentMethod: method,

      // 💰 IMPORTANTE: registar pagamento real
      amountPaid: reservation.totalPrice
    },
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
    },
  });
}
static async checkIn(reservationId: string) {
  const now = new Date();

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { room: true }
  });

  if (!reservation) {
    throw new AppError(" Reserva não encontrada no sistema", 404);
  }

  // ❌ pagamento
  if (reservation.paymentStatus !== "PAID") {
    throw new AppError(
      "Check-in bloqueado: pagamento ainda não foi confirmado pela receção",
      403
    );
  }

  // ❌ expiração
  if (reservation.expiresAt && reservation.expiresAt < now) {
    throw new AppError(
      "Reserva expirada: o tempo de pagamento (15 min) terminou",
      410
    );
  }

  // ❌ status
  if (reservation.status !== "CONFIRMED") {
    throw new AppError(
      "Reserva ainda não está confirmada para check-in",
      409
    );
  }

  // ✔ atualiza estado do quarto
  await prisma.room.update({
    where: { id: reservation.roomId },
    data: {
      state: "OCCUPIED"
    }
  });

  // ✔ atualiza reserva
  return prisma.reservation.update({
    where: { id: reservationId },
    data: {
      checkInReal: now
    }
  });
}
static async checkOut(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { room: true }
  });

  if (!reservation) {
    throw new AppError("❌ Reserva não encontrada", 404);
  }

  // ❌ nunca fez check-in
  if (reservation.status !== "CONFIRMED") {
    throw new AppError(
      "⛔ Check-out inválido: o cliente ainda não fez check-in",
      409
    );
  }

  const now = new Date();

  // opcional: validar se já passou check-in
  if (reservation.checkIn > now) {
    throw new AppError(
      "⛔ Ainda não é possível fazer check-out antes do check-in",
      400
    );
  }

 
  const planned = reservation.checkOut.getTime();
  const actual = now.getTime();

  let refundAmount = 0;
  let extraCharge = 0;

  const totalHours =
    (reservation.checkOut.getTime() - reservation.checkIn.getTime()) /
    (1000 * 60 * 60);

  const ratePerHour = reservation.totalPrice / totalHours;

  // 🟡 EARLY CHECKOUT
  if (actual < planned) {
    const unusedHours = (planned - actual) / (1000 * 60 * 60);
    refundAmount = unusedHours * ratePerHour;
  }

  // 🔴 LATE CHECKOUT
  if (actual > planned) {
    const extraHours = (actual - planned) / (1000 * 60 * 60);
    extraCharge = extraHours * ratePerHour;
  }

  // ✔ atualiza quarto para limpeza
  await prisma.room.update({
    where: { id: reservation.roomId },
    data: {
      state: "VACANT_DIRTY",
      inspection: "NOT_INSPECTED"
    }
  });

  // ✔ finaliza reserva
  return prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: "COMPLETED",
      checkOutReal: now,
      refundAmount,
      extraCharge
    }
  });
}
}