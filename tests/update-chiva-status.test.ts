import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { describe, it } from "node:test";
import express, { type Express } from "express";
import { ChivasController } from "../interface/controllers/chivas.controller";
import { createChivasRouter } from "../interface/routes/chivas.routes";
import { errorHandler } from "../interface/middlewares/error.middleware";
import type { IJwtService } from "../application/ports/IJwtService";
import type { JwtPayload } from "../domain/models/JwtPayload";
import type { ChivaResponseDto } from "../application/dtos/ChivaDto";
import { ChivaNotFoundError } from "../domain/errors/DomainErrors";

const updatedChiva: ChivaResponseDto = {
  id: "chiva-1",
  name: "La Coqueta",
  description: "Chiva rumbera para celebraciones.",
  capacity: 30,
  imageUrls: [],
  pricePerHour: 280000,
  status: "maintenance",
  features: [],
};

const jwtService: IJwtService = {
  sign: () => "valid-token",
  verify: (token: string): JwtPayload => {
    if (token !== "valid-token") throw new Error("invalid token");
    return { sub: "admin-1", email: "admin@example.com", role: "admin" };
  },
};

const createTestApp = (
  updateStatus: (id: string, status: string) => Promise<ChivaResponseDto>,
  inspectRequest?: (contentType: string | undefined, body: unknown, status: unknown) => void
): Express => {
  const controller = new ChivasController(
    {} as never,
    {} as never,
    {} as never,
    { execute: updateStatus } as never
  );
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  if (inspectRequest) {
    app.use((req, _res, next) => {
      inspectRequest(req.headers["content-type"], req.body, req.body?.status);
      next();
    });
  }
  app.use("/chivas", createChivasRouter(controller, jwtService));
  app.use(errorHandler);
  return app;
};

const request = async (
  app: Express,
  body?: string,
  token?: string
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const server: Server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert(address && typeof address !== "string");
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/chivas/chiva-1/status`, {
      method: "PATCH",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body,
    });
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
};

describe("PATCH /chivas/:id/status", () => {
  it("parses JSON before the router and exposes status", async () => {
    let requestContentType: string | undefined;
    let requestBody: unknown;
    let requestStatus: unknown;
    const response = await request(
      createTestApp(
        async () => updatedChiva,
        (contentType, body, status) => {
          requestContentType = contentType;
          requestBody = body;
          requestStatus = status;
        }
      ),
      JSON.stringify({ status: "maintenance" }),
      "valid-token"
    );

    assert.equal(response.status, 200);
    assert.equal(requestContentType, "application/json");
    assert.deepEqual(requestBody, { status: "maintenance" });
    assert.equal(requestStatus, "maintenance");
  });

  for (const status of ["available", "maintenance", "retired"]) {
    it(`accepts status ${status}`, async () => {
      let receivedStatus = "";
      const response = await request(
        createTestApp(async (_id, received) => {
          receivedStatus = received;
          return { ...updatedChiva, status: received as ChivaResponseDto["status"] };
        }),
        JSON.stringify({ status }),
        "valid-token"
      );
      assert.equal(response.status, 200);
      assert.equal(receivedStatus, status);
      assert.equal((response.body as ChivaResponseDto).status, status);
    });
  }

  it("returns 400 for an absent body", async () => {
    const response = await request(createTestApp(async () => updatedChiva), undefined, "valid-token");
    assert.equal(response.status, 400);
    assert.deepEqual(response.body.error, {
      type: "ValidationError",
      message: "El campo status es requerido.",
    });
  });

  it("returns 400 for an empty body", async () => {
    const response = await request(createTestApp(async () => updatedChiva), "{}", "valid-token");
    assert.equal(response.status, 400);
  });

  it("returns 400 when status is absent", async () => {
    const response = await request(
      createTestApp(async () => updatedChiva),
      JSON.stringify({ name: "ignored" }),
      "valid-token"
    );
    assert.equal(response.status, 400);
  });

  it("returns 400 for an invalid status", async () => {
    const response = await request(
      createTestApp(async () => updatedChiva),
      JSON.stringify({ status: "pending" }),
      "valid-token"
    );
    assert.equal(response.status, 400);
    assert.deepEqual(response.body.error, {
      type: "ValidationError",
      message: "El estado de la chiva no es válido.",
    });
  });

  it("returns 404 when the chiva does not exist", async () => {
    const response = await request(
      createTestApp(async () => {
        throw new ChivaNotFoundError("missing");
      }),
      JSON.stringify({ status: "maintenance" }),
      "valid-token"
    );
    assert.equal(response.status, 404);
    assert.deepEqual(response.body.error, {
      type: "ChivaNotFoundError",
      message: "Chiva no encontrada.",
    });
  });

  it("returns 401 for an absent or invalid token", async () => {
    const app = createTestApp(async () => updatedChiva);
    assert.equal((await request(app, JSON.stringify({ status: "available" }))).status, 401);
    assert.equal(
      (await request(app, JSON.stringify({ status: "available" }), "invalid-token")).status,
      401
    );
  });

  it("returns the complete updated chiva and only delegates status", async () => {
    let receivedId = "";
    let receivedStatus = "";
    const response = await request(
      createTestApp(async (id, status) => {
        receivedId = id;
        receivedStatus = status;
        return updatedChiva;
      }),
      JSON.stringify({ status: "maintenance", pricePerHour: 999999 }),
      "valid-token"
    );
    assert.equal(response.status, 200);
    assert.equal(receivedId, "chiva-1");
    assert.equal(receivedStatus, "maintenance");
    assert.deepEqual(response.body, updatedChiva);
  });
});
