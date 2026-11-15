import { UpdateChivaDto, ChivaResponseDto } from "../../dtos/ChivaDto";
import { ChivaNotFoundError, ValidationError } from "../../../domain/errors/DomainErrors";
import { ChivaStatus } from "../../../domain/models/Chiva";
import { IChivaRepository } from "../../../domain/repositories/IChivaRepository";

const CHIVA_STATUSES: ChivaStatus[] = ["available", "maintenance", "retired"];
const MAX_CHIVA_IMAGES = 10;

export class UpdateChivaUseCase {
  constructor(private readonly chivaRepository: IChivaRepository) {}

  async execute(chivaId: string, updates: UpdateChivaDto): Promise<ChivaResponseDto> {
    const hasUpdates =
      updates.name !== undefined ||
      updates.description !== undefined ||
      updates.capacity !== undefined ||
      updates.pricePerHour !== undefined ||
      updates.features !== undefined ||
      updates.status !== undefined ||
      updates.imageUrls !== undefined;

    if (!hasUpdates) {
      throw new ValidationError("Debe proporcionar al menos un campo para actualizar.");
    }

    if (updates.name !== undefined && !updates.name.trim()) {
      throw new ValidationError("El nombre de la chiva no puede estar vacío.");
    }

    if (updates.description !== undefined && !updates.description.trim()) {
      throw new ValidationError("La descripción de la chiva no puede estar vacía.");
    }

    if (
      updates.capacity !== undefined &&
      (!Number.isInteger(updates.capacity) || updates.capacity <= 0)
    ) {
      throw new ValidationError("capacity debe ser un entero mayor que cero.");
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

    if (updates.imageUrls !== undefined) {
      if (!Array.isArray(updates.imageUrls) || updates.imageUrls.length > MAX_CHIVA_IMAGES) {
        throw new ValidationError(`Máximo ${MAX_CHIVA_IMAGES} fotos permitidas por chiva.`);
      }
    }

    const chiva = await this.chivaRepository.findChivaById(chivaId);
    if (!chiva) throw new ChivaNotFoundError(chivaId);

    const updated = await this.chivaRepository.updateChiva(chivaId, {
      ...(updates.name !== undefined && { name: updates.name.trim() }),
      ...(updates.description !== undefined && { description: updates.description.trim() }),
      ...(updates.capacity !== undefined && { capacity: updates.capacity }),
      ...(updates.pricePerHour !== undefined && { pricePerHour: updates.pricePerHour }),
      ...(updates.features !== undefined && { features: updates.features }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.imageUrls !== undefined && { imageUrls: updates.imageUrls }),
    });

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
