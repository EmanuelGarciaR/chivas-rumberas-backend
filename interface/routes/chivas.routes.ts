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

  /** PATCH /chivas/:id — Solo administradores */
  router.patch("/:id", auth, requireRole("admin"), controller.update);

  return router;
};
