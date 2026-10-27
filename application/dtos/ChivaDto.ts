import { ChivaStatus } from "../../domain/models/Chiva";

/**
 * DTO de salida: datos de una chiva que se devuelven al cliente.
 */
export interface ChivaResponseDto {
  id: string;
  name: string;
  description: string;
  capacity: number;
  imageUrls: string[];
  pricePerHour: number;
  status: ChivaStatus;
  features: string[];
}

export interface UpdateChivaDto {
  pricePerHour?: number;
  status?: ChivaStatus;
}
