// import twilio from "twilio";
// import { IWhatsAppService } from "../../application/ports/IWhatsAppService";
// import { BookingResponseDto } from "../../application/dtos/BookingDto";

// // /**
// //  * Implementación del servicio de WhatsApp usando Twilio.
// //  *
// //  * ─── CONFIGURACIÓN PASO A PASO ────────────────────────────────────────────
// //  * 1. Crea cuenta en https://www.twilio.com/try-twilio
// //  * 2. En el dashboard, ve a Messaging → Try it out → Send a WhatsApp message
// //  * 3. Sigue el sandbox: conecta tu número personal enviando el código al +1 415 523 8886
// //  * 4. En el .env configura:
// //  *    TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// //  *    TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// //  *    TWILIO_WHATSAPP_FROM=whatsapp:+14155238886   ← número del sandbox Twilio
// //  *
// //  * Para producción: solicita aprobación de WhatsApp Business en Twilio Console.
// //  * ──────────────────────────────────────────────────────────────────────────
// //  */
// export class WhatsAppTwilioService implements IWhatsAppService {
//   private readonly client: ReturnType<typeof twilio>;
//   private readonly fromNumber: string;
//   private readonly isConfigured: boolean;

//   constructor() {
//     const accountSid = process.env.TWILIO_ACCOUNT_SID;
//     const authToken = process.env.TWILIO_AUTH_TOKEN;
//     this.fromNumber = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

//     // Si no están configuradas las credenciales, el servicio se desactiva sin romper la app
//     this.isConfigured = Boolean(accountSid && authToken);

//     if (this.isConfigured) {
//       this.client = twilio(accountSid!, authToken!);
//       console.log("[WhatsApp] Servicio Twilio inicializado ✅");
//     } else {
//       console.warn(
//         "[WhatsApp] TWILIO_ACCOUNT_SID o TWILIO_AUTH_TOKEN no configurados. " +
//         "El servicio de WhatsApp está desactivado."
//       );
//     }
//   }

//   /** Envía confirmación de reserva por WhatsApp al cliente */
//   async sendBookingConfirmation(booking: BookingResponseDto): Promise<void> {
//     if (!this.isConfigured) return;

//     const phone = this.formatPhone(booking.customerPhone);
//     if (!phone) {
//       console.warn(`[WhatsApp] Número inválido: ${booking.customerPhone}`);
//       return;
//     }

//     const message =
//     //   `🎉 *¡Reserva recibida!* Chivas Rumberas\n\n` +
//       `Hola ${booking.customerName} 👋\n` +
//       `Tu reserva #${booking.id.slice(0, 8).toUpperCase()} fue registrada exitosamente.\n\n` +
//       `🚌 *Chiva:* ${booking.chivaName}\n` +
//       `🗺️ *Recorrido:* ${booking.travelName}\n` +
//       `📅 *Fecha:* ${booking.eventDate}\n` +
//       `⏰ *Horario:* ${booking.startTime} – ${booking.endTime}\n` +
//       `👥 *Invitados:* ${booking.guestCount}\n` +
//       `💰 *Total:* $${booking.totalPrice.toLocaleString("es-CO")} COP\n\n` +
//       `Te contactaremos pronto para confirmar. ¡Gracias! 🥳`;

//     await this.send(phone, message);
//   }

//   /** Notifica al cliente cuando cambia el estado de su reserva */
//   async sendBookingStatusUpdate(
//     booking: BookingResponseDto,
//     previousStatus: string
//   ): Promise<void> {
//     if (!this.isConfigured) return;

//     const phone = this.formatPhone(booking.customerPhone);
//     if (!phone) return;

//     const statusEmojis: Record<string, string> = {
//       confirmed: "✅",
//       cancelled: "❌",
//       completed: "🏁",
//       pending: "⏳",
//     };

//     const emoji = statusEmojis[booking.status] ?? "📋";
//     const message =
//       `${emoji} *Actualización de tu reserva*\n\n` +
//       `Hola ${booking.customerName},\n` +
//       `Tu reserva #${booking.id.slice(0, 8).toUpperCase()} cambió de estado:\n` +
//       `${previousStatus} → *${booking.status}*\n\n` +
//       `📅 ${booking.eventDate} | ⏰ ${booking.startTime} – ${booking.endTime}\n\n` +
//       `¿Tienes alguna pregunta? Escríbenos aquí.`;

//     await this.send(phone, message);
//   }

//   /** Envía un mensaje de WhatsApp. Captura errores sin romper el flujo principal. */
//   private async send(to: string, body: string): Promise<void> {
//     try {
//       const msg = await this.client.messages.create({
//         from: this.fromNumber,
//         to,
//         body,
//       });
//       console.log(`[WhatsApp] Mensaje enviado a ${to} — SID: ${msg.sid}`);
//     } catch (error) {
//       console.error(`[WhatsApp] Error enviando a ${to}:`, error);
//       // No lanzamos el error para que un fallo en WhatsApp no cancele la reserva
//     }
//   }

//   /**
//    * Formatea el número de teléfono al formato internacional de WhatsApp.
//    * Ajusta el prefijo según el país (por defecto +57 para Colombia).
//    */
//   private formatPhone(phone: string): string | null {
//     const digits = phone.replace(/\D/g, "");

//     // Si ya tiene código de país (11+ dígitos)
//     if (digits.length >= 11) return `whatsapp:+${digits}`;

//     // Asume Colombia (+57) si son 10 dígitos
//     if (digits.length === 10) return `whatsapp:+57${digits}`;

//     return null;
//   }
// }
