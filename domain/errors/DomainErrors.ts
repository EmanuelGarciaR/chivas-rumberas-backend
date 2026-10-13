/**
Errores propios del dominio de negocio.
**/

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class ChivaNotFoundError extends DomainError {
  constructor(chivaId: string) {
    super(`La chiva con ID "${chivaId}" no fue encontrada.`);
    this.name = "ChivaNotFoundError";
  }
}

export class ChivaNotAvailableError extends DomainError {
  constructor(chivaId: string) {
    super(`La chiva con ID "${chivaId}" no está disponible para reservas.`);
    this.name = "ChivaNotAvailableError";
  }
}

export class BookingConflictError extends DomainError {
  constructor(chivaId: string, date: string, startTime: string) {
    super(
      `La chiva "${chivaId}" ya tiene una reserva el ${date} a las ${startTime}. Por favor elige otro horario.`
    );
    this.name = "BookingConflictError";
  }
}

export class BookingNotFoundError extends DomainError {
  constructor(bookingId: string) {
    super(`La reserva con ID "${bookingId}" no fue encontrada.`);
    this.name = "BookingNotFoundError";
  }
}

export class InvalidBookingStatusTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`No se puede cambiar el estado de "${from}" a "${to}".`);
    this.name = "InvalidBookingStatusTransitionError";
  }
}

export class RouteNotFoundError extends DomainError {
  constructor(routeId: string) {
    super(`El recorrido con ID "${routeId}" no fue encontrado.`);
    this.name = "RouteNotFoundError";
  }
}
