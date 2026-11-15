import {
  IBookingRepository,
  BookingFilters,
  PaginatedBookingsQuery,
  PaginatedBookingsResult,
} from "../../domain/repositories/IBookingRepository";
import {
  Booking,
  BookingStatus,
  CalendarSyncStatus,
  hasBookingDateTimePassed,
} from "../../domain/models/Booking";
import { Prisma } from "@prisma/client";
import prisma from "../database/prismaClient";

/**
 * Implementación concreta del repositorio de Bookings usando Prisma + Neon.
 */
export class BookingRepository implements IBookingRepository {
  /**
   * Pasa automáticamente a estado `completed` todas las reservas `confirmed`
   * cuya fecha y hora en America/Bogota ya se haya cumplido.
   */
  private async completeElapsedConfirmedBookings(now: Date = new Date()): Promise<void> {
    const upperBoundDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const candidates = await prisma.booking.findMany({
      where: {
        status: "confirmed",
        eventDate: { lte: upperBoundDate },
      },
      select: {
        id: true,
        eventDate: true,
        startTime: true,
      },
    });

    if (candidates.length === 0) return;

    const elapsedIds = candidates
      .filter((row) => hasBookingDateTimePassed(row.eventDate, row.startTime, now))
      .map((row) => row.id);

    if (elapsedIds.length > 0) {
      await prisma.booking.updateMany({
        where: {
          id: { in: elapsedIds },
          status: "confirmed",
        },
        data: {
          status: "completed",
        },
      });
    }
  }

  async findBookingById(id: string): Promise<Booking | null> {
    await this.completeElapsedConfirmedBookings();
    const row = await prisma.booking.findUnique({
      where: { id },
      include: {
        chiva: { select: { name: true } },
        travel: { select: { name: true } },
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async findBookingAll(filters?: BookingFilters): Promise<Booking[]> {
    await this.completeElapsedConfirmedBookings();
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
      include: {
        chiva: { select: { name: true } },
        travel: { select: { name: true } },
      },
      orderBy: { eventDate: "asc" },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findBookingPaginated(query: PaginatedBookingsQuery): Promise<PaginatedBookingsResult> {
    await this.completeElapsedConfirmedBookings();
    const search = query.q?.trim();
    const where: Prisma.BookingWhereInput = {
      ...(query.status && { status: query.status }),
      ...(search && {
        OR: [
          { id: { contains: search, mode: "insensitive" } },
          { customerName: { contains: search, mode: "insensitive" } },
          { customerEmail: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const skip = (query.page - 1) * query.limit;

    const [rows, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: query.limit,
        include: {
          chiva: { select: { name: true } },
          travel: { select: { name: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      data: rows.map((r) => this.toDomain(r)),
      total,
    };
  }

  async findConfirmedByDateRange(startDate: Date, endDate: Date): Promise<Booking[]> {
    await this.completeElapsedConfirmedBookings();
    const rows = await prisma.booking.findMany({
      where: {
        status: "confirmed",
        eventDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        chiva: { select: { name: true } },
        travel: { select: { name: true } },
      },
      orderBy: [{ eventDate: "asc" }, { startTime: "asc" }, { id: "asc" }],
    });

    return rows.map((r) => this.toDomain(r));
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
    const dateStr = eventDate.toISOString().split("T")[0];
    const occupied = await prisma.booking.findMany({
      where: {
        chivaId,
        status: { in: ["pending", "confirmed"] },
        ...(excludeBookingId && { id: { not: excludeBookingId } }),
        eventDate: {
          gte: new Date(dateStr + "T00:00:00.000Z"),
          lt: new Date(dateStr + "T23:59:59.999Z"),
        },
      },
      select: { startTime: true, durationHours: true },
    });

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

  async hasFutureActiveBookingsByChiva(
    chivaId: string,
    fromDate: Date = new Date()
  ): Promise<boolean> {
    await this.completeElapsedConfirmedBookings(fromDate);
    const todayStr = fromDate.toISOString().split("T")[0];
    const startOfToday = new Date(todayStr + "T00:00:00.000Z");

    const count = await prisma.booking.count({
      where: {
        chivaId,
        status: { in: ["pending", "confirmed"] },
        eventDate: { gte: startOfToday },
      },
    });

    return count > 0;
  }

  async saveBooking(booking: Booking): Promise<Booking> {
    const row = await prisma.booking.create({
      data: {
        id: booking.id,
        chivaId: booking.chivaId,
        travelId: booking.travel,   // En Booking.travel almacenamos el travelId
        customerId: booking.customerId,
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
      include: {
        chiva: { select: { name: true } },
        travel: { select: { name: true } },
      },
    });
    return this.toDomain(row);
  }

  async updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
    const row = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        chiva: { select: { name: true } },
        travel: { select: { name: true } },
      },
    });
    return this.toDomain(row);
  }

  async updateBookingCalendarSync(
    id: string,
    data: { googleEventId?: string | null; calendarSyncStatus: CalendarSyncStatus }
  ): Promise<Booking> {
    const row = await prisma.booking.update({
      where: { id },
      data: {
        ...(data.googleEventId !== undefined && { googleEventId: data.googleEventId }),
        calendarSyncStatus: data.calendarSyncStatus,
      },
      include: {
        chiva: { select: { name: true } },
        travel: { select: { name: true } },
      },
    });
    return this.toDomain(row);
  }

  private toDomain(row: any): Booking {
    return {
      id: row.id,
      chivaId: row.chivaId,
      chivaName: row.chiva?.name,
      customerId: row.customerId ?? undefined,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone,
      guestCount: row.guestCount,
      travel: row.travelId,
      travelName: row.travel?.name,
      eventDate: row.eventDate,
      startTime: row.startTime,
      durationHours: row.durationHours,
      totalPrice: row.totalPrice,
      status: row.status as BookingStatus,
      notes: row.notes ?? undefined,
      googleEventId: row.googleEventId ?? null,
      calendarSyncStatus: (row.calendarSyncStatus ?? "pending") as CalendarSyncStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
