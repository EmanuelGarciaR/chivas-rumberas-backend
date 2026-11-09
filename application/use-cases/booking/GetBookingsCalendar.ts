import {
  BookingsCalendarResponseDto,
  CalendarDayChivaDto,
  CalendarDayDto,
  CalendarSlotDto,
} from "../../dtos/BookingDto";
import { ValidationError } from "../../../domain/errors/DomainErrors";
import { IBookingRepository } from "../../../domain/repositories/IBookingRepository";
import { TimeSlot } from "../../../domain/value-objects/TimeSlot";

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function formatEventDateBogota(date: Date): string {
  if (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  ) {
    return date.toISOString().split("T")[0];
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Caso de uso: Obtener datos del calendario mensual para el dashboard de administración.
 * - Una sola consulta por rango de fechas, sin N+1.
 * - Solo reservas con status = confirmed.
 * - Si una reserva termina pasada la medianoche, permanece en su día de inicio con endsNextDay: true.
 */
export class GetBookingsCalendarUseCase {
  constructor(private readonly bookingRepository: IBookingRepository) {}

  async execute(month: string): Promise<BookingsCalendarResponseDto> {
    const trimmedMonth = month?.trim();
    if (!trimmedMonth || !MONTH_REGEX.test(trimmedMonth)) {
      throw new ValidationError("El parámetro month debe tener el formato YYYY-MM.");
    }

    const [year, monthNumber] = trimmedMonth.split("-").map(Number);

    // Cubrimos el rango del mes considerando tanto fechas UTC-00:00 como timestamps en America/Bogota (UTC-5)
    const startDate = new Date(Date.UTC(year, monthNumber - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, monthNumber, 1, 5, 0, 0, 0));

    const bookings = await this.bookingRepository.findConfirmedByDateRange(startDate, endDate);

    // Filtramos estrictamente confirmadas que pertenezcan al mes solicitado en America/Bogota
    const confirmedInMonth = bookings.filter(
      (b) => b.status === "confirmed" && formatEventDateBogota(b.eventDate).startsWith(trimmedMonth)
    );

    const chivasMap = new Map<string, string>();
    const daysMap = new Map<string, Map<string, { chivaName: string; slots: CalendarSlotDto[] }>>();

    for (const booking of confirmedInMonth) {
      const dateStr = formatEventDateBogota(booking.eventDate);
      const chivaName = booking.chivaName ?? booking.chivaId;
      const travelName = booking.travelName ?? booking.travel;

      if (!chivasMap.has(booking.chivaId)) {
        chivasMap.set(booking.chivaId, chivaName);
      }

      const timeSlot = TimeSlot.create(booking.startTime, booking.durationHours);
      const [startH, startM] = booking.startTime.split(":").map(Number);
      const totalMinutes = startH * 60 + startM + booking.durationHours * 60;
      const endsNextDay = totalMinutes > 24 * 60;

      const slotDto: CalendarSlotDto = {
        bookingId: booking.id,
        startTime: booking.startTime,
        endTime: timeSlot.getEndTime(),
        durationHours: booking.durationHours,
        customerName: booking.customerName,
        travelName,
        guestCount: booking.guestCount,
        ...(endsNextDay ? { endsNextDay: true } : {}),
      };

      let dayChivasMap = daysMap.get(dateStr);
      if (!dayChivasMap) {
        dayChivasMap = new Map();
        daysMap.set(dateStr, dayChivasMap);
      }

      let chivaEntry = dayChivasMap.get(booking.chivaId);
      if (!chivaEntry) {
        chivaEntry = { chivaName, slots: [] };
        dayChivasMap.set(booking.chivaId, chivaEntry);
      }

      chivaEntry.slots.push(slotDto);
    }

    const sortedDates = Array.from(daysMap.keys()).sort((a, b) => a.localeCompare(b));

    const days: CalendarDayDto[] = sortedDates.map((date) => {
      const dayChivasMap = daysMap.get(date)!;
      const chivas: CalendarDayChivaDto[] = Array.from(dayChivasMap.entries()).map(
        ([chivaId, entry]) => ({
          chivaId,
          chivaName: entry.chivaName,
          slots: entry.slots.sort((a, b) => a.startTime.localeCompare(b.startTime)),
        })
      );

      return {
        date,
        chivasCount: chivas.length,
        chivas,
      };
    });

    const chivas = Array.from(chivasMap.entries()).map(([id, name]) => ({ id, name }));

    return {
      month: trimmedMonth,
      chivas,
      days,
    };
  }
}
