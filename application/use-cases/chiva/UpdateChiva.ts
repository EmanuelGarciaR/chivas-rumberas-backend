import { UpdateChivaDto, ChivaResponseDto } from "../../dtos/ChivaDto";
import { ChivaNotFoundError, ValidationError } from "../../../domain/errors/DomainErrors";
import { ChivaStatus } from "../../../domain/models/Chiva";
import { IChivaRepository } from "../../../domain/repositories/IChivaRepository";

const CHIVA_STATUSES: ChivaStatus[] = ["available", "maintenance", "retired"];

export class UpdateChivaUseCase {
  constructor(private readonly chivaRepository: IChivaRepository) {}

  async execute(chivaId: string, updates: UpdateChivaDto): Promise<ChivaResponseDto> {
    if (updates.pricePerHour === undefined && updates.status === undefined) {
      throw new ValidationError("Debe proporcionar pricePerHour o status.");
    }

    if (
      updates.pricePerHour !== undefined &&
      (!Number.isFinite(updates.pricePerHour) || updates.pricePerHour <= 0)
    ) {
      throw new ValidationError("pricePerHour debe ser un número mayor que cero.");
    }

    if (updates.status !== undefined && !CHIVA_STATUSES.includes(updates.status)) {
      throw new ValidationError("status no es válido.");
    }

    const chiva = await this.chivaRepository.findChivaById(chivaId);
    if (!chiva) throw new ChivaNotFoundError(chivaId);

    const updated = await this.chivaRepository.updateChiva(chivaId, updates);
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
