/**
 * Puerto para sincronización de eventos en Google Calendar.
 */
export interface CalendarEventInput {
  bookingId: string;
  chivaName: string;
  customerName: string;
  customerPhone: string;
  travelName: string;
  guestCount: number;
  eventDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  durationHours: number;
  notes?: string;
}

export interface CalendarService {
  createEvent(event: CalendarEventInput): Promise<string>;
  deleteEvent(googleEventId: string): Promise<void>;
}

export type ICalendarService = CalendarService;
