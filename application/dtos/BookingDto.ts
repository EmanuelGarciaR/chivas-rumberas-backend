import { BookingStatus } from "../../domain/models/Booking";

/**
 * DTO de entrada: datos del formulario para crear una reserva.
 */
export interface CreateBookingDto {
  chivaId: string;
  travelId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  guestCount: number;
  eventDate: string;      // "YYYY-MM-DD"
  startTime: string;      // "HH:mm" (24h)
  durationHours: number;
  notes?: string;
}

/**
 * DTO de salida: datos de una reserva que se devuelven al cliente.
 */
export interface BookingResponseDto {
  id: string;
  chivaId: string;
  chivaName: string;
  travelId: string;
  travelName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  guestCount: number;
  eventDate: string;      // "YYYY-MM-DD"
  startTime: string;      // "HH:mm"
  endTime: string;        // "HH:mm" calculado
  durationHours: number;
  totalPrice: number;
  status: BookingStatus;
  notes?: string;
  createdAt: string;      // ISO string
}
