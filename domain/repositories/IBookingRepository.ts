import { Booking, BookingStatus, CalendarSyncStatus } from "../models/Booking";

export interface BookingFilters {
  chivaId?: string;
  date?: Date;
  status?: BookingStatus;
}

export interface PaginatedBookingsQuery {
  page: number;
  limit: number;
  status?: BookingStatus;
  q?: string;
}

export interface PaginatedBookingsResult {
  data: Booking[];
  total: number;
}


//  * Contrato del repositorio de Bookings.
//  * La capa de infraestructura debe implementar esta interfaz.
export interface IBookingRepository {
  findBookingById(id: string): Promise<Booking | null>;

  findBookingAll(filters?: BookingFilters): Promise<Booking[]>;

  findBookingPaginated(query: PaginatedBookingsQuery): Promise<PaginatedBookingsResult>;

  findConfirmedByDateRange(startDate: Date, endDate: Date): Promise<Booking[]>;

  findOccupiedSlotsByChivaAndDate(
    chivaId: string,
    date: Date
  ): Promise<Array<{ startTime: string; durationHours: number }>>;

  hasConflict(
    chivaId: string,
    eventDate: Date,
    startTime: string,
    durationHours: number,
    excludeBookingId?: string
  ): Promise<boolean>;

  hasFutureActiveBookingsByChiva(chivaId: string, fromDate?: Date): Promise<boolean>;

  saveBooking(booking: Booking): Promise<Booking>;

  updateBookingStatus(id: string, status: BookingStatus, totalPrice?: number): Promise<Booking>;

  updateBookingCalendarSync(
    id: string,
    data: { googleEventId?: string | null; calendarSyncStatus: CalendarSyncStatus }
  ): Promise<Booking>;
}
