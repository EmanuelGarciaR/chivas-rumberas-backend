import { BookingResponseDto } from "../dtos/BookingDto";

/**
 * Puerto: servicio de notificaciones.
 * La capa de aplicación depende de esta interfaz, nunca de la implementación concreta
 * (que vivirá en infrastructure/services/).
 */
export interface INotificationService {
  /**
  Envía email de confirmación al cliente tras crear una reserva.
   */
  sendBookingConfirmation(booking: BookingResponseDto): Promise<void>;

  /**
  Notifica al operador de una nueva reserva pendiente.
   */
  sendNewBookingAlert(booking: BookingResponseDto): Promise<void>;

  /**
  Envía email al cliente cuando su reserva es confirmada por el operador.
   */
  sendBookingStatusUpdate(booking: BookingResponseDto, previousStatus: string): Promise<void>;
}
