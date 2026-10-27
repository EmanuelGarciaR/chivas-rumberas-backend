import { BookingResponseDto } from "../../dtos/BookingDto";
import { IBookingRepository } from "../../../domain/repositories/IBookingRepository";
import { IChivaRepository } from "../../../domain/repositories/IChivaRepository";
import { ITravelRepository } from "../../../domain/repositories/ITravelRepository";
import { TimeSlot } from "../../../domain/value-objects/TimeSlot";

export class GetBookingsUseCase {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly chivaRepository: IChivaRepository,
    private readonly travelRepository: ITravelRepository
  ) {}

  async execute(): Promise<BookingResponseDto[]> {
    const bookings = await this.bookingRepository.findBookingAll();
    const enriched = await Promise.all(
      bookings.map(async (booking) => {
        const [chiva, travel] = await Promise.all([
          this.chivaRepository.findChivaById(booking.chivaId),
          this.travelRepository.findTravelById(booking.travel),
        ]);
        const timeSlot = TimeSlot.create(booking.startTime, booking.durationHours);

        return {
          id: booking.id,
          chivaId: booking.chivaId,
          chivaName: chiva?.name ?? "",
          travelId: booking.travel,
          travelName: travel?.name ?? "",
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
      })
    );
    return enriched;
  }
}
