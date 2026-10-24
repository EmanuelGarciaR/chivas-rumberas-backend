import { BookingResponseDto } from "../dtos/BookingDto";

/**
 * Puerto del servicio de WhatsApp.
 * La capa de aplicación nunca importa Twilio directamente.
 */
export interface IWhatsAppService {
  sendBookingConfirmation(booking: BookingResponseDto): Promise<void>;
  sendBookingStatusUpdate(booking: BookingResponseDto, previousStatus: string): Promise<void>;
}
