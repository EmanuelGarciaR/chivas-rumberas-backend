import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { describe, it } from "node:test";
import express, { type Express } from "express";
import { BookingsController } from "../interface/controllers/bookings.controller";
import { ChivasController } from "../interface/controllers/chivas.controller";
import { UploadsController } from "../interface/controllers/uploads.controller";
import { createBookingsRouter } from "../interface/routes/bookings.routes";
import { createChivasRouter } from "../interface/routes/chivas.routes";
import { createUploadsRouter } from "../interface/routes/uploads.routes";
import { errorHandler } from "../interface/middlewares/error.middleware";
import { GetBookingsUseCase } from "../application/use-cases/booking/GetBookings";
import { CreateBookingUseCase } from "../application/use-cases/booking/CreateBooking";
import { TrackBookingUseCase } from "../application/use-cases/booking/TrackBooking";
import { UpdateBookingStatusUseCase } from "../application/use-cases/booking/UpdateBookingStatus";
import { SyncBookingCalendarUseCase } from "../application/use-cases/booking/SyncBookingCalendar";
import { GetBookingsCalendarUseCase } from "../application/use-cases/booking/GetBookingsCalendar";
import { CreateChivaUseCase } from "../application/use-cases/chiva/CreateChiva";
import { UpdateChivaUseCase } from "../application/use-cases/chiva/UpdateChiva";
import { DeleteChivaUseCase } from "../application/use-cases/chiva/DeleteChiva";
import type { IJwtService } from "../application/ports/IJwtService";
import type { JwtPayload } from "../domain/models/JwtPayload";
import {
  hasBookingDateTimePassed,
  type Booking,
  type BookingStatus,
  type CalendarSyncStatus,
} from "../domain/models/Booking";
import type { Customer } from "../domain/models/Customer";
import type { IBookingRepository, PaginatedBookingsQuery } from "../domain/repositories/IBookingRepository";
import type { IChivaRepository } from "../domain/repositories/IChivaRepository";
import type { ITravelRepository } from "../domain/repositories/ITravelRepository";
import type { ICustomerRepository } from "../domain/repositories/ICustomerRepository";
import type { INotificationService } from "../application/ports/INotificationService";
import type { CalendarEventInput, CalendarService } from "../application/ports/CalendarService";
import {
  bookingConfirmationTemplate,
  bookingStatusUpdateTemplate,
} from "../infrastructure/services/email-templates";

const jwtService: IJwtService = {
  sign: (payload) => `${payload.role}-token`,
  verify: (token: string): JwtPayload => {
    if (token === "admin-token") {
      return { sub: "admin-1", email: "admin@chivasrumberas.com", role: "admin" };
    }
    if (token === "operator-token") {
      return { sub: "op-1", email: "operador@chivasrumberas.com", role: "operator" };
    }
    throw new Error("Invalid token");
  },
};

const sendHttp = async (
  app: Express,
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {}
): Promise<{ status: number; body: Record<string, any> }> => {
  const server: Server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert(address && typeof address !== "string");

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    return {
      status: response.status,
      body: (await response.json()) as Record<string, any>,
    };
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
};

const sampleBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: "CR-8P2Q9M",
  chivaId: "la-coqueta-1954",
  chivaName: "La Coqueta",
  customerName: "Carolina Montoya",
  customerEmail: "carolina@example.com",
  customerPhone: "3001234567",
  guestCount: 30,
  travel: "trv_alumbrados",
  travelName: "Ruta Navideña y Alumbrados",
  eventDate: new Date("2026-11-20T00:00:00.000Z"),
  startTime: "18:00",
  durationHours: 4,
  totalPrice: 1120000,
  status: "pending",
  notes: "Cumpleaños",
  googleEventId: null,
  calendarSyncStatus: "pending",
  createdAt: new Date("2026-11-01T15:00:00.000Z"),
  updatedAt: new Date("2026-11-01T15:00:00.000Z"),
  ...overrides,
});

