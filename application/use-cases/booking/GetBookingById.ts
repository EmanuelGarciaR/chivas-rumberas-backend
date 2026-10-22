import { IBookingRepository } from "../../../domain/repositories/IBookingRepository";
import { BookingResponseDto } from "../../dtos/BookingDto";
import { BookingNotFoundError } from "../../../domain/errors/DomainErrors";
import { TimeSlot } from "../../../domain/value-objects/TimeSlot";

/**
 * Caso de uso: Obtener una reserva por su ID.
 * Usado para la página de detalle o confirmación de reserva.
 */
export class GetBookingByIdUseCase {
  constructor(private readonly bookingRepository: IBookingRepository) {}

  async execute(bookingId: string): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findBookingById(bookingId);
    if (!booking) throw new BookingNotFoundError(bookingId);

    const timeSlot = TimeSlot.create(booking.startTime, booking.durationHours);

    return {
      id: booking.id,
      chivaId: booking.chivaId,
      chivaName: "",
      travelId: booking.travel,
      travelName: booking.travel,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      guestCount: booking.guestCount,
      eventDate: booking.eventDate.toISOString().split("T")[0],
      startTime: booking.startTime,
      endTime: timeSlot.getEndTime(),
      durationHours: booking.durationHours,
      totalPrice: booking.totalPrice,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
    };
  }
}
