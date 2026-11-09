export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Booking {
  id: string;
  chivaId: string;
  chivaName?: string;
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
  createdAt: Date;
  updatedAt: Date;
}
