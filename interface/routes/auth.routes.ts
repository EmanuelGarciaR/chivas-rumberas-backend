import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { loginRateLimiter } from "../middlewares/rate-limit.middleware";

export const createAuthRouter = (controller: AuthController): Router => {
  const router = Router();

  /** POST /auth/login */
  router.post("/login", loginRateLimiter, controller.login);

  return router;
};
