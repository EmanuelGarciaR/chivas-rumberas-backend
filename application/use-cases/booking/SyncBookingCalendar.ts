import { BookingResponseDto } from "../../dtos/BookingDto";
import { BookingNotFoundError, ValidationError } from "../../../domain/errors/DomainErrors";
import { IBookingRepository } from "../../../domain/repositories/IBookingRepository";
import { IChivaRepository } from "../../../domain/repositories/IChivaRepository";
import { ITravelRepository } from "../../../domain/repositories/ITravelRepository";
import { CalendarService } from "../../ports/CalendarService";
import { TimeSlot } from "../../../domain/value-objects/TimeSlot";

/**
 * Caso de uso: Reintentar manualmente la sincronización con Google Calendar (POST /bookings/:id/calendar-sync).
 */
export class SyncBookingCalendarUseCase {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly calendarService: CalendarService,
    private readonly chivaRepository?: IChivaRepository,
    private readonly travelRepository?: ITravelRepository
  ) {}

  async execute(bookingId: string): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findBookingById(bookingId);
    if (!booking) throw new BookingNotFoundError(bookingId);

    if (booking.status !== "confirmed") {
      throw new ValidationError(
        "Solo se pueden sincronizar en el calendario las reservas confirmadas."
      );
    }

    let chivaName = booking.chivaName;
    let travelName = booking.travelName;

    if (chivaName === undefined && this.chivaRepository) {
      const chiva = await this.chivaRepository.findChivaById(booking.chivaId);
      chivaName = chiva?.name ?? "";
    }
    if (travelName === undefined && this.travelRepository) {
      const travel = await this.travelRepository.findTravelById(booking.travel);
      travelName = travel?.name ?? booking.travel;
    }

    const resolvedChivaName = chivaName ?? "";
    const resolvedTravelName = travelName ?? booking.travel;
    const eventDateStr = booking.eventDate.toISOString().split("T")[0];

    let updated = booking;

    if (booking.googleEventId) {
      // Idempotente: ya cuenta con evento en Google Calendar
      if (booking.calendarSyncStatus !== "synced") {
        updated = await this.bookingRepository.updateBookingCalendarSync(bookingId, {
          googleEventId: booking.googleEventId,
          calendarSyncStatus: "synced",
        });
      }
    } else {
      try {
        const eventId = await this.calendarService.createEvent({
          bookingId: booking.id,
          chivaName: resolvedChivaName || booking.chivaId,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          travelName: resolvedTravelName,
          guestCount: booking.guestCount,
          eventDate: eventDateStr,
          startTime: booking.startTime,
          durationHours: booking.durationHours,
          notes: booking.notes,
        });

        updated = await this.bookingRepository.updateBookingCalendarSync(bookingId, {
          googleEventId: eventId,
          calendarSyncStatus: "synced",
        });
      } catch (err) {
        console.error(
          `[GoogleCalendar] Error en reintento manual de sincronización para ${bookingId}:`,
          err
        );
        updated = await this.bookingRepository.updateBookingCalendarSync(bookingId, {
          calendarSyncStatus: "failed",
        });
      }
    }

    const timeSlot = TimeSlot.create(updated.startTime, updated.durationHours);

    return {
      id: updated.id,
      chivaId: updated.chivaId,
      chivaName: resolvedChivaName,
      travelId: updated.travel,
      travelName: resolvedTravelName,
      customerName: updated.customerName,
      customerEmail: updated.customerEmail,
      customerPhone: updated.customerPhone,
      guestCount: updated.guestCount,
      eventDate: eventDateStr,
      startTime: updated.startTime,
      endTime: timeSlot.getEndTime(),
      durationHours: updated.durationHours,
      totalPrice: updated.totalPrice,
      status: updated.status,
      notes: updated.notes,
      calendarSyncStatus: updated.calendarSyncStatus ?? "pending",
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
