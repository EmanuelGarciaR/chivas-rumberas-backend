import { Router } from "express";
import { ChivasController } from "../controllers/chivas.controller";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.middleware";
import { IJwtService } from "../../application/ports/IJwtService";

export const createChivasRouter = (controller: ChivasController, jwtService: IJwtService): Router => {
  const router = Router();
  const auth = createAuthMiddleware(jwtService);

  /** GET /chivas?status=available — Público */
  router.get("/", controller.getAll);

  /** GET /chivas/:id — Público */
  router.get("/:id", controller.getById);

  /** POST /chivas — Solo administradores */
  router.post("/", auth, requireRole("admin"), controller.create);

  /** PATCH /chivas/:id/status — Solo administradores */
  router.patch("/:id/status", auth, requireRole("admin"), controller.updateStatus);

  /** PATCH /chivas/:id — Solo administradores */
  router.patch("/:id", auth, requireRole("admin"), controller.update);

  /** DELETE /chivas/:id — Solo administradores (borrado lógico) */
  router.delete("/:id", auth, requireRole("admin"), controller.delete);

  return router;
};
