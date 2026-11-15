import { Chiva, ChivaStatus } from "../models/Chiva";

export interface UpdateChivaFields {
  name?: string;
  description?: string;
  capacity?: number;
  pricePerHour?: number;
  status?: ChivaStatus;
  features?: string[];
  imageUrls?: string[];
}

/**
 * Contrato del repositorio de Chivas.
 * La capa de infraestructura debe implementar esta interfaz.
 * La capa de dominio NUNCA importa de infraestructura.
 */
export interface IChivaRepository {
  findChivaAll(status?: ChivaStatus): Promise<Chiva[]>;

  findChivaById(id: string): Promise<Chiva | null>;

  saveChiva(chiva: Chiva): Promise<Chiva>;

  updateChivaStatus(id: string, status: ChivaStatus): Promise<Chiva>;

  updateChiva(id: string, updates: UpdateChivaFields): Promise<Chiva>;
}
