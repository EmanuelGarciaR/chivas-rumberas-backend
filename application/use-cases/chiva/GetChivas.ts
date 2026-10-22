import { IChivaRepository } from "../../../domain/repositories/IChivaRepository";
import { ChivaResponseDto } from "../../dtos/ChivaDto";
import { ChivaStatus } from "../../../domain/models/Chiva";

/**
 * Caso de uso: Obtener el listado de chivas disponibles.
 * Usado en la landing page y en el formulario de reserva.
 */
export class GetChivasUseCase {
  constructor(private readonly chivaRepository: IChivaRepository) {}

  async execute(status?: ChivaStatus): Promise<ChivaResponseDto[]> {
    const chivas = await this.chivaRepository.findChivaAll(status);

    return chivas.map((chiva) => ({
      id: chiva.id,
      name: chiva.name,
      description: chiva.description,
      capacity: chiva.capacity,
      imageUrls: chiva.imageUrls,
      pricePerHour: chiva.pricePerHour,
      status: chiva.status,
      features: chiva.features,
    }));
  }
}
