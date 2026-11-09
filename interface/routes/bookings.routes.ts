import { Router } from "express";
import { BookingsController } from "../controllers/bookings.controller";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.middleware";
import { trackBookingRateLimiter } from "../middlewares/rate-limit.middleware";
import { IJwtService } from "../../application/ports/IJwtService";

export const createBookingsRouter = (
  controller: BookingsController,
  jwtService: IJwtService
): Router => {
  const router = Router();
  const auth = createAuthMiddleware(jwtService);

  // ── Rutas PÚBLICAS ────────────────────────────────────────────────────────
  /** GET /bookings/availability?chivaId=&date= — Para el calendario */
  router.get("/availability", controller.getAvailability);

  /** GET /bookings/track?code=CR-XXXXXX&email=... — Seguimiento público */
  router.get("/track", trackBookingRateLimiter, controller.track);

  /** POST /bookings — El cliente hace una reserva */
  router.post("/", controller.create);

  // ── Rutas PROTEGIDAS (requieren JWT de admin/operador) ────────────────────
  /** GET /bookings — Listado paginado para el panel admin */
  router.get("/", auth, requireRole("admin"), controller.getAll);

  /** GET /bookings/:id */
  router.get("/:id", auth, controller.getById);

  /** PATCH /bookings/:id/status */
  router.patch("/:id/status", auth, controller.updateStatus);

  return router;
};
