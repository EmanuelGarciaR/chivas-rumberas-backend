import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/error.middleware";
import { createAuthRouter } from "./routes/auth.routes";
import { createChivasRouter } from "./routes/chivas.routes";
import { createTravelsRouter } from "./routes/travels.routes";
import { createBookingsRouter } from "./routes/bookings.routes";
import {
  authController,
  chivasController,
  travelsController,
  bookingsController,
  jwtService,
} from "./container";

const app = express();

// ── Middlewares globales ───────────────────────────────────────────────────
const configuredOrigins = process.env.CORS_ORIGIN
  ?.split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: configuredOrigins?.length ? configuredOrigins : true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Rutas ─────────────────────────────────────────────────────────────────
app.use("/auth", createAuthRouter(authController));
app.use("/chivas", createChivasRouter(chivasController, jwtService));
app.use("/travels", createTravelsRouter(travelsController));
app.use("/bookings", createBookingsRouter(bookingsController, jwtService));

// ── Manejo global de errores (siempre al final) ───────────────────────────
app.use(errorHandler);

export default app;
