import { IBookingRepository, BookingFilters } from "../../domain/repositories/IBookingRepository";
import { Booking, BookingStatus } from "../../domain/models/Booking";
import prisma from "../database/prismaClient";

/**
 * Implementación concreta del repositorio de Bookings usando Prisma + Neon.
 */
export class BookingRepository implements IBookingRepository {
  async findBookingById(id: string): Promise<Booking | null> {
    const row = await prisma.booking.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findBookingAll(filters?: BookingFilters): Promise<Booking[]> {
    const rows = await prisma.booking.findMany({
      where: {
        ...(filters?.chivaId && { chivaId: filters.chivaId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.date && {
          eventDate: {
            gte: new Date(filters.date.toISOString().split("T")[0] + "T00:00:00.000Z"),
            lt:  new Date(filters.date.toISOString().split("T")[0] + "T23:59:59.999Z"),
          },
        }),
      },
      orderBy: { eventDate: "asc" },
    });
    return rows.map(this.toDomain);
  }

  async findOccupiedSlotsByChivaAndDate(
    chivaId: string,
    date: Date
  ): Promise<Array<{ startTime: string; durationHours: number }>> {
    const dateStr = date.toISOString().split("T")[0];
    const rows = await prisma.booking.findMany({
      where: {
        chivaId,
        status: { in: ["pending", "confirmed"] },
        eventDate: {
          gte: new Date(dateStr + "T00:00:00.000Z"),
          lt:  new Date(dateStr + "T23:59:59.999Z"),
        },
      },
      select: { startTime: true, durationHours: true },
    });
    return rows;
  }

  async hasConflict(
    chivaId: string,
    eventDate: Date,
    startTime: string,
    durationHours: number,
    excludeBookingId?: string
  ): Promise<boolean> {
    // Traer todos los slots activos de esa chiva ese día
    const occupied = await this.findOccupiedSlotsByChivaAndDate(chivaId, eventDate);

    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const newStart = toMinutes(startTime);
    const newEnd = newStart + durationHours * 60;

    return occupied.some((slot) => {
      const slotStart = toMinutes(slot.startTime);
      const slotEnd = slotStart + slot.durationHours * 60;
      return newStart < slotEnd && slotStart < newEnd;
    });
  }

  async saveBooking(booking: Booking): Promise<Booking> {
    const row = await prisma.booking.create({
      data: {
        id: booking.id,
        chivaId: booking.chivaId,
        travelId: booking.travel,   // En Booking.travel almacenamos el travelId
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        guestCount: booking.guestCount,
        eventDate: booking.eventDate,
        startTime: booking.startTime,
        durationHours: booking.durationHours,
        totalPrice: booking.totalPrice,
        status: booking.status,
        notes: booking.notes,
      },
    });
    return this.toDomain(row);
  }

  async updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
    const row = await prisma.booking.update({
      where: { id },
      data: { status },
    });
    return this.toDomain(row);
  }

  private toDomain(row: any): Booking {
    return {
      id: row.id,
      chivaId: row.chivaId,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone,
      guestCount: row.guestCount,
      travel: row.travelId,
      eventDate: row.eventDate,
      startTime: row.startTime,
      durationHours: row.durationHours,
      totalPrice: row.totalPrice,
      status: row.status as BookingStatus,
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
