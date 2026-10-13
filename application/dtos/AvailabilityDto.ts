/**
 * DTO de salida: slot de tiempo ocupado en el calendario.
 * Se envía al frontend para bloquear horarios en el calendario.
 */
export interface OccupiedSlotDto {
  startTime: string;      // "HH:mm"
  endTime: string;        // "HH:mm"
  durationHours: number;
}

/**
 * DTO de salida: disponibilidad de una chiva en una fecha concreta.
 */
export interface AvailabilityResponseDto {
  chivaId: string;
  date: string;                    // "YYYY-MM-DD"
  occupiedSlots: OccupiedSlotDto[];
  isFullyBooked: boolean;
}

/**
 * DTO de entrada para consultar la disponibilidad.
 */
export interface GetAvailabilityDto {
  chivaId: string;
  date: string;           // "YYYY-MM-DD"
}
