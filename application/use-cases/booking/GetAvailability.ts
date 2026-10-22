import { IBookingRepository } from "../../../domain/repositories/IBookingRepository";
import { IChivaRepository } from "../../../domain/repositories/IChivaRepository";
import { GetAvailabilityDto, AvailabilityResponseDto, OccupiedSlotDto } from "../../dtos/AvailabilityDto";
import { ChivaNotFoundError } from "../../../domain/errors/DomainErrors";
import { TimeSlot } from "../../../domain/value-objects/TimeSlot";

// Horario operativo: 8:00 AM a 10:00 PM (en minutos desde medianoche)
const OPERATIONAL_START_MINUTES = 8 * 60;   // 480
const OPERATIONAL_END_MINUTES = 22 * 60;    // 1320

/**
 * Caso de uso: Obtener disponibilidad de una chiva en una fecha.
 *
 * Devuelve los slots ocupados para que el frontend pueda bloquear
 * horarios en el calendario y el selector de hora.
 */
export class GetAvailabilityUseCase {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly chivaRepository: IChivaRepository
  ) {}

  async execute(dto: GetAvailabilityDto): Promise<AvailabilityResponseDto> {
    // Validar que la chiva existe
    const chiva = await this.chivaRepository.findById(dto.chivaId);
    if (!chiva) throw new ChivaNotFoundError(dto.chivaId);

    const date = new Date(dto.date);

    // Obtener slots ya reservados de la BD
    const rawSlots = await this.bookingRepository.findOccupiedSlotsByChivaAndDate(
      dto.chivaId,
      date
    );

    // Calcular la hora de fin de cada slot usando el Value Object
    const occupiedSlots: OccupiedSlotDto[] = rawSlots.map((slot) => {
      const timeSlot = TimeSlot.create(slot.startTime, slot.durationHours);
      return {
        startTime: timeSlot.startTime,
        endTime: timeSlot.getEndTime(),
        durationHours: timeSlot.durationHours,
      };
    });

    // Determinar si la chiva está completamente ocupada para ese día
    const isFullyBooked = this.checkIfFullyBooked(occupiedSlots);

    return {
      chivaId: dto.chivaId,
      date: dto.date,
      occupiedSlots,
      isFullyBooked,
    };
  }

  /**
   * Considera la chiva como "completamente ocupada" si los slots reservados
   * cubren todo el horario operativo (8:00 - 22:00).
   */
  private checkIfFullyBooked(slots: OccupiedSlotDto[]): boolean {
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const totalOperationalMinutes = OPERATIONAL_END_MINUTES - OPERATIONAL_START_MINUTES;
    const bookedMinutes = slots.reduce((acc, slot) => {
      const start = Math.max(toMinutes(slot.startTime), OPERATIONAL_START_MINUTES);
      const end = Math.min(toMinutes(slot.endTime), OPERATIONAL_END_MINUTES);
      return acc + Math.max(0, end - start);
    }, 0);

    return bookedMinutes >= totalOperationalMinutes;
  }
}
