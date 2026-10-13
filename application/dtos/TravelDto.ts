/**
 * DTO de salida: datos de un recorrido.
 */
export interface TravelResponseDto {
  id: string;
  name: string;
  description: string;
  durationHours: number;
  highlights: string[];
}
