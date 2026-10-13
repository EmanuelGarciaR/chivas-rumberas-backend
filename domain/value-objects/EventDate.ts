/**
 * Value Object: EventDate
 * Representa la fecha de un evento con validaciones de negocio.
 * No se permiten fechas pasadas ni con menos de 24h de anticipación.
 */
export class EventDate {
  readonly value: Date;

  private constructor(date: Date) {
    this.value = date;
  }

  static create(date: Date | string): EventDate {
    const parsed = typeof date === "string" ? new Date(date) : date;

    if (isNaN(parsed.getTime())) {
      throw new Error("Fecha inválida.");
    }

    const now = new Date();
    const minAdvanceMs = 24 * 60 * 60 * 1000; // 24 horas

    if (parsed.getTime() - now.getTime() < minAdvanceMs) {
      throw new Error(
        "La reserva debe hacerse con al menos 24 horas de anticipación."
      );
    }

    return new EventDate(parsed);
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
