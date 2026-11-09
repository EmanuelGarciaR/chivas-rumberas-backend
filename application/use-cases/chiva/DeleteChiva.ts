import { ChivaResponseDto } from "../../dtos/ChivaDto";
import {
  ChivaHasActiveBookingsError,
  ChivaNotFoundError,
} from "../../../domain/errors/DomainErrors";
import { IBookingRepository } from "../../../domain/repositories/IBookingRepository";
import { IChivaRepository } from "../../../domain/repositories/IChivaRepository";

export class DeleteChivaUseCase {
  constructor(
    private readonly chivaRepository: IChivaRepository,
    private readonly bookingRepository: IBookingRepository
  ) {}

  async execute(chivaId: string): Promise<ChivaResponseDto> {
    const chiva = await this.chivaRepository.findChivaById(chivaId);
    if (!chiva) throw new ChivaNotFoundError(chivaId);

    const hasActiveBookings = await this.bookingRepository.hasFutureActiveBookingsByChiva(chivaId);
    if (hasActiveBookings) {
      throw new ChivaHasActiveBookingsError(chivaId);
    }

    const updated = await this.chivaRepository.updateChivaStatus(chivaId, "retired");

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      capacity: updated.capacity,
      imageUrls: updated.imageUrls,
      pricePerHour: updated.pricePerHour,
      status: updated.status,
      features: updated.features,
    };
  }
}
