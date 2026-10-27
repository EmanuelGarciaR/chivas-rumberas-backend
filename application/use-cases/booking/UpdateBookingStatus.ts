import { IBookingRepository } from "../../../domain/repositories/IBookingRepository";
import { INotificationService } from "../../ports/INotificationService";
import { BookingResponseDto } from "../../dtos/BookingDto";
import { BookingNotFoundError, InvalidBookingStatusTransitionError } from "../../../domain/errors/DomainErrors";
import { BookingStatus } from "../../../domain/models/Booking";
import { TimeSlot } from "../../../domain/value-objects/TimeSlot";

/**
 * Caso de uso: Cambiar el estado de una reserva (confirmar o cancelar).
 * Solo accesible para el operador (admin).
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
    private readonly notificationService: INotificationService
  ) {}

  async execute(bookingId: string, newStatus: BookingStatus): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findBookingById(bookingId);
    if (!booking) throw new BookingNotFoundError(bookingId);

    const allowed = this.VALID_TRANSITIONS[booking.status];
    if (!allowed.includes(newStatus)) {
      throw new InvalidBookingStatusTransitionError(booking.status, newStatus);
    }

    const updated = await this.bookingRepository.updateBookingStatus(bookingId, newStatus);

    const timeSlot = TimeSlot.create(updated.startTime, updated.durationHours);
    const response: BookingResponseDto = {
      id: updated.id,
      chivaId: updated.chivaId,
      chivaName: "",   // Se enriquece en la capa de interfaz si se necesita
      travelId: updated.travel,
      travelName: updated.travel,
      customerName: updated.customerName,
      customerEmail: updated.customerEmail,
      customerPhone: updated.customerPhone,
      guestCount: updated.guestCount,
      eventDate: updated.eventDate.toISOString().split("T")[0],
      startTime: updated.startTime,
      endTime: timeSlot.getEndTime(),
      durationHours: updated.durationHours,
      totalPrice: updated.totalPrice,
      status: updated.status,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
    };

    await this.notificationService.sendBookingStatusUpdate(response, booking.status);
    return response;
  }
}
