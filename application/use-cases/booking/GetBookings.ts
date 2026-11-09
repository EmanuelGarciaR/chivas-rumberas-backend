import {
  BookingResponseDto,
  GetBookingsQueryDto,
  PaginatedBookingsResponseDto,
} from "../../dtos/BookingDto";
import { IBookingRepository } from "../../../domain/repositories/IBookingRepository";
import { IChivaRepository } from "../../../domain/repositories/IChivaRepository";
import { ITravelRepository } from "../../../domain/repositories/ITravelRepository";
import { TimeSlot } from "../../../domain/value-objects/TimeSlot";
import { BookingStatus } from "../../../domain/models/Booking";
import { ValidationError } from "../../../domain/errors/DomainErrors";

const VALID_BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
];

export class GetBookingsUseCase {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly chivaRepository: IChivaRepository,
    private readonly travelRepository: ITravelRepository
  ) {}

  async execute(query: GetBookingsQueryDto = {}): Promise<PaginatedBookingsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (!Number.isInteger(page) || page < 1) {
      throw new ValidationError("El parámetro page debe ser un entero mayor o igual a 1.");
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw new ValidationError("El parámetro limit debe ser un entero entre 1 y 50.");
    }

    if (query.status !== undefined && !VALID_BOOKING_STATUSES.includes(query.status)) {
      throw new ValidationError("El parámetro status no es válido.");
    }

    const q = query.q?.trim() || undefined;

    const { data: bookings, total } = await this.bookingRepository.findBookingPaginated({
      page,
      limit,
      status: query.status,
      q,
    });

    const data: BookingResponseDto[] = await Promise.all(
      bookings.map(async (booking) => {
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
          endTime: timeSlot.getEndTime(),
          durationHours: booking.durationHours,
          totalPrice: booking.totalPrice,
          status: booking.status,
          notes: booking.notes,
          calendarSyncStatus: booking.calendarSyncStatus ?? "pending",
          createdAt: booking.createdAt.toISOString(),
        };
      })
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
