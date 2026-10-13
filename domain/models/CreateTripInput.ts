export interface CreateTripInput {
  chivaId: string;
  routeId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  guestCount: number;
  eventDate: string;
  startTime: string;
  durationHours: number;
  notes?: string;
}
