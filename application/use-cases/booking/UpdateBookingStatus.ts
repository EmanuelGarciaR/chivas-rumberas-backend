import { IBookingRepository } from "../../../domain/repositories/IBookingRepository";
import { IChivaRepository } from "../../../domain/repositories/IChivaRepository";
import { ITravelRepository } from "../../../domain/repositories/ITravelRepository";
import { INotificationService } from "../../ports/INotificationService";
import { CalendarService } from "../../ports/CalendarService";
import { BookingResponseDto } from "../../dtos/BookingDto";
import { BookingNotFoundError, InvalidBookingStatusTransitionError } from "../../../domain/errors/DomainErrors";
import { BookingStatus } from "../../../domain/models/Booking";
import { TimeSlot } from "../../../domain/value-objects/TimeSlot";

/**
 * Caso de uso: Cambiar el estado de una reserva (confirmar, cancelar o completar).
 * Solo accesible para el operador/admin.
 *
 * Transiciones válidas:
 *  pending  → confirmed | cancelled
 *  confirmed → completed | cancelled
 */
export class UpdateBookingStatusUseCase {
  private readonly VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
    pending:   ["confirmed", "cancelled"],
    confirmed: ["completed", "cancelled"],
    cancelled: [],
    completed: [],
  };

  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly notificationService: INotificationService,
    private readonly calendarService?: CalendarService,
    private readonly chivaRepository?: IChivaRepository,
    private readonly travelRepository?: ITravelRepository
  ) {}

  async execute(bookingId: string, newStatus: BookingStatus): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findBookingById(bookingId);
    if (!booking) throw new BookingNotFoundError(bookingId);

    const allowed = this.VALID_TRANSITIONS[booking.status];
    if (!allowed.includes(newStatus)) {
      throw new InvalidBookingStatusTransitionError(booking.status, newStatus);
    }

    let updated = await this.bookingRepository.updateBookingStatus(bookingId, newStatus);

    let chivaName = updated.chivaName ?? booking.chivaName;
    let travelName = updated.travelName ?? booking.travelName;

    if (chivaName === undefined && this.chivaRepository) {
      const chiva = await this.chivaRepository.findChivaById(updated.chivaId);
      chivaName = chiva?.name ?? "";
    }
    if (travelName === undefined && this.travelRepository) {
      const travel = await this.travelRepository.findTravelById(updated.travel);
      travelName = travel?.name ?? updated.travel;
    }

    const resolvedChivaName = chivaName ?? "";
    const resolvedTravelName = travelName ?? updated.travel;
    const eventDateStr = updated.eventDate.toISOString().split("T")[0];

    // Sincronización con Google Calendar (un fallo NO bloquea el cambio de estado)
    if (newStatus === "confirmed") {
      const existingEventId = updated.googleEventId ?? booking.googleEventId;
      if (existingEventId) {
        // Idempotente: si ya tiene googleEventId, no creamos otro
        if (updated.calendarSyncStatus !== "synced") {
          updated = await this.bookingRepository.updateBookingCalendarSync(bookingId, {
            googleEventId: existingEventId,
            calendarSyncStatus: "synced",
          });
        }
      } else if (this.calendarService) {
        try {
          const eventId = await this.calendarService.createEvent({
            bookingId: updated.id,
            chivaName: resolvedChivaName || updated.chivaId,
            customerName: updated.customerName,
            customerPhone: updated.customerPhone,
            travelName: resolvedTravelName,
            guestCount: updated.guestCount,
            eventDate: eventDateStr,
            startTime: updated.startTime,
            durationHours: updated.durationHours,
            notes: updated.notes,
          });
          updated = await this.bookingRepository.updateBookingCalendarSync(bookingId, {
            googleEventId: eventId,
            calendarSyncStatus: "synced",
          });
        } catch (err) {
          console.error(
            `[GoogleCalendar] Error sincronizando confirmación de reserva ${bookingId}:`,
            err
          );
          updated = await this.bookingRepository.updateBookingCalendarSync(bookingId, {
            calendarSyncStatus: "failed",
          });
        }
      }
    } else if (newStatus === "cancelled") {
      const existingEventId = updated.googleEventId ?? booking.googleEventId;
      if (existingEventId && this.calendarService) {
        try {
          await this.calendarService.deleteEvent(existingEventId);
          updated = await this.bookingRepository.updateBookingCalendarSync(bookingId, {
            googleEventId: null,
            calendarSyncStatus: "synced",
          });
        } catch (err) {
          console.error(
            `[GoogleCalendar] Error eliminando evento de reserva cancelada ${bookingId}:`,
            err
          );
          updated = await this.bookingRepository.updateBookingCalendarSync(bookingId, {
            calendarSyncStatus: "failed",
          });
        }
      }
    }
    // "completed" no hace nada en Google Calendar

    const timeSlot = TimeSlot.create(updated.startTime, updated.durationHours);
    const response: BookingResponseDto = {
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

    await this.notificationService.sendBookingStatusUpdate(response, booking.status);
    return response;
  }
}
