import { google } from "googleapis";
import { CalendarEventInput, CalendarService } from "../../application/ports/CalendarService";

const BOGOTA_TIMEZONE = "America/Bogota";
const CALENDAR_TIMEOUT_MS = 8000;

/**
 * Adaptador de Google Calendar usando Cuenta de Servicio (Service Account).
 * Variables requeridas:
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL
 * - GOOGLE_PRIVATE_KEY (con soporte para saltos de línea escapados \n)
 * - GOOGLE_CALENDAR_ID
 */
export class GoogleCalendarService implements CalendarService {
  private getClient() {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim().replace(/^["']|["']$/g, "");
    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY?.trim().replace(/^["']|["']$/g, "");
    const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim().replace(/^["']|["']$/g, "");

    if (!clientEmail || !rawPrivateKey || !calendarId) {
      throw new Error(
        "Credenciales de Google Calendar no configuradas (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_CALENDAR_ID)."
      );
    }

    const privateKey = rawPrivateKey.replace(/\\n/g, "\n");

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
    });

    const calendar = google.calendar({ version: "v3", auth });

    return { calendar, calendarId };
  }

  async createEvent(event: CalendarEventInput): Promise<string> {
    const { calendar, calendarId } = this.getClient();

    // America/Bogota es UTC-05:00 permanentemente (sin horario de verano)
    const startDate = new Date(`${event.eventDate}T${event.startTime}:00-05:00`);
    const endDate = new Date(startDate.getTime() + event.durationHours * 60 * 60 * 1000);

    const summary = `Chiva ${event.chivaName} · ${event.customerName}`;
    const descriptionLines = [
      `Código: ${event.bookingId}`,
      `Recorrido: ${event.travelName}`,
      `Invitados: ${event.guestCount}`,
      `Teléfono: ${event.customerPhone}`,
      `Notas: ${event.notes?.trim() ? event.notes.trim() : "Sin notas"}`,
    ];

    try {
      const response = await this.withTimeout(
        calendar.events.insert({
          calendarId,
          requestBody: {
            summary,
            description: descriptionLines.join("\n"),
            start: {
              dateTime: startDate.toISOString(),
              timeZone: BOGOTA_TIMEZONE,
            },
            end: {
              dateTime: endDate.toISOString(),
              timeZone: BOGOTA_TIMEZONE,
            },
          },
        }),
        CALENDAR_TIMEOUT_MS
      );

      const eventId = response.data.id;
      if (!eventId) {
        throw new Error("Google Calendar no devolvió un ID de evento.");
      }

      return eventId;
    } catch (err: any) {
      if (err?.code === 404 || err?.status === 404) {
        throw new Error(
          `Google Calendar devolvió 404 Not Found para el calendario "${calendarId}". ` +
            `Verifica que hayas compartido ese calendario en Google Calendar ("Compartir con personas o grupos específicos") ` +
            `con el correo "${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim()}" dándole permiso "Hacer cambios en los eventos", ` +
            `o si creaste un calendario secundario usa su ID terminado en @group.calendar.google.com.`
        );
      }
      throw err;
    }
  }

  async deleteEvent(googleEventId: string): Promise<void> {
    const { calendar, calendarId } = this.getClient();

    await this.withTimeout(
      calendar.events.delete({
        calendarId,
        eventId: googleEventId,
      }),
      CALENDAR_TIMEOUT_MS
    );
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    try {
      const timeoutPromise = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Timeout de Google Calendar tras ${timeoutMs}ms`));
        }, timeoutMs);
      });
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
