import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { afterEach, describe, it } from "node:test";
import express, { type Express } from "express";
import { BookingsController } from "../interface/controllers/bookings.controller";
import { createBookingsRouter } from "../interface/routes/bookings.routes";
import { errorHandler } from "../interface/middlewares/error.middleware";
import { InvalidBookingStatusTransitionError } from "../domain/errors/DomainErrors";
import type { IJwtService } from "../application/ports/IJwtService";
import type { JwtPayload } from "../domain/models/JwtPayload";
import type { BookingResponseDto } from "../application/dtos/BookingDto";

const bookingResponse: BookingResponseDto = {
  id: "CR-7X8M2P",
  chivaId: "chiva-1",
  chivaName: "La Coqueta",
  travelId: "travel-1",
  travelName: "Tour Medellín Nocturno",
  customerName: "Emanuel García",
  customerEmail: "emanuel@example.com",
  customerPhone: "+573124797221",
  guestCount: 20,
  eventDate: "2026-11-15",
  startTime: "20:00",
  endTime: "23:00",
  durationHours: 3,
  totalPrice: 850000,
  status: "confirmed",
  notes: "Celebración de cumpleaños",
  createdAt: "2026-10-26T20:30:00.000Z",
};

const validPayload: JwtPayload = {
  sub: "admin-1",
  email: "admin@example.com",
  role: "admin",
};

const jwtService: IJwtService = {
  sign: () => "valid-token",
  verify: (token: string): JwtPayload => {
    if (token !== "valid-token") {
      throw new Error("invalid token");
    }
    return validPayload;
  },
};

const createTestApp = (
  updateStatus: (id: string, status: string) => Promise<BookingResponseDto>
): Express => {
  const updateBookingStatusUseCase = { execute: updateStatus };
  const controller = new BookingsController(
    {} as never,
    {} as never,
    {} as never,
    updateBookingStatusUseCase as never,
    {} as never
  );
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/bookings", createBookingsRouter(controller, jwtService));
  app.use(errorHandler);
  return app;
};

const request = async (
  app: Express,
  body?: string,
  token?: string,
  contentType = "application/json"
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const server: Server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert(address && typeof address !== "string");

  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/bookings/CR-7X8M2P/status`,
      {
        method: "PATCH",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(body !== undefined ? { "Content-Type": contentType } : {}),
        },
        body,
      }
    );
    return {
      status: response.status,
      body: (await response.json()) as Record<string, unknown>,
    };
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
};

describe("PATCH /bookings/:id/status", () => {
  it("accepts a valid confirmed status and returns the complete booking", async () => {
    let receivedStatus = "";
    const app = createTestApp(async (_id, status) => {
      receivedStatus = status;
      return bookingResponse;
    });

    const response = await request(
      app,
      JSON.stringify({ status: "confirmed" }),
      "valid-token"
    );

    assert.equal(response.status, 200);
    assert.equal(receivedStatus, "confirmed");
    assert.deepEqual(response.body, bookingResponse);
  });

  it("returns 400 when the request has no body", async () => {
    const response = await request(createTestApp(async () => bookingResponse), undefined, "valid-token");
    assert.deepEqual(response, {
      status: 400,
      body: {
        error: {
          type: "ValidationError",
          message: "El campo status es requerido.",
        },
      },
    });
  });

  it("returns 400 when the body is empty", async () => {
    const response = await request(createTestApp(async () => bookingResponse), "{}", "valid-token");
    assert.equal(response.status, 400);
    assert.equal((response.body.error as Record<string, unknown>).type, "ValidationError");
  });

  it("returns 400 when status is not sent", async () => {
    const response = await request(
      createTestApp(async () => bookingResponse),
      JSON.stringify({ notes: "test" }),
      "valid-token"
    );
    assert.equal(response.status, 400);
    assert.equal((response.body.error as Record<string, unknown>).message, "El campo status es requerido.");
  });

  it("returns 400 for an invalid status", async () => {
    const response = await request(
      createTestApp(async () => bookingResponse),
      JSON.stringify({ status: "pending" }),
      "valid-token"
    );
    assert.equal(response.status, 400);
    assert.equal((response.body.error as Record<string, unknown>).type, "ValidationError");
  });

  it("preserves 422 for an invalid transition", async () => {
    const app = createTestApp(async () => {
      throw new InvalidBookingStatusTransitionError("completed", "cancelled");
    });
    const response = await request(app, JSON.stringify({ status: "cancelled" }), "valid-token");
    assert.equal(response.status, 422);
    assert.equal(
      (response.body.error as Record<string, unknown>).type,
      "InvalidBookingStatusTransitionError"
    );
  });

  it("returns 401 when the token is absent or invalid", async () => {
    const app = createTestApp(async () => bookingResponse);
    const absentToken = await request(app, JSON.stringify({ status: "confirmed" }));
    const invalidToken = await request(app, JSON.stringify({ status: "confirmed" }), "invalid-token");

    assert.equal(absentToken.status, 401);
    assert.equal(invalidToken.status, 401);
  });
});
