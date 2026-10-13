/**
 * Value Object: TimeSlot
 * Representa un bloque de tiempo de una reserva.
 * Inmutable y con validación propia del negocio.
 */
export class TimeSlot {
  readonly startTime: string;    // HH:mm (24h)
  readonly durationHours: number;

  private constructor(startTime: string, durationHours: number) {
    this.startTime = startTime;
    this.durationHours = durationHours;
  }

  static create(startTime: string, durationHours: number): TimeSlot {
    if (!TimeSlot.isValidTime(startTime)) {
      throw new Error(`Hora inválida: "${startTime}". Use formato HH:mm (24h).`);
    }
    if (durationHours < 1 || durationHours > 12) {
      throw new Error("La duración debe estar entre 1 y 12 horas.");
    }
    return new TimeSlot(startTime, durationHours);
  }

  /** Calcula la hora de fin del slot */
  getEndTime(): string {
    const [hours, minutes] = this.startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + this.durationHours * 60;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMin = totalMinutes % 60;
    return `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
  }

  /** Verifica si este slot se solapa con otro */
  overlapsWith(other: TimeSlot): boolean {
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const thisStart = toMinutes(this.startTime);
    const thisEnd = thisStart + this.durationHours * 60;
    const otherStart = toMinutes(other.startTime);
    const otherEnd = otherStart + other.durationHours * 60;

    return thisStart < otherEnd && otherStart < thisEnd;
  }

  private static isValidTime(time: string): boolean {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(time);
  }
}
