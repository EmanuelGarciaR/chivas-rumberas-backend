import { IChivaRepository } from "../../../domain/repositories/IChivaRepository";
import { ChivaResponseDto } from "../../dtos/ChivaDto";
import { ChivaNotFoundError } from "../../../domain/errors/DomainErrors";

/**
 * Caso de uso: Obtener el detalle de una chiva por ID.
 * Usado en la vista de detalle antes de hacer la reserva.
 */
export class GetChivaByIdUseCase {
  constructor(private readonly chivaRepository: IChivaRepository) {}

  async execute(chivaId: string): Promise<ChivaResponseDto> {
    const chiva = await this.chivaRepository.findById(chivaId);
    if (!chiva) throw new ChivaNotFoundError(chivaId);

    return {
      id: chiva.id,
      name: chiva.name,
      description: chiva.description,
      capacity: chiva.capacity,
      imageUrls: chiva.imageUrls,
      pricePerHour: chiva.pricePerHour,
      status: chiva.status,
      features: chiva.features,
    };
  }
}