// ── 1. Paginación de reservas (GET /bookings) ─────────────────────────────
describe("GET /bookings — Paginación y filtros de reservas del admin", () => {
  const createPaginationApp = (onQuery?: (q: PaginatedBookingsQuery) => void) => {
    const bookings = [
      sampleBooking({ id: "CR-AAAA22", customerName: "Ana Gómez", status: "confirmed" }),
      sampleBooking({ id: "CR-BBBB33", customerName: "Carlos Ruiz", status: "pending" }),
    ];

    const bookingRepo: Partial<IBookingRepository> = {
      findBookingPaginated: async (query) => {
        onQuery?.(query);
        return { data: bookings.slice(0, query.limit), total: 12 };
      },
    };

    const getBookingsUseCase = new GetBookingsUseCase(
      bookingRepo as IBookingRepository,
      {} as IChivaRepository,
      {} as ITravelRepository
    );

    const controller = new BookingsController(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      getBookingsUseCase
    );

    const app = express();
    app.use(express.json());
    app.use("/bookings", createBookingsRouter(controller, jwtService));
    app.use(errorHandler);
    return app;
  };

  it("aplica page=1 y limit=10 por defecto y retorna data + meta con totalPages", async () => {
    let capturedQuery: PaginatedBookingsQuery | undefined;
    const app = createPaginationApp((q) => {
      capturedQuery = q;
    });

    const res = await sendHttp(app, "/bookings", { token: "admin-token" });

    assert.equal(res.status, 200);
    assert.deepEqual(capturedQuery, {
      page: 1,
      limit: 10,
      status: undefined,
      q: undefined,
    });
    assert.equal(Array.isArray(res.body.data), true);
    assert.equal(res.body.data.length, 2);
    assert.deepEqual(res.body.meta, {
      page: 1,
      limit: 10,
      total: 12,
      totalPages: 2,
    });
  });

  it("reenvía page, limit, status y q correctamente al repositorio", async () => {
    let capturedQuery: PaginatedBookingsQuery | undefined;
    const app = createPaginationApp((q) => {
      capturedQuery = q;
    });

    const res = await sendHttp(
      app,
      "/bookings?page=2&limit=5&status=confirmed&q=carolina",
      { token: "admin-token" }
    );

    assert.equal(res.status, 200);
    assert.deepEqual(capturedQuery, {
      page: 2,
      limit: 5,
      status: "confirmed",
      q: "carolina",
    });
    assert.deepEqual(res.body.meta, {
      page: 2,
      limit: 5,
      total: 12,
      totalPages: 3,
    });
  });

  it("responde 400 ValidationError si page < 1, limit > 50 o status inválido", async () => {
    const app = createPaginationApp();

    const invalidPage = await sendHttp(app, "/bookings?page=0", { token: "admin-token" });
    assert.equal(invalidPage.status, 400);
    assert.equal(invalidPage.body.error.type, "ValidationError");

    const invalidLimit = await sendHttp(app, "/bookings?limit=51", { token: "admin-token" });
    assert.equal(invalidLimit.status, 400);
    assert.equal(invalidLimit.body.error.type, "ValidationError");

    const invalidStatus = await sendHttp(app, "/bookings?status=invalid", { token: "admin-token" });
    assert.equal(invalidStatus.status, 400);
    assert.equal(invalidStatus.body.error.type, "ValidationError");
  });
});

