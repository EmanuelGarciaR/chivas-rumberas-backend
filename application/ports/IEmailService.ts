import { BookingResponseDto } from "../dtos/BookingDto";

/**
 * Puerto del servicio de email.
 * La capa de aplicación nunca importa Resend/nodemailer directamente.
 */
export interface IEmailService {
  sendBookingConfirmation(booking: BookingResponseDto): Promise<void>;
  sendNewBookingAlert(booking: BookingResponseDto): Promise<void>;
  sendBookingStatusUpdate(booking: BookingResponseDto, previousStatus: string): Promise<void>;
}
