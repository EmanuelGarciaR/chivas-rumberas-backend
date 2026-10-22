import { ITravelRepository } from "../../../domain/repositories/ITravelRepository";
import { TravelResponseDto } from "../../dtos/TravelDto";

/**
 * Caso de uso: Obtener todos los recorridos activos.
 * Alimenta el selector de recorrido en el formulario de reserva.
 */
export class GetTravelsUseCase {
  constructor(private readonly travelRepository: ITravelRepository) {}

  async execute(): Promise<TravelResponseDto[]> {
    const travels = await this.travelRepository.findAllTravelsActive();

    return travels.map((travel) => ({
      id: travel.id,
      name: travel.name,
      description: travel.description,
      durationHours: travel.durationHours,
      highlights: travel.highlights,
    }));
  }
}
