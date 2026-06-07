import { prisma } from "../prisma/client.js";
export class PolicyService {
    static async get() {
        return prisma.hotelPolicy.upsert({
            where: { id: "default" },
            update: {},
            create: { id: "default" },
        });
    }
    static async update(data) {
        return prisma.hotelPolicy.upsert({
            where: { id: "default" },
            create: {
                id: "default",
                paymentHoldMinutes: data.paymentHoldMinutes,
                cancellationFeePercent: data.cancellationFeePercent,
                minCancellationFee: data.minCancellationFee,
                lateCheckoutGraceMinutes: data.lateCheckoutGraceMinutes,
                lateCheckoutHourlyFee: data.lateCheckoutHourlyFee,
                earlyCheckoutRefundPercent: data.earlyCheckoutRefundPercent,
            },
            update: {
                paymentHoldMinutes: data.paymentHoldMinutes,
                cancellationFeePercent: data.cancellationFeePercent,
                minCancellationFee: data.minCancellationFee,
                lateCheckoutGraceMinutes: data.lateCheckoutGraceMinutes,
                lateCheckoutHourlyFee: data.lateCheckoutHourlyFee,
                earlyCheckoutRefundPercent: data.earlyCheckoutRefundPercent,
            },
        });
    }
}