// ── 2. Reutilización de Customer al crear reservas ────────────────────────
describe("CreateBookingUseCase — Reutilización y actualización de Customer", () => {
  it("crea el Customer en la primera reserva y lo reutiliza actualizando nombre y teléfono en la segunda", async () => {
    const customersByEmail = new Map<string, Customer>();
    const savedBookings: Booking[] = [];

    const customerRepo: ICustomerRepository = {
      findByEmail: async (email) => customersByEmail.get(email.toLowerCase()) ?? null,
      findById: async (id) =>
        Array.from(customersByEmail.values()).find((c) => c.id === id) ?? null,
      upsertByEmail: async ({ name, email, phone }) => {
        const normalized = email.trim().toLowerCase();
        const existing = customersByEmail.get(normalized);
        if (existing) {
          const updated: Customer = { ...existing, name: name.trim(), phone: phone.trim() };
          customersByEmail.set(normalized, updated);
          return updated;
        }
        const created: Customer = {
          id: `cust-${customersByEmail.size + 1}`,
          name: name.trim(),
          email: normalized,
          phone: phone.trim(),
          createdAt: new Date(),
        };
        customersByEmail.set(normalized, created);
        return created;
      },
    };

    const bookingRepo: Partial<IBookingRepository> = {
      hasConflict: async () => false,
      saveBooking: async (b) => {
        savedBookings.push(b);
        return b;
      },
    };

    const chivaRepo: Partial<IChivaRepository> = {
      findChivaById: async () => ({
        id: "la-coqueta-1954",
        name: "La Coqueta",
        description: "Chiva",
        capacity: 50,
        imageUrls: [],
        pricePerHour: 280000,
        status: "available",
        features: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    const travelRepo: Partial<ITravelRepository> = {
      findTravelById: async () => ({
        id: "trv_alumbrados",
        name: "Ruta Navideña",
        description: "Tour",
        durationHours: 4,
        highlights: [],
        isActive: true,
      }),
    };

    const notificationService: INotificationService = {
      sendBookingConfirmation: async () => {},
      sendNewBookingAlert: async () => {},
      sendBookingStatusUpdate: async () => {},
    };

    const useCase = new CreateBookingUseCase(
      bookingRepo as IBookingRepository,
      chivaRepo as IChivaRepository,
      travelRepo as ITravelRepository,
      notificationService,
      customerRepo
    );

    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const first = await useCase.execute({
      chivaId: "la-coqueta-1954",
      travelId: "trv_alumbrados",
      customerName: "Carolina Montoya",
      customerEmail: "Carolina.Montoya@Example.com",
      customerPhone: "3001112233",
      guestCount: 25,
      eventDate: futureDate,
      startTime: "18:00",
      durationHours: 3,
    });

    const second = await useCase.execute({
      chivaId: "la-coqueta-1954",
      travelId: "trv_alumbrados",
      customerName: "Carolina Montoya Actualizada",
      customerEmail: "carolina.montoya@example.com",
      customerPhone: "3009998877",
      guestCount: 30,
      eventDate: futureDate,
      startTime: "18:00",
      durationHours: 4,
    });

    // Solo debe existir 1 Customer en total
    assert.equal(customersByEmail.size, 1);
    const storedCustomer = customersByEmail.get("carolina.montoya@example.com")!;
    assert.equal(storedCustomer.id, "cust-1");
    assert.equal(storedCustomer.name, "Carolina Montoya Actualizada");
    assert.equal(storedCustomer.phone, "3009998877");

    // Ambas reservas quedan enlazadas al mismo customerId y mantienen los campos para el frontend
    assert.equal(savedBookings[0].customerId, "cust-1");
    assert.equal(savedBookings[1].customerId, "cust-1");
    assert.equal(first.customerEmail, "carolina.montoya@example.com");
    assert.equal(second.customerName, "Carolina Montoya Actualizada");
    assert.equal(second.customerPhone, "3009998877");
  });
});

// ── 3. Tracking público (/bookings/track) ─────────────────────────────────
describe("GET /bookings/track — Seguimiento público de reservas", () => {
  const existing = sampleBooking({
    id: "CR-8P2Q9M",
    customerEmail: "carolina@example.com",
    status: "confirmed",
  });

  const bookingRepo: Partial<IBookingRepository> = {
    findBookingById: async (id) => (id === existing.id ? existing : null),
  };

  const trackUseCase = new TrackBookingUseCase(
    bookingRepo as IBookingRepository,
    {} as IChivaRepository,
    {} as ITravelRepository
  );

  const controller = new BookingsController(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    trackUseCase
  );

  const app = express();
  app.use(express.json());
  app.use("/bookings", createBookingsRouter(controller, jwtService));
  app.use(errorHandler);

  it("devuelve detalles de seguimiento cuando code y email coinciden (case-insensitive)", async () => {
    const res = await sendHttp(
      app,
      "/bookings/track?code=cr-8p2q9m&email=CAROLINA@example.com"
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.id, "CR-8P2Q9M");
    assert.equal(res.body.code, "CR-8P2Q9M");
    assert.equal(res.body.status, "confirmed");
    assert.equal(res.body.chivaName, "La Coqueta");
    assert.equal(res.body.travelName, "Ruta Navideña y Alumbrados");
    assert.equal(res.body.eventDate, "2026-11-20");
    assert.equal(res.body.startTime, "18:00");
    assert.equal(res.body.endTime, "22:00");
    assert.equal(res.body.guestCount, 30);
    assert.equal(res.body.totalPrice, 1120000);
    // No expone datos sensibles del cliente
    assert.equal(res.body.customerEmail, undefined);
    assert.equal(res.body.customerPhone, undefined);
  });

  it("responde exactamente el mismo 404 genérico si el código no existe o si el email no coincide", async () => {
    const missingCodeRes = await sendHttp(
      app,
      "/bookings/track?code=CR-NOEXST&email=carolina@example.com"
    );
    const wrongEmailRes = await sendHttp(
      app,
      "/bookings/track?code=CR-8P2Q9M&email=otro@example.com"
    );

    assert.equal(missingCodeRes.status, 404);
    assert.equal(wrongEmailRes.status, 404);
    assert.deepEqual(missingCodeRes.body, wrongEmailRes.body);
    assert.equal(missingCodeRes.body.error.type, "BookingNotFoundError");
  });
});

// ── 4. Confirmación y sincronización con Google Calendar mockeado ─────────
describe("Google Calendar Sync en confirmación, cancelación y reintento manual", () => {
  const notificationService: INotificationService = {
    sendBookingConfirmation: async () => {},
    sendNewBookingAlert: async () => {},
    sendBookingStatusUpdate: async () => {},
  };

  it("al confirmar crea evento en Calendar y guarda googleEventId + calendarSyncStatus=synced", async () => {
    let current = sampleBooking({ status: "pending", googleEventId: null, calendarSyncStatus: "pending" });
    let createdEvents: CalendarEventInput[] = [];

    const bookingRepo: Partial<IBookingRepository> = {
      findBookingById: async () => current,
      updateBookingStatus: async (_id, status) => {
        current = { ...current, status };
        return current;
      },
      updateBookingCalendarSync: async (_id, data) => {
        current = {
          ...current,
          ...(data.googleEventId !== undefined && { googleEventId: data.googleEventId }),
          calendarSyncStatus: data.calendarSyncStatus,
        };
        return current;
      },
    };

    const calendarService: CalendarService = {
      createEvent: async (input) => {
        createdEvents.push(input);
        return "gcal-evt-123";
      },
      deleteEvent: async () => {},
    };

    const useCase = new UpdateBookingStatusUseCase(
      bookingRepo as IBookingRepository,
      notificationService,
      calendarService
    );

    const result = await useCase.execute(current.id, "confirmed");

    assert.equal(result.status, "confirmed");
    assert.equal(result.calendarSyncStatus, "synced");
    assert.equal(current.googleEventId, "gcal-evt-123");
    assert.equal(createdEvents.length, 1);
    assert.equal(createdEvents[0].chivaName, "La Coqueta");
    assert.equal(createdEvents[0].customerName, "Carolina Montoya");
  });

  it("un fallo de Google Calendar NO bloquea el cambio a confirmed y marca calendarSyncStatus=failed", async () => {
    let current = sampleBooking({ status: "pending", googleEventId: null, calendarSyncStatus: "pending" });

    const bookingRepo: Partial<IBookingRepository> = {
      findBookingById: async () => current,
      updateBookingStatus: async (_id, status) => {
        current = { ...current, status };
        return current;
      },
      updateBookingCalendarSync: async (_id, data) => {
        current = {
          ...current,
          ...(data.googleEventId !== undefined && { googleEventId: data.googleEventId }),
          calendarSyncStatus: data.calendarSyncStatus,
        };
        return current;
      },
    };

    const failingCalendarService: CalendarService = {
      createEvent: async () => {
        throw new Error("Google API 503 Unavailable");
      },
      deleteEvent: async () => {},
    };

    const useCase = new UpdateBookingStatusUseCase(
      bookingRepo as IBookingRepository,
      notificationService,
      failingCalendarService
    );

    const result = await useCase.execute(current.id, "confirmed");

    assert.equal(result.status, "confirmed");
    assert.equal(result.calendarSyncStatus, "failed");
    assert.equal(current.googleEventId, null);
  });

  it("es idempotente: si ya tiene googleEventId no crea otro evento al confirmar ni en calendar-sync", async () => {
    let current = sampleBooking({
      status: "pending",
      googleEventId: "existing-event-999",
      calendarSyncStatus: "synced",
    });
    let createCalls = 0;

    const bookingRepo: Partial<IBookingRepository> = {
      findBookingById: async () => current,
      updateBookingStatus: async (_id, status) => {
        current = { ...current, status };
        return current;
      },
      updateBookingCalendarSync: async (_id, data) => {
        current = {
          ...current,
          ...(data.googleEventId !== undefined && { googleEventId: data.googleEventId }),
          calendarSyncStatus: data.calendarSyncStatus,
        };
        return current;
      },
    };

    const calendarService: CalendarService = {
      createEvent: async () => {
        createCalls++;
        return "new-event";
      },
      deleteEvent: async () => {},
    };

    const updateUseCase = new UpdateBookingStatusUseCase(
      bookingRepo as IBookingRepository,
      notificationService,
      calendarService
    );
    await updateUseCase.execute(current.id, "confirmed");

    const syncUseCase = new SyncBookingCalendarUseCase(
      bookingRepo as IBookingRepository,
      calendarService
    );
    const syncResult = await syncUseCase.execute(current.id);

    assert.equal(createCalls, 0);
    assert.equal(syncResult.calendarSyncStatus, "synced");
    assert.equal(current.googleEventId, "existing-event-999");
  });

  it("al pasar a cancelled elimina el evento de Google Calendar si existía", async () => {
    let current = sampleBooking({
      status: "confirmed",
      googleEventId: "evt-to-delete",
      calendarSyncStatus: "synced",
    });
    let deletedEventId = "";

    const bookingRepo: Partial<IBookingRepository> = {
      findBookingById: async () => current,
      updateBookingStatus: async (_id, status) => {
        current = { ...current, status };
        return current;
      },
      updateBookingCalendarSync: async (_id, data) => {
        current = {
          ...current,
          ...(data.googleEventId !== undefined && { googleEventId: data.googleEventId }),
          calendarSyncStatus: data.calendarSyncStatus,
        };
        return current;
      },
    };

    const calendarService: CalendarService = {
      createEvent: async () => "unused",
      deleteEvent: async (id) => {
        deletedEventId = id;
      },
    };

    const useCase = new UpdateBookingStatusUseCase(
      bookingRepo as IBookingRepository,
      notificationService,
      calendarService
    );

    const result = await useCase.execute(current.id, "cancelled");

    assert.equal(result.status, "cancelled");
    assert.equal(deletedEventId, "evt-to-delete");
    assert.equal(current.googleEventId, null);
  });
});

// ── 5. Permisos 401/403 de endpoints de administración ───────────────────
describe("Permisos 401 y 403 en endpoints de administración", () => {
  const bookingsController = new BookingsController(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { execute: async () => ({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } }) } as never,
    {} as never,
    { execute: async () => sampleBooking() } as never,
    { execute: async () => ({ month: "2026-11", chivas: [], days: [] }) } as never
  );

  const chivasController = new ChivasController(
    { execute: async () => [] } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never
  );

  const uploadsController = new UploadsController({
    generateUploadSignature: () => ({
      cloudName: "demo",
      apiKey: "123",
      timestamp: 1000,
      signature: "sig",
      folder: "chivas-rumberas/chivas",
      allowedFormats: ["jpg", "png", "webp"],
      maxFileSize: 5242880,
    }),
  });

  const app = express();
  app.use(express.json());
  app.use("/bookings", createBookingsRouter(bookingsController, jwtService));
  app.use("/chivas", createChivasRouter(chivasController, jwtService));
  app.use("/uploads", createUploadsRouter(uploadsController, jwtService));
  app.use(errorHandler);

  const adminEndpoints: Array<{ method: string; path: string; body?: unknown }> = [
    { method: "GET", path: "/bookings" },
    { method: "GET", path: "/bookings/calendar?month=2026-11" },
    { method: "POST", path: "/bookings/CR-8P2Q9M/calendar-sync" },
    {
      method: "POST",
      path: "/chivas",
      body: {
        name: "La Rumbera",
        description: "Chiva tradicional",
        capacity: 40,
        pricePerHour: 300000,
      },
    },
    { method: "PATCH", path: "/chivas/la-coqueta-1954", body: { pricePerHour: 310000 } },
    { method: "DELETE", path: "/chivas/la-coqueta-1954" },
    { method: "GET", path: "/uploads/signature" },
  ];

  for (const endpoint of adminEndpoints) {
    it(`${endpoint.method} ${endpoint.path} responde 401 sin token y 403 con rol operator`, async () => {
      const noTokenRes = await sendHttp(app, endpoint.path, {
        method: endpoint.method,
        body: endpoint.body,
      });
      assert.equal(noTokenRes.status, 401);
      assert.equal(noTokenRes.body.error.type, "InvalidTokenError");

      const operatorRes = await sendHttp(app, endpoint.path, {
        method: endpoint.method,
        token: "operator-token",
        body: endpoint.body,
      });
      assert.equal(operatorRes.status, 403);
      assert.equal(operatorRes.body.error.type, "UnauthorizedError");
    });
  }
});

// ── 6. Endpoint de calendario del dashboard (GET /bookings/calendar) ──────
describe("GET /bookings/calendar — Datos del calendario mensual del dashboard", () => {
  const createCalendarApp = (bookingsToReturn: Booking[]) => {
    const bookingRepo: Partial<IBookingRepository> = {
      findConfirmedByDateRange: async () => bookingsToReturn,
    };

    const calendarUseCase = new GetBookingsCalendarUseCase(bookingRepo as IBookingRepository);

    const controller = new BookingsController(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      calendarUseCase
    );

    const app = express();
    app.use(express.json());
    app.use("/bookings", createBookingsRouter(controller, jwtService));
    app.use(errorHandler);
    return app;
  };

  it("incluye solo reservas confirmadas, agrupa dos chivas el mismo día y marca endsNextDay cuando cruza medianoche", async () => {
    const bookings: Booking[] = [
      // Día 2026-11-20: Chiva 1 (cruza medianoche: 22:00 + 3h -> 01:00)
      sampleBooking({
        id: "CR-CONF01",
        chivaId: "la-coqueta-1954",
        chivaName: "La Coqueta",
        customerName: "Cliente Uno",
        travelName: "Tour Nocturno",
        guestCount: 35,
        eventDate: new Date("2026-11-20T00:00:00.000Z"),
        startTime: "22:00",
        durationHours: 3,
        status: "confirmed",
      }),
      // Día 2026-11-20: Chiva 2 el mismo día (18:00 + 3h -> 21:00, no cruza medianoche)
      sampleBooking({
        id: "CR-CONF02",
        chivaId: "la-parrandera-1960",
        chivaName: "La Parrandera",
        customerName: "Cliente Dos",
        travelName: "Ruta Sabaneta",
        guestCount: 40,
        eventDate: new Date("2026-11-20T00:00:00.000Z"),
        startTime: "18:00",
        durationHours: 3,
        status: "confirmed",
      }),
      // Reserva pendiente: debe ser ignorada
      sampleBooking({
        id: "CR-PEND01",
        chivaId: "la-exclusiva-1970",
        chivaName: "La Exclusiva",
        eventDate: new Date("2026-11-22T00:00:00.000Z"),
        status: "pending",
      }),
    ];

    const app = createCalendarApp(bookings);
    const res = await sendHttp(app, "/bookings/calendar?month=2026-11", {
      token: "admin-token",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.month, "2026-11");
    assert.deepEqual(res.body.chivas, [
      { id: "la-coqueta-1954", name: "La Coqueta" },
      { id: "la-parrandera-1960", name: "La Parrandera" },
    ]);
    assert.equal(res.body.days.length, 1);

    const day = res.body.days[0];
    assert.equal(day.date, "2026-11-20");
    assert.equal(day.chivasCount, 2);
    assert.equal(day.chivas.length, 2);

    const coquetaSlot = day.chivas[0].slots[0];
    assert.equal(coquetaSlot.bookingId, "CR-CONF01");
    assert.equal(coquetaSlot.startTime, "22:00");
    assert.equal(coquetaSlot.endTime, "01:00");
    assert.equal(coquetaSlot.endsNextDay, true);
    assert.equal(coquetaSlot.customerEmail, undefined);
    assert.equal(coquetaSlot.customerPhone, undefined);

    const parranderaSlot = day.chivas[1].slots[0];
    assert.equal(parranderaSlot.bookingId, "CR-CONF02");
    assert.equal(parranderaSlot.endsNextDay, undefined);
  });

  it("retorna chivas y days vacíos para un mes sin reservas confirmadas", async () => {
    const app = createCalendarApp([]);
    const res = await sendHttp(app, "/bookings/calendar?month=2026-12", {
      token: "admin-token",
    });

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      month: "2026-12",
      chivas: [],
      days: [],
    });
  });

  it("responde 400 ValidationError si month es inválido o no se envía", async () => {
    const app = createCalendarApp([]);

    const missingMonth = await sendHttp(app, "/bookings/calendar", { token: "admin-token" });
    assert.equal(missingMonth.status, 400);
    assert.equal(missingMonth.body.error.type, "ValidationError");

    const invalidMonth = await sendHttp(app, "/bookings/calendar?month=2026-13", {
      token: "admin-token",
    });
    assert.equal(invalidMonth.status, 400);
    assert.equal(invalidMonth.body.error.type, "ValidationError");
  });
});

// ── 7. Borrado lógico de Chiva con validación de reservas futuras ─────────
describe("DELETE /chivas/:id — Borrado lógico y conflicto 409 con reservas activas", () => {
  it("responde 409 ChivaHasActiveBookingsError si tiene reservas futuras pending/confirmed", async () => {
    const chivaRepo: Partial<IChivaRepository> = {
      findChivaById: async () => ({
        id: "la-coqueta-1954",
        name: "La Coqueta",
        description: "Chiva",
        capacity: 40,
        imageUrls: [],
        pricePerHour: 280000,
        status: "available",
        features: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };
    const bookingRepo: Partial<IBookingRepository> = {
      hasFutureActiveBookingsByChiva: async () => true,
    };

    const deleteUseCase = new DeleteChivaUseCase(
      chivaRepo as IChivaRepository,
      bookingRepo as IBookingRepository
    );

    const controller = new ChivasController(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      deleteUseCase
    );

    const app = express();
    app.use(express.json());
    app.use("/chivas", createChivasRouter(controller, jwtService));
    app.use(errorHandler);

    const res = await sendHttp(app, "/chivas/la-coqueta-1954", {
      method: "DELETE",
      token: "admin-token",
    });

    assert.equal(res.status, 409);
    assert.equal(res.body.error.type, "ChivaHasActiveBookingsError");
  });
});

// ── 8. Autocompletado de reservas al cumplirse día y hora ─────────────────
describe("hasBookingDateTimePassed — Transición automática a completed por fecha y hora", () => {
  it("retorna true cuando ya se cumplió el día y hora en America/Bogota y false si aún es futuro", () => {
    const eventDate = new Date("2026-11-15T00:00:00.000Z");
    const startTime = "18:00"; // 18:00 en Colombia = 23:00 UTC

    const beforeEvent = new Date("2026-11-15T17:59:00-05:00");
    const exactEvent = new Date("2026-11-15T18:00:00-05:00");
    const afterEvent = new Date("2026-11-15T19:30:00-05:00");

    assert.equal(hasBookingDateTimePassed(eventDate, startTime, beforeEvent), false);
    assert.equal(hasBookingDateTimePassed(eventDate, startTime, exactEvent), true);
    assert.equal(hasBookingDateTimePassed(eventDate, startTime, afterEvent), true);
  });
});

// ── 9. Negociación de precio por el admin y correos de reserva ────────────
describe("Precio sugerido editable por el admin y visibilidad en correos", () => {
  it("permite al admin modificar el precio sugerido al confirmar la reserva", async () => {
    let current = sampleBooking({
      status: "pending",
      totalPrice: 1120000, // precio sugerido inicial (280.000 * 4h)
    });
    let notifiedBookingTotal = 0;

    const bookingRepo: Partial<IBookingRepository> = {
      findBookingById: async () => current,
      updateBookingStatus: async (_id, status, totalPrice) => {
        current = {
          ...current,
          status,
          ...(totalPrice !== undefined && { totalPrice }),
        };
        return current;
      },
      updateBookingCalendarSync: async (_id, data) => {
        current = { ...current, ...data };
        return current;
      },
    };

    const notificationService: INotificationService = {
      sendBookingConfirmation: async () => {},
      sendNewBookingAlert: async () => {},
      sendBookingStatusUpdate: async (b) => {
        notifiedBookingTotal = b.totalPrice;
      },
    };

    const useCase = new UpdateBookingStatusUseCase(
      bookingRepo as IBookingRepository,
      notificationService
    );

    const updated = await useCase.execute(current.id, "confirmed", 950000);
    assert.equal(updated.status, "confirmed");
    assert.equal(updated.totalPrice, 950000);
    assert.equal(notifiedBookingTotal, 950000);
  });

  it("oculta el costo en el correo de reserva pendiente y lo muestra en el correo de confirmada", () => {
    const baseDto = {
      id: "CR-8P2Q9M",
      chivaId: "la-coqueta-1954",
      chivaName: "La Coqueta",
      travelId: "trv_alumbrados",
      travelName: "Ruta Navideña y Alumbrados",
      customerName: "Carolina Montoya",
      customerEmail: "carolina@example.com",
      customerPhone: "3001112233",
      guestCount: 30,
      eventDate: "2026-11-20",
      startTime: "18:00",
      endTime: "22:00",
      durationHours: 4,
      totalPrice: 950000,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };

    const pendingHtml = bookingConfirmationTemplate(baseDto);
    assert.equal(pendingHtml.includes("950.000"), false);
    assert.equal(pendingHtml.includes("950,000"), false);
    assert.equal(pendingHtml.includes("Precio en revisión"), true);

    const confirmedHtml = bookingStatusUpdateTemplate(
      { ...baseDto, status: "confirmed" },
      "pending"
    );
    assert.equal(confirmedHtml.includes("Total confirmado:"), true);
    assert.equal(
      confirmedHtml.includes("950.000") || confirmedHtml.includes("950,000"),
      true
    );
  });
});
