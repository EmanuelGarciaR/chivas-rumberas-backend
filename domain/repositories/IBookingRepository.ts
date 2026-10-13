import { Booking, BookingStatus } from "../models/Booking";

export interface BookingFilters {
  chivaId?: string;
  date?: Date;
  status?: BookingStatus;
}


//  * Contrato del repositorio de Bookings.
//  * La capa de infraestructura debe implementar esta interfaz.
export interface IBookingRepository {
  findBookingById(id: string): Promise<Booking | null>;

  findBookingAll(filters?: BookingFilters): Promise<Booking[]>;

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

  saveBooking(booking: Booking): Promise<Booking>;

  updateBookingStatus(id: string, status: BookingStatus): Promise<Booking>;

  deleteBooking(id: string): Promise<void>;
}
