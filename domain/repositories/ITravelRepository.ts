import { Travel } from "../models/Travel";

/**
 * Contrato del repositorio de Recorridos.
 */
export interface ITravelRepository {
  findAllTravelsActive(): Promise<Travel[]>;

  findTravelById(id: string): Promise<Travel | null>;

  saveTravel(travel: Travel): Promise<Travel>;
}
