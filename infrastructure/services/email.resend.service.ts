import { Resend } from "resend";
import { IEmailService } from "../../application/ports/IEmailService";
import { BookingResponseDto } from "../../application/dtos/BookingDto";
import { bookingConfirmationTemplate, bookingStatusUpdateTemplate } from "./email-templates";

/**
 * Implementación del servicio de email usando Resend.
 * Requiere RESEND_API_KEY y RESEND_FROM_EMAIL en las variables de entorno.
 *
 * Configuración en Resend:
 * 1. Crea cuenta en https://resend.com
 * 2. Genera una API Key en Settings → API Keys
 * 3. Verifica tu dominio en Domains (o usa onboarding@resend.dev para desarrollo)
 */
export class EmailResendService implements IEmailService {
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly adminEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY no está definido");

    this.resend = new Resend(apiKey);
    this.fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
    this.adminEmail = process.env.ADMIN_EMAIL ?? "";
  }

  /** Envía confirmación de reserva al cliente */
  async sendBookingConfirmation(booking: BookingResponseDto): Promise<void> {
    try{
      const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: booking.customerEmail,
      subject: `🎉 Reserva recibida #${booking.id.slice(0, 8).toUpperCase()} — Chivas Rumberas`,
      html: bookingConfirmationTemplate(booking),
      });
    } catch (error) {
      console.error("[Resend] Error de red o inesperado enviando confirmación:", error);
      throw new Error(`Error enviando email de confirmación: ${error instanceof Error ? error.message : String(error)}`);
    }
    console.log(`[Resend] Confirmación de reserva enviada a ${booking.customerEmail}`);
  }

  /** Envía alerta al administrador cuando llega una nueva reserva */
  async sendNewBookingAlert(booking: BookingResponseDto): Promise<void> {
    if (!this.adminEmail) {
      console.warn("[Resend] ADMIN_EMAIL no configurado, omitiendo alerta al admin.");
      return;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: this.adminEmail,
        subject: `📋 Nueva reserva #${booking.id.slice(0, 8).toUpperCase()} — ${booking.customerName}`,
        html: `
          <h2>Nueva reserva recibida</h2>
          <ul>
            <li><strong>Cliente:</strong> ${booking.customerName} (${booking.customerEmail})</li>
            <li><strong>Teléfono:</strong> ${booking.customerPhone}</li>
            <li><strong>Chiva:</strong> ${booking.chivaName}</li>
            <li><strong>Recorrido:</strong> ${booking.travelName}</li>
            <li><strong>Fecha:</strong> ${booking.eventDate} ${booking.startTime}–${booking.endTime}</li>
            <li><strong>Invitados:</strong> ${booking.guestCount}</li>
            <li><strong>Total:</strong> $${booking.totalPrice.toLocaleString("es-CO")} COP</li>
            ${booking.notes ? `<li><strong>Notas:</strong> ${booking.notes}</li>` : ""}
          </ul>
        `,
      });
    } catch (error) {
      console.error("[Resend] Error de red o inesperado enviando alerta al admin:", error);
      throw new Error(`Error enviando email de alerta: ${error instanceof Error ? error.message : String(error)}`);
    }
    console.log(`[Resend] Alerta de nueva reserva enviada a ${this.adminEmail}`);
  }

  /** Notifica al cliente cuando cambia el estado de su reserva */
  async sendBookingStatusUpdate(
    booking: BookingResponseDto,
    previousStatus: string
  ): Promise<void> {
    try{
      const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: booking.customerEmail,
      subject: `Actualización de tu reserva #${booking.id.slice(0, 8).toUpperCase()}`,
      html: bookingStatusUpdateTemplate(booking, previousStatus),
      });
    }catch (error) {
      console.error("[Resend] Error de red o inesperado enviando actualización de estado:", error);
      throw new Error(`Error enviando email de actualización: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log(`[Resend] Actualización de estado enviada a ${booking.customerEmail}`);
  }
}
