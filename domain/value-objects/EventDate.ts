import { ValidationError } from "../errors/DomainErrors";

/**
 * Value Object: EventDate
 * Representa la fecha de un evento con validaciones de negocio.
 * No se permiten fechas pasadas ni con menos de 24h de anticipación (en zona America/Bogota).
 */
export class EventDate {
  readonly value: Date;

  private constructor(date: Date) {
    this.value = date;
  }

  static create(date: Date | string, startTime?: string): EventDate {
    const rawStr =
      typeof date === "string"
        ? date.trim().split("T")[0]
        : date.toISOString().split("T")[0];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawStr)) {
      throw new ValidationError("Fecha inválida. Use el formato YYYY-MM-DD.");
    }

    const parsedDateOnly = new Date(`${rawStr}T00:00:00.000Z`);
    if (isNaN(parsedDateOnly.getTime())) {
      throw new ValidationError("Fecha inválida.");
    }

    // Evaluamos el momento exacto del evento en hora de Colombia (America/Bogota, UTC-05:00)
    const timePart =
      startTime && /^([01]\d|2[0-3]):([0-5]\d)$/.test(startTime.trim())
        ? startTime.trim()
        : "23:59";
    const eventMomentBogota = new Date(`${rawStr}T${timePart}:00-05:00`);

    const now = new Date();
    const minAdvanceMs = 24 * 60 * 60 * 1000; // 24 horas

    if (eventMomentBogota.getTime() - now.getTime() < minAdvanceMs) {
      throw new ValidationError(
        "Debes agendar tu reserva con más de un día de anticipación (mínimo 24 horas antes del evento)."
      );
    }

    return new EventDate(parsedDateOnly);
  }

  /** Devuelve la fecha en formato YYYY-MM-DD */
  toDateString(): string {
    return this.value.toISOString().split("T")[0];
  }

  /** Verifica si es el mismo día que otra fecha */
  isSameDay(other: EventDate): boolean {
    return this.toDateString() === other.toDateString();
  }
}
