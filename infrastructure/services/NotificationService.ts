import { INotificationService } from "../../application/ports/INotificationService";
import { IEmailService } from "../../application/ports/IEmailService";
import { IWhatsAppService } from "../../application/ports/IWhatsAppService";
import { BookingResponseDto } from "../../application/dtos/BookingDto";

/**
 * Servicio de notificaciones compuesto.
 * Orquesta el envío simultáneo por email y WhatsApp.
 * Si un canal falla, el otro sigue funcionando (Promise.allSettled).
 */
export class NotificationService implements INotificationService {
  constructor(
    private readonly emailService: IEmailService,
    private readonly whatsAppService?: IWhatsAppService
  ) {}

  async sendBookingConfirmation(booking: BookingResponseDto): Promise<void> {
    await Promise.allSettled([
      this.emailService.sendBookingConfirmation(booking),
      // this.whatsAppService.sendBookingConfirmation(booking),
    ]);
  }

  async sendNewBookingAlert(booking: BookingResponseDto): Promise<void> {
    // La alerta al admin solo va por email
    await this.emailService.sendNewBookingAlert(booking);
  }

  async sendBookingStatusUpdate( booking: BookingResponseDto, previousStatus: string ): Promise<void> {
    await Promise.allSettled([
      this.emailService.sendBookingStatusUpdate(booking, previousStatus),
      // this.whatsAppService.sendBookingStatusUpdate(booking, previousStatus),
    ]);
  }
}
