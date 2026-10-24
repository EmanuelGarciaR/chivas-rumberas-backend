import { Router } from "express";
import { ChivasController } from "../controllers/chivas.controller";

export const createChivasRouter = (controller: ChivasController): Router => {
  const router = Router();

  /** GET /chivas?status=available — Público */
  router.get("/", controller.getAll);

  /** GET /chivas/:id — Público */
  router.get("/:id", controller.getById);

  return router;
};
