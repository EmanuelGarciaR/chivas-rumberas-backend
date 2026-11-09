import { TrackBookingResponseDto } from "../../dtos/BookingDto";
import { BookingNotFoundError, ValidationError } from "../../../domain/errors/DomainErrors";
import { IBookingRepository } from "../../../domain/repositories/IBookingRepository";
import { IChivaRepository } from "../../../domain/repositories/IChivaRepository";
import { ITravelRepository } from "../../../domain/repositories/ITravelRepository";
import { TimeSlot } from "../../../domain/value-objects/TimeSlot";

export interface TrackBookingQuery {
  code: string;
  email: string;
}

export class TrackBookingUseCase {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly chivaRepository: IChivaRepository,
    private readonly travelRepository: ITravelRepository
  ) {}

  async execute(query: TrackBookingQuery): Promise<TrackBookingResponseDto> {
    const code = query.code?.trim().toUpperCase();
    const email = query.email?.trim().toLowerCase();

    if (!code || !email) {
      throw new ValidationError("Los parámetros code y email son requeridos.");
    }

    const booking = await this.bookingRepository.findBookingById(code);

    // Mismo 404 genérico si no existe el código o si el correo no coincide
    if (!booking || booking.customerEmail.trim().toLowerCase() !== email) {
      throw new BookingNotFoundError();
    }

    let chivaName = booking.chivaName;
    let travelName = booking.travelName;

    if (chivaName === undefined) {
      const chiva = await this.chivaRepository.findChivaById(booking.chivaId);
      chivaName = chiva?.name ?? "";
    }
    if (travelName === undefined) {
      const travel = await this.travelRepository.findTravelById(booking.travel);
      travelName = travel?.name ?? "";
    }

    const timeSlot = TimeSlot.create(booking.startTime, booking.durationHours);

    return {
      id: booking.id,
      code: booking.id,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
      chivaId: booking.chivaId,
      chivaName,
      travelId: booking.travel,
      travelName,
      eventDate: booking.eventDate.toISOString().split("T")[0],
      startTime: booking.startTime,
      endTime: timeSlot.getEndTime(),
      durationHours: booking.durationHours,
      guestCount: booking.guestCount,
      totalPrice: booking.totalPrice,
    };
  }
}
