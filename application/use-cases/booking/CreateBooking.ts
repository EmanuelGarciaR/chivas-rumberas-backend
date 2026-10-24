import { IBookingRepository } from "../../../domain/repositories/IBookingRepository";
import { IChivaRepository } from "../../../domain/repositories/IChivaRepository";
import { ITravelRepository } from "../../../domain/repositories/ITravelRepository";
import { INotificationService } from "../../../application/ports/INotificationService";
import { CreateBookingDto, BookingResponseDto } from "../../dtos/BookingDto";
import { EventDate } from "../../../domain/value-objects/EventDate";
import { TimeSlot } from "../../../domain/value-objects/TimeSlot";
import { GuestCount } from "../../../domain/value-objects/GuestCount";
import { ChivaNotFoundError, ChivaNotAvailableError, BookingConflictError, TravelNotFoundError } from "../../../domain/errors/DomainErrors";
import { Booking } from "../../../domain/models/Booking";
import { randomUUID } from "node:crypto";

/**
 * Caso de uso: Crear una reserva de chiva.

 * Orquesta:
 * 1. Validar que la chiva existe y está disponible.
 * 2. Validar que el recorrido existe.
 * 3. Validar fecha, hora y cantidad de invitados con Value Objects.
 * 4. Verificar que no haya conflicto de horario.
 * 5. Calcular precio total.
 * 6. Persistir la reserva.
 * 7. Enviar notificaciones.
 */
export class CreateBookingUseCase {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly chivaRepository: IChivaRepository,
    private readonly travelRepository: ITravelRepository,
    private readonly notificationService: INotificationService
  ) {}

  async execute(dto: CreateBookingDto): Promise<BookingResponseDto> {
    // Validar chiva
    const chiva = await this.chivaRepository.findChivaById(dto.chivaId);
    if (!chiva) throw new ChivaNotFoundError(dto.chivaId);
    if (chiva.status !== "available") throw new ChivaNotAvailableError(dto.chivaId);

    // Validar recorrido
    const travel = await this.travelRepository.findTravelById(dto.travelId);
    if (!travel) throw new TravelNotFoundError(dto.travelId);

    // Validar con Value Objects (lanzan DomainError si fallan)
    const eventDate = EventDate.create(dto.eventDate);
    const timeSlot = TimeSlot.create(dto.startTime, dto.durationHours);
    GuestCount.create(dto.guestCount, chiva.capacity);

    // Verificar conflicto de horario
    const hasConflict = await this.bookingRepository.hasConflict(
      dto.chivaId,
      eventDate.value,
      timeSlot.startTime,
      timeSlot.durationHours
    );
    if (hasConflict) {
      throw new BookingConflictError(
        dto.chivaId,
        eventDate.toDateString(),
        timeSlot.startTime
      );
    }

    // Calcular precio
    const totalPrice = chiva.pricePerHour * dto.durationHours;

    // Persistir
    const newBooking: Booking = {
      id: randomUUID(),
      chivaId: dto.chivaId,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      guestCount: dto.guestCount,
      travel: travel.name,
      eventDate: eventDate.value,
      startTime: timeSlot.startTime,
      durationHours: timeSlot.durationHours,
      totalPrice,
      status: "pending",
      notes: dto.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const saved = await this.bookingRepository.saveBooking(newBooking);

    // Notificar
    const response = this.toResponseDto(saved, chiva.name, travel.name, timeSlot.getEndTime());
    await this.notificationService.sendBookingConfirmation(response);
    await this.notificationService.sendNewBookingAlert(response);

    return response;
  }

  private toResponseDto(
    booking: Booking,
    chivaName: string,
    travelName: string,
    endTime: string
  ): BookingResponseDto {
    return {
      id: booking.id,
      chivaId: booking.chivaId,
      chivaName,
      travelId: booking.travel,
      travelName,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      guestCount: booking.guestCount,
      eventDate: booking.eventDate.toISOString().split("T")[0],
      startTime: booking.startTime,
      endTime,
      durationHours: booking.durationHours,
      totalPrice: booking.totalPrice,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
    };
  }
}
