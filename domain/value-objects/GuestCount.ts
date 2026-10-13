/**
 * Value Object: GuestCount
 * Representa la cantidad de invitados con validación de negocio.
 */
export class GuestCount {
  readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  static create(count: number, chivaCapacity: number): GuestCount {
    if (!Number.isInteger(count) || count < 1) {
      throw new Error("La cantidad de invitados debe ser un número entero mayor a 0.");
    }
    if (count > chivaCapacity) {
      throw new Error(
        `La cantidad de invitados (${count}) supera la capacidad de la chiva (${chivaCapacity}).`
      );
    }
    return new GuestCount(count);
  }
}
