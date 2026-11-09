import { Router } from "express";
import { UploadsController } from "../controllers/uploads.controller";
import { createAuthMiddleware, requireRole } from "../middlewares/auth.middleware";
import { IJwtService } from "../../application/ports/IJwtService";

export const createUploadsRouter = (
  controller: UploadsController,
  jwtService: IJwtService
): Router => {
  const router = Router();
  const auth = createAuthMiddleware(jwtService);

  /** GET /uploads/signature — Solo administradores */
  router.get("/signature", auth, requireRole("admin"), controller.getSignature);

  return router;
};
