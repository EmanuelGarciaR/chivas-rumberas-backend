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
