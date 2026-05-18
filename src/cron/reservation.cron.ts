import { ReservationService } from "../services/reservation.service.js";

export function startReservationCron() {
  setInterval(async () => {
    await ReservationService.expireOldReservations();
  }, 60 * 1000); // a cada 1 minuto
}