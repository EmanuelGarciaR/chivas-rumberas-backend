export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type CalendarSyncStatus = "pending" | "synced" | "failed";

export interface Booking {
  id: string;
  chivaId: string;
  chivaName?: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  guestCount: number;
  travel: string;
  travelName?: string;
  eventDate: Date;
  startTime: string;
  durationHours: number;
  totalPrice: number;
  status: BookingStatus;
  notes?: string;
  googleEventId?: string | null;
  calendarSyncStatus?: CalendarSyncStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Determina si la fecha y hora programada de una reserva (en America/Bogota, UTC-05:00)
 * ya se cumplió respecto a la fecha/hora actual.
 */
export function hasBookingDateTimePassed(
  eventDate: Date,
  startTime: string,
  now: Date = new Date()
): boolean {
  const dateStr = eventDate.toISOString().split("T")[0];
  const timeStr = /^([01]\d|2[0-3]):([0-5]\d)$/.test(startTime?.trim())
    ? startTime.trim()
    : "00:00";
  const scheduledBogota = new Date(`${dateStr}T${timeStr}:00-05:00`);
  return scheduledBogota.getTime() <= now.getTime();
}
