import { ChivaResponseDto } from "../../dtos/ChivaDto";
import { ChivaNotFoundError } from "../../../domain/errors/DomainErrors";
import { ChivaStatus } from "../../../domain/models/Chiva";
import { IChivaRepository } from "../../../domain/repositories/IChivaRepository";

export class UpdateChivaStatusUseCase {
  constructor(private readonly chivaRepository: IChivaRepository) {}

  async execute(chivaId: string, status: ChivaStatus): Promise<ChivaResponseDto> {
    const chiva = await this.chivaRepository.findChivaById(chivaId);
    if (!chiva) throw new ChivaNotFoundError(chivaId);

    const updated = await this.chivaRepository.updateChivaStatus(chivaId, status);
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
